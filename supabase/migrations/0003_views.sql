-- 0003_views.sql — clinician aggregation views (BUILD_GUIDE.md Section 3.5).
--
-- Every view is security_invoker: it runs with the caller's RLS, so a
-- clinician only ever aggregates their own enrolled patients. (Without it a
-- view runs as its owner and would leak every teen to every user.)
--
-- "On time" = a dose logged with status 'taken'. Thresholds that mirror the
-- experiment engine (lib/engine/experiment.ts): a winner needs at least
-- 3 logged days per arm and |lift| >= 0.15.

-- Per experiment: on-time rate and ease per arm, and the lift (B - A).
create view public.v_experiment_results
with (security_invoker = true) as
select
  e.id as experiment_id,
  e.teen_id,
  e.factor,
  e.status,
  e.decision,
  e.started_at,
  e.days,
  count(*) filter (where d.arm = 'A' and d.status is not null) as a_days,
  count(*) filter (where d.arm = 'B' and d.status is not null) as b_days,
  avg((d.status = 'taken')::int) filter (where d.arm = 'A' and d.status is not null)::numeric(4, 3) as a_on_time,
  avg((d.status = 'taken')::int) filter (where d.arm = 'B' and d.status is not null)::numeric(4, 3) as b_on_time,
  avg(d.ease) filter (where d.arm = 'A')::numeric(3, 2) as a_ease,
  avg(d.ease) filter (where d.arm = 'B')::numeric(3, 2) as b_ease,
  (avg((d.status = 'taken')::int) filter (where d.arm = 'B' and d.status is not null)
   - avg((d.status = 'taken')::int) filter (where d.arm = 'A' and d.status is not null))::numeric(4, 3) as lift
from public.experiments e
left join public.experiment_days d on d.experiment_id = e.id
group by e.id;

-- Strategy leaderboard: which factors teens try, adopt, and how much they help.
create view public.v_strategy_leaderboard
with (security_invoker = true) as
select
  r.factor as strategy,
  count(*) filter (where r.status = 'done') as teens_tried,
  round(100.0 * count(*) filter (where r.decision = 'adopted')
        / nullif(count(*) filter (where r.status = 'done'), 0)) as pct_adopted,
  round(100 * avg(r.lift) filter (where r.decision = 'adopted')) as avg_improvement_pts
from public.v_experiment_results r
group by r.factor;

-- Daily adherence per teen, verified vs self-reported (patient-detail chart).
create view public.v_daily_adherence
with (security_invoker = true) as
select
  d.teen_id,
  (d.scheduled_at at time zone 'UTC')::date as day,
  count(*) as doses_logged,
  count(*) filter (where d.status = 'taken') as on_time,
  count(*) filter (where d.status in ('taken', 'late')) as self_reported_taken,
  count(*) filter (where d.status in ('taken', 'late') and d.verified) as verified_taken
from public.dose_logs d
group by d.teen_id, (d.scheduled_at at time zone 'UTC')::date;

-- Attention list. `reasons` holds keys the app maps to i18n messages:
--   not_logging   no dose logged in 3+ days (or never, once onboarded 3+ days)
--   dropping      on-time rate fell 15+ points, last 7 days vs the 7 before
--                 (same threshold as lib/engine/adherence.ts)
--   too_close     a finished experiment with no clear winner
create view public.v_attention_list
with (security_invoker = true) as
with dose_stats as (
  select
    d.teen_id,
    max(d.logged_at) as last_log,
    avg((d.status = 'taken')::int) filter (where d.scheduled_at >= now() - interval '7 days') as on_time_7d,
    avg((d.status = 'taken')::int) filter (where d.scheduled_at <  now() - interval '7 days'
                                             and d.scheduled_at >= now() - interval '14 days') as on_time_prev_7d
  from public.dose_logs d
  group by d.teen_id
),
close_calls as (
  select r.teen_id, count(*) as too_close_count
  from public.v_experiment_results r
  where r.status = 'done'
    and (r.a_days < 3 or r.b_days < 3 or abs(coalesce(r.lift, 0)) < 0.15)
    and r.decision is distinct from 'adopted'
  group by r.teen_id
),
flags as (
  select
    p.id as teen_id,
    p.display_name,
    s.last_log,
    now() - s.last_log as since_last_log,
    s.on_time_7d::numeric(4, 3) as on_time_7d,
    s.on_time_prev_7d::numeric(4, 3) as on_time_prev_7d,
    coalesce(s.last_log, p.created_at) < now() - interval '3 days' as not_logging,
    coalesce(s.on_time_prev_7d - s.on_time_7d >= 0.15, false) as dropping,
    coalesce(c.too_close_count, 0) > 0 as too_close
  from public.profiles p
  left join dose_stats s on s.teen_id = p.id
  left join close_calls c on c.teen_id = p.id
  where p.role = 'teen'
)
select
  f.teen_id,
  f.display_name,
  f.last_log,
  f.since_last_log,
  f.on_time_7d,
  f.on_time_prev_7d,
  array_remove(array[
    case when f.not_logging then 'not_logging' end,
    case when f.dropping then 'dropping' end,
    case when f.too_close then 'too_close' end
  ], null) as reasons,
  (f.not_logging or f.dropping or f.too_close) as needs_attention
from flags f;

-- Clinic overview (one row for the caller's visible patients).
--   on_time_before / on_time_after: average on-time rate in the 14 days
--   before an adopted experiment started vs the 14 days after it ended.
--   self_managing: has adopted a strategy and is 80%+ on time in 14 days.
create view public.v_clinic_overview
with (security_invoker = true) as
with adopted as (
  select e.teen_id, e.started_at, e.started_at + make_interval(days => e.days) as ended_at
  from public.experiments e
  where e.decision = 'adopted'
),
before_after as (
  select
    a.teen_id,
    (select avg((d.status = 'taken')::int) from public.dose_logs d
      where d.teen_id = a.teen_id
        and d.scheduled_at >= a.started_at - interval '14 days'
        and d.scheduled_at <  a.started_at) as before_rate,
    (select avg((d.status = 'taken')::int) from public.dose_logs d
      where d.teen_id = a.teen_id
        and d.scheduled_at >= a.ended_at
        and d.scheduled_at <  a.ended_at + interval '14 days') as after_rate
  from adopted a
),
recent as (
  select d.teen_id, avg((d.status = 'taken')::int) as rate
  from public.dose_logs d
  where d.scheduled_at >= now() - interval '14 days'
  group by d.teen_id
)
select
  (select count(*) from public.profiles p where p.role = 'teen') as teens,
  (select count(*) from public.experiments) as experiments_started,
  (select count(*) from public.experiments where status = 'done') as experiments_finished,
  (select avg(before_rate) from before_after)::numeric(4, 3) as on_time_before,
  (select avg(after_rate) from before_after)::numeric(4, 3) as on_time_after,
  (select count(distinct a.teen_id) from adopted a
     join recent r on r.teen_id = a.teen_id
    where r.rate >= 0.8) as self_managing;

revoke all on
  public.v_experiment_results, public.v_strategy_leaderboard, public.v_daily_adherence,
  public.v_attention_list, public.v_clinic_overview
from anon;
grant select on
  public.v_experiment_results, public.v_strategy_leaderboard, public.v_daily_adherence,
  public.v_attention_list, public.v_clinic_overview
to authenticated;
