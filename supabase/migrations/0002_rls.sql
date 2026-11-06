-- 0002_rls.sql — Row-Level Security, privileges and the triggers/RPCs that
-- security depends on (BUILD_GUIDE.md Section 3.4).
--
-- Rule of thumb: teen = full on own rows; parent = narrow read + confirm,
-- gated by guardian_links.share_level; clinician = read on enrolled patients;
-- catalogs = read for any signed-in user. `anon` gets nothing.
--
-- share_level meaning:
--   confirm_only  parent sees the teen's name, meds, and doses from the last
--                 48 hours so they can confirm them. No history.
--   adherence     + full dose history (adherence over time).
--   full          + barriers, experiments, game progress.
--
-- Game tables (game_state, quest_progress, achievement_unlocks) are
-- read-only for clients. XP is written server-side with the service-role
-- client so a teen can't award themselves XP through the REST API.

-- ---------------------------------------------------------------------------
-- Helper functions. SECURITY DEFINER so they can read link tables without
-- re-entering RLS (which would recurse). They only ever answer questions
-- about the calling user.
-- ---------------------------------------------------------------------------

create schema if not exists private;
grant usage on schema private to authenticated;

create function private.share_rank(p_level text)
returns int
language sql immutable
set search_path = ''
as $$
  select case p_level when 'full' then 3 when 'adherence' then 2 when 'confirm_only' then 1 else 0 end;
$$;

-- Is the caller an active parent of this teen?
create function private.is_active_parent(p_teen uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.guardian_links g
    where g.teen_id = p_teen
      and g.parent_id = (select auth.uid())
      and g.status = 'active'
  );
$$;

-- Does the caller's active parent link to this teen reach at least p_min?
create function private.parent_can_see(p_teen uuid, p_min text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.guardian_links g
    where g.teen_id = p_teen
      and g.parent_id = (select auth.uid())
      and g.status = 'active'
      and private.share_rank(g.share_level) >= private.share_rank(p_min)
  );
$$;

-- Is the caller an active clinician of this teen?
create function private.is_clinician_of(p_teen uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.care_links c
    where c.teen_id = p_teen
      and c.clinician_id = (select auth.uid())
      and c.status = 'active'
  );
$$;

-- Is p_person an active parent or clinician of the caller (a teen)?
create function private.is_my_supporter(p_person uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.guardian_links g
    where g.teen_id = (select auth.uid()) and g.parent_id = p_person and g.status = 'active'
  ) or exists (
    select 1 from public.care_links c
    where c.teen_id = (select auth.uid()) and c.clinician_id = p_person and c.status = 'active'
  );
$$;

-- Is p_parent an active parent of the caller (a teen)?
create function private.is_my_active_parent(p_parent uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.guardian_links g
    where g.teen_id = (select auth.uid()) and g.parent_id = p_parent and g.status = 'active'
  );
$$;

create function private.my_role()
returns public.app_role
language sql stable security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid());
$$;

revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Baseline privileges. Supabase grants ALL on new tables to anon and
-- authenticated; RLS policies below narrow rows, column grants narrow
-- which columns a client may write.
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon;

-- Catalogs and server-written tables: no client writes at all.
revoke insert, update, delete on
  public.medications, public.medication_content, public.barriers,
  public.quests, public.achievements, public.care_links,
  public.game_state, public.quest_progress, public.achievement_unlocks
from authenticated;

-- profiles: a user may never change their own role (or id).
revoke insert, update on public.profiles from authenticated;
grant insert (id, role, display_name, locale, age_band, a11y) on public.profiles to authenticated;
grant update (display_name, locale, age_band, a11y) on public.profiles to authenticated;

-- guardian_links: a teen inserts a pending invite (directly or via
-- create_guardian_invite()). parent_id and status can't be written by any
-- client, so a link only becomes active when a parent redeems the code
-- (accept_guardian_invite(), or a service-role server action). The teen may
-- change share_level and revoke.
revoke insert, update on public.guardian_links from authenticated;
grant insert (teen_id, invite_code, share_level) on public.guardian_links to authenticated;
grant update (share_level, status) on public.guardian_links to authenticated;

-- dose_logs: `verified` is set only by the parent-confirmation trigger.
revoke insert, update on public.dose_logs from authenticated;
grant insert (id, teen_id, patient_medication_id, scheduled_at, status, logged_at, experiment_id)
  on public.dose_logs to authenticated;
grant update (status, experiment_id) on public.dose_logs to authenticated;

-- parent_confirmations: insert-only for parents.
revoke insert, update on public.parent_confirmations from authenticated;
grant insert (id, dose_log_id, parent_id, confirmed) on public.parent_confirmations to authenticated;

-- notifications: recipients may only flip `read`.
revoke update on public.notifications from authenticated;
grant update (read) on public.notifications to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.guardian_links enable row level security;
alter table public.care_links enable row level security;
alter table public.medications enable row level security;
alter table public.medication_content enable row level security;
alter table public.patient_medications enable row level security;
alter table public.dose_logs enable row level security;
alter table public.parent_confirmations enable row level security;
alter table public.barriers enable row level security;
alter table public.teen_barriers enable row level security;
alter table public.experiments enable row level security;
alter table public.experiment_days enable row level security;
alter table public.game_state enable row level security;
alter table public.quests enable row level security;
alter table public.quest_progress enable row level security;
alter table public.achievements enable row level security;
alter table public.achievement_unlocks enable row level security;
alter table public.notifications enable row level security;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

-- profiles ------------------------------------------------------------------
create policy "read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "parent or clinician reads linked teen" on public.profiles
  for select to authenticated using (private.is_active_parent(id) or private.is_clinician_of(id));
create policy "teen reads own parent and clinician" on public.profiles
  for select to authenticated using (private.is_my_supporter(id));
-- Fallback if sign-up metadata had no role: the app inserts the profile.
-- Nobody can make themselves a clinician this way.
create policy "insert own profile as teen or parent" on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()) and role in ('teen', 'parent'));
create policy "update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- guardian_links --------------------------------------------------------------
create policy "teen or parent reads own links" on public.guardian_links
  for select to authenticated
  using (teen_id = (select auth.uid()) or parent_id = (select auth.uid()));
create policy "teen creates own invites" on public.guardian_links
  for insert to authenticated
  with check (teen_id = (select auth.uid()) and private.my_role() = 'teen');
-- A teen can't flip an unclaimed invite to active (it has no parent yet).
create policy "teen updates own links" on public.guardian_links
  for update to authenticated
  using (teen_id = (select auth.uid()))
  with check (teen_id = (select auth.uid()) and (status <> 'active' or parent_id is not null));
create policy "teen deletes own links" on public.guardian_links
  for delete to authenticated using (teen_id = (select auth.uid()));

-- care_links (written by staff / seed only) -----------------------------------
create policy "teen or clinician reads own care links" on public.care_links
  for select to authenticated
  using (teen_id = (select auth.uid()) or clinician_id = (select auth.uid()));

-- catalogs --------------------------------------------------------------------
create policy "catalog read" on public.medications for select to authenticated using (true);
create policy "catalog read" on public.medication_content for select to authenticated using (true);
create policy "catalog read" on public.barriers for select to authenticated using (true);
create policy "catalog read" on public.quests for select to authenticated using (true);
create policy "catalog read" on public.achievements for select to authenticated using (true);

-- patient_medications ---------------------------------------------------------
create policy "teen rw own meds" on public.patient_medications
  for all to authenticated
  using (teen_id = (select auth.uid())) with check (teen_id = (select auth.uid()));
create policy "parent or clinician reads meds" on public.patient_medications
  for select to authenticated
  using (private.is_active_parent(teen_id) or private.is_clinician_of(teen_id));

-- dose_logs -------------------------------------------------------------------
create policy "teen reads own doses" on public.dose_logs
  for select to authenticated using (teen_id = (select auth.uid()));
create policy "teen inserts own doses" on public.dose_logs
  for insert to authenticated
  with check (
    teen_id = (select auth.uid())
    and exists (select 1 from public.patient_medications pm
                where pm.id = patient_medication_id and pm.teen_id = (select auth.uid()))
    and (experiment_id is null or exists (
          select 1 from public.experiments e
          where e.id = experiment_id and e.teen_id = (select auth.uid())))
  );
create policy "teen updates own doses" on public.dose_logs
  for update to authenticated
  using (teen_id = (select auth.uid()))
  with check (
    teen_id = (select auth.uid())
    and (experiment_id is null or exists (
          select 1 from public.experiments e
          where e.id = experiment_id and e.teen_id = (select auth.uid())))
  );
create policy "teen deletes own doses" on public.dose_logs
  for delete to authenticated using (teen_id = (select auth.uid()));
create policy "parent reads history with adherence share" on public.dose_logs
  for select to authenticated using (private.parent_can_see(teen_id, 'adherence'));
create policy "parent reads recent doses to confirm" on public.dose_logs
  for select to authenticated
  using (scheduled_at > now() - interval '48 hours' and private.is_active_parent(teen_id));
create policy "clinician reads enrolled teen doses" on public.dose_logs
  for select to authenticated using (private.is_clinician_of(teen_id));

-- parent_confirmations ----------------------------------------------------------
create policy "parent reads own confirmations" on public.parent_confirmations
  for select to authenticated using (parent_id = (select auth.uid()));
-- Teen and clinician: visible whenever the dose itself is visible to them.
create policy "teen or clinician reads confirmations" on public.parent_confirmations
  for select to authenticated
  using (exists (
    select 1 from public.dose_logs d
    where d.id = dose_log_id
      and (d.teen_id = (select auth.uid()) or private.is_clinician_of(d.teen_id))
  ));
-- The dose must be visible to the parent (so confirm_only parents can only
-- confirm the last 48 hours) and logged as taken or late.
create policy "parent confirms linked teen" on public.parent_confirmations
  for insert to authenticated
  with check (
    parent_id = (select auth.uid())
    and exists (
      select 1 from public.dose_logs d
      where d.id = dose_log_id
        and d.status in ('taken', 'late')
        and private.is_active_parent(d.teen_id)
    )
  );

-- teen_barriers -------------------------------------------------------------------
create policy "teen rw own barriers" on public.teen_barriers
  for all to authenticated
  using (teen_id = (select auth.uid())) with check (teen_id = (select auth.uid()));
create policy "clinician or full-share parent reads barriers" on public.teen_barriers
  for select to authenticated
  using (private.is_clinician_of(teen_id) or private.parent_can_see(teen_id, 'full'));

-- experiments -----------------------------------------------------------------------
create policy "teen rw own experiments" on public.experiments
  for all to authenticated
  using (teen_id = (select auth.uid())) with check (teen_id = (select auth.uid()));
create policy "clinician or full-share parent reads experiments" on public.experiments
  for select to authenticated
  using (private.is_clinician_of(teen_id) or private.parent_can_see(teen_id, 'full'));

-- experiment_days (visibility follows the parent experiment) --------------------------
create policy "read days of visible experiments" on public.experiment_days
  for select to authenticated
  using (exists (select 1 from public.experiments e where e.id = experiment_id));
create policy "teen writes days of own experiments" on public.experiment_days
  for all to authenticated
  using (exists (select 1 from public.experiments e
                 where e.id = experiment_id and e.teen_id = (select auth.uid())))
  with check (exists (select 1 from public.experiments e
                      where e.id = experiment_id and e.teen_id = (select auth.uid())));

-- game tables (read-only for clients) ---------------------------------------------------
create policy "read own or linked game state" on public.game_state
  for select to authenticated
  using (teen_id = (select auth.uid()) or private.is_clinician_of(teen_id)
         or private.parent_can_see(teen_id, 'full'));
create policy "read own or linked quest progress" on public.quest_progress
  for select to authenticated
  using (teen_id = (select auth.uid()) or private.is_clinician_of(teen_id)
         or private.parent_can_see(teen_id, 'full'));
create policy "read own or linked achievements" on public.achievement_unlocks
  for select to authenticated
  using (teen_id = (select auth.uid()) or private.is_clinician_of(teen_id)
         or private.parent_can_see(teen_id, 'full'));

-- notifications -------------------------------------------------------------------------
create policy "read own notifications" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "mark own notifications read" on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "delete own notifications" on public.notifications
  for delete to authenticated using (user_id = (select auth.uid()));
-- Self-notifications (halfway, complete…), a teen asking their linked parent
-- to confirm, and a clinician suggesting something to an enrolled teen.
create policy "send allowed notifications" on public.notifications
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    or (type = 'confirm_request' and private.is_my_active_parent(user_id))
    or (type = 'suggestion' and private.is_clinician_of(user_id))
  );

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Create a profile when an auth user is created.
--   * clinician: only from app_metadata.role (settable by the service role
--     only), so nobody can sign themselves up as a clinician.
--   * teen / parent: from user_metadata.role, set by the sign-up form.
--   * otherwise no profile; the app inserts one after asking for a role.
create function private.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_role public.app_role;
begin
  if new.raw_app_meta_data ->> 'role' = 'clinician' then
    v_role := 'clinician';
  elsif new.raw_user_meta_data ->> 'role' in ('teen', 'parent') then
    v_role := (new.raw_user_meta_data ->> 'role')::public.app_role;
  else
    return new;
  end if;

  insert into public.profiles (id, role, display_name, locale)
  values (
    new.id,
    v_role,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
             nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
             'Friend'),
    case when new.raw_user_meta_data ->> 'locale' in ('en', 'es')
         then new.raw_user_meta_data ->> 'locale' else 'en' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Every teen starts with a game_state row (XP 0, level 1).
create function private.handle_new_teen()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.role = 'teen' then
    insert into public.game_state (teen_id) values (new.id) on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute function private.handle_new_teen();

-- A parent's "I saw them take it" marks the dose verified.
create function private.handle_parent_confirmation()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.confirmed then
    update public.dose_logs set verified = true where id = new.dose_log_id;
  end if;
  return new;
end;
$$;

create trigger on_parent_confirmation
  after insert on public.parent_confirmations
  for each row execute function private.handle_parent_confirmation();

-- If the teen changes a dose's status after it was verified, the old
-- verification no longer applies.
create function private.reset_verified_on_status_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.verified := false;
  end if;
  return new;
end;
$$;

create trigger dose_status_changed
  before update on public.dose_logs
  for each row execute function private.reset_verified_on_status_change();

-- ---------------------------------------------------------------------------
-- RPCs for account linking (callable via supabase.rpc()).
-- ---------------------------------------------------------------------------

-- Teen: create a pending parent invite and return its 8-character code.
create function public.create_guardian_invite(p_share_level text default 'confirm_only')
returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no 0/O/1/I
  v_bytes bytea;
  v_code text;
  v_i int;
begin
  if (select auth.uid()) is null or private.my_role() is distinct from 'teen' then
    raise exception 'only_teens_can_invite' using errcode = '42501';
  end if;
  if p_share_level not in ('confirm_only', 'adherence', 'full') then
    raise exception 'invalid_share_level' using errcode = '22023';
  end if;

  loop
    -- gen_random_uuid() uses a strong random source. Skip the version and
    -- variant bytes (6 and 8). 256 % 32 = 0, so each character is uniform.
    v_bytes := uuid_send(gen_random_uuid());
    v_code := '';
    foreach v_i in array array[0, 1, 2, 3, 4, 5, 10, 11] loop
      v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, v_i) % 32) + 1, 1);
    end loop;
    begin
      insert into public.guardian_links (teen_id, invite_code, share_level)
      values ((select auth.uid()), v_code, p_share_level);
      return v_code;
    exception when unique_violation then
      -- Code collision: try again.
    end;
  end loop;
end;
$$;

-- Parent: redeem an invite code. Returns the teen's id.
create function public.accept_guardian_invite(p_code text)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_link public.guardian_links;
begin
  if (select auth.uid()) is null or private.my_role() is distinct from 'parent' then
    raise exception 'only_parents_can_accept' using errcode = '42501';
  end if;

  select * into v_link
  from public.guardian_links
  where invite_code = upper(btrim(p_code)) and status = 'pending'
  for update;

  if not found then
    raise exception 'invite_not_found' using errcode = 'P0002';
  end if;

  if exists (select 1 from public.guardian_links
             where teen_id = v_link.teen_id and parent_id = (select auth.uid())) then
    raise exception 'already_linked' using errcode = '23505';
  end if;

  update public.guardian_links
  set parent_id = (select auth.uid()), status = 'active'
  where id = v_link.id;

  return v_link.teen_id;
end;
$$;

revoke all on function public.create_guardian_invite(text) from public, anon;
revoke all on function public.accept_guardian_invite(text) from public, anon;
grant execute on function public.create_guardian_invite(text) to authenticated;
grant execute on function public.accept_guardian_invite(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: parent confirm screen, clinician live updates, notification bell.
-- Realtime applies the RLS policies above to every change it sends.
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime
      add table public.dose_logs, public.parent_confirmations, public.notifications;
  end if;
end;
$$;
