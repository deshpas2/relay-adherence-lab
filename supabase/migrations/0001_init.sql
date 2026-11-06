-- 0001_init.sql — Relay schema (BUILD_GUIDE.md Section 3.1–3.3).
--
-- Additions beyond the guide are marked "ADDED" and explained in
-- docs/decisions.md. They only add columns, checks and indexes; nothing in
-- the guide's schema is renamed or removed.
--
-- Localization rule for catalog rows: the guide's text columns hold English;
-- other locales live in an `i18n` jsonb column shaped
-- {"es": {"<column>": "..."}}. medication_content keeps its per-locale rows.

-- ---------------------------------------------------------------------------
-- 3.1 Identity & relationships
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('teen', 'parent', 'clinician');

-- One row per auth user. Created by the on_auth_user_created trigger (0002).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null,
  display_name text not null,
  locale text not null default 'en',
  -- Do not store a minor's date of birth. Use an age band.
  age_band text check (age_band in ('13-15', '16-18')),
  a11y jsonb not null default '{}' check (jsonb_typeof(a11y) = 'object'),
  created_at timestamptz not null default now()
);

create type public.link_status as enum ('pending', 'active', 'revoked');

-- Teen <-> parent. The teen creates an invite code; the parent redeems it.
create table public.guardian_links (
  id uuid primary key default gen_random_uuid(),
  teen_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.profiles (id) on delete set null,
  invite_code text unique not null,
  status public.link_status not null default 'pending',
  -- What the teen lets the parent see.
  share_level text not null default 'confirm_only'
    check (share_level in ('confirm_only', 'adherence', 'full')),
  created_at timestamptz not null default now()
);
create index guardian_links_teen_idx on public.guardian_links (teen_id);
create index guardian_links_parent_idx on public.guardian_links (parent_id);
-- ADDED: a parent links to a given teen at most once.
create unique index guardian_links_teen_parent_key
  on public.guardian_links (teen_id, parent_id) where parent_id is not null;

-- Clinician <-> teen.
create table public.care_links (
  id uuid primary key default gen_random_uuid(),
  teen_id uuid not null references public.profiles (id) on delete cascade,
  clinician_id uuid not null references public.profiles (id) on delete cascade,
  status public.link_status not null default 'active',
  enrolled_at timestamptz not null default now(),
  unique (teen_id, clinician_id)
);
create index care_links_clinician_idx on public.care_links (clinician_id);

-- ---------------------------------------------------------------------------
-- 3.2 Medications & the "why" explorer content
-- ---------------------------------------------------------------------------

create type public.med_form as enum ('pill', 'capsule', 'syrup', 'tablet', 'inhaler');

-- Catalog of sample medicines.
create table public.medications (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  display_name text not null,
  form public.med_form not null,
  color text,
  is_sample boolean not null default true,
  -- ADDED: {"es": {"display_name": ...}} (e.g. "Micofenolato").
  i18n jsonb not null default '{}' check (jsonb_typeof(i18n) = 'object')
);

-- Explorable content, one row per locale. HAND-AUTHORED; never generated
-- at runtime.
create table public.medication_content (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications (id) on delete cascade,
  locale text not null default 'en',
  what_it_is text not null,
  why_it_matters text not null,
  -- [{name, role, plain}]
  ingredients jsonb not null check (jsonb_typeof(ingredients) = 'array'),
  -- [{step, text}]
  flow jsonb not null check (jsonb_typeof(flow) = 'array'),
  reviewed boolean not null default false,
  unique (medication_id, locale)
);

-- A teen's regimen. Schedule only: there is deliberately no dose column.
create table public.patient_medications (
  id uuid primary key default gen_random_uuid(),
  teen_id uuid not null references public.profiles (id) on delete cascade,
  medication_id uuid not null references public.medications (id),
  -- [{time: '07:30', label: 'morning'}]
  schedule jsonb not null check (jsonb_typeof(schedule) = 'array'),
  is_controller boolean not null default true,
  created_at timestamptz not null default now()
);
create index patient_medications_teen_idx on public.patient_medications (teen_id);

-- ---------------------------------------------------------------------------
-- 3.3 Adherence, barriers, experiments, game
-- ---------------------------------------------------------------------------

create type public.dose_status as enum ('taken', 'late', 'missed', 'skipped');

create type public.exp_status as enum ('active', 'done', 'abandoned');
create type public.exp_decision as enum ('adopted', 'rerun', 'dropped');

create table public.barriers (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  -- ADDED: English label + {"es": {"label": ...}}.
  label text not null,
  i18n jsonb not null default '{}' check (jsonb_typeof(i18n) = 'object'),
  created_at timestamptz not null default now()
);

create table public.teen_barriers (
  id uuid primary key default gen_random_uuid(),
  teen_id uuid not null references public.profiles (id) on delete cascade,
  barrier_id uuid references public.barriers (id),
  is_primary boolean not null default false,
  free_text text,
  created_at timestamptz not null default now(),
  -- ADDED: a row is either a catalog barrier or the "Other" box.
  check (barrier_id is not null or nullif(btrim(free_text), '') is not null)
);
create index teen_barriers_teen_idx on public.teen_barriers (teen_id);

-- Experiments (A/B, 2-week crossover) — the "quests".
create table public.experiments (
  id uuid primary key default gen_random_uuid(),
  teen_id uuid not null references public.profiles (id) on delete cascade,
  barrier_id uuid references public.barriers (id),
  factor text not null check (factor in ('timing', 'place', 'cue', 'who', 'style')),
  hypothesis text not null,
  arm_a text not null,
  arm_b text not null,
  days int not null default 14 check (days between 2 and 60),
  status public.exp_status not null default 'active',
  decision public.exp_decision,
  started_at timestamptz not null default now()
);
create index experiments_teen_idx on public.experiments (teen_id);

create table public.experiment_days (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.experiments (id) on delete cascade,
  day_index int not null check (day_index >= 1),
  arm char(1) not null check (arm in ('A', 'B')),
  status public.dose_status,
  ease smallint check (ease between 1 and 5),
  logged_at timestamptz,
  unique (experiment_id, day_index)
);

create table public.dose_logs (
  id uuid primary key default gen_random_uuid(),
  teen_id uuid not null references public.profiles (id) on delete cascade,
  patient_medication_id uuid not null references public.patient_medications (id) on delete cascade,
  scheduled_at timestamptz not null,
  status public.dose_status not null,
  logged_at timestamptz not null default now(),
  -- Set true only by the parent-confirmation trigger (0002).
  verified boolean not null default false,
  -- ADDED: foreign key (the guide left it bare).
  experiment_id uuid references public.experiments (id) on delete set null
);
create index dose_logs_teen_scheduled_idx on public.dose_logs (teen_id, scheduled_at desc);
create index dose_logs_experiment_idx on public.dose_logs (experiment_id);

create table public.parent_confirmations (
  id uuid primary key default gen_random_uuid(),
  dose_log_id uuid not null references public.dose_logs (id) on delete cascade,
  parent_id uuid not null references public.profiles (id) on delete cascade,
  confirmed boolean not null,
  confirmed_at timestamptz not null default now(),
  -- ADDED: one answer per parent per dose.
  unique (dose_log_id, parent_id)
);

-- Gamification (positive-only: XP never goes down).
create table public.game_state (
  teen_id uuid primary key references public.profiles (id) on delete cascade,
  xp int not null default 0 check (xp >= 0),
  level int not null default 1 check (level >= 1),
  updated_at timestamptz not null default now()
);

create table public.quests (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  title text not null,
  description text not null,
  xp_reward int not null check (xp_reward >= 0),
  kind text not null check (kind in ('experiment', 'streak', 'explore', 'onboard')),
  -- ADDED: {"es": {"title": ..., "description": ...}}.
  i18n jsonb not null default '{}' check (jsonb_typeof(i18n) = 'object')
);

create type public.quest_status as enum ('available', 'active', 'complete');

create table public.quest_progress (
  id uuid primary key default gen_random_uuid(),
  teen_id uuid not null references public.profiles (id) on delete cascade,
  quest_id uuid not null references public.quests (id),
  status public.quest_status not null default 'available',
  progress numeric not null default 0 check (progress between 0 and 1),
  completed_at timestamptz,
  unique (teen_id, quest_id)
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  title text not null,
  description text not null,
  icon text,
  -- ADDED: {"es": {"title": ..., "description": ...}}.
  i18n jsonb not null default '{}' check (jsonb_typeof(i18n) = 'object')
);

create table public.achievement_unlocks (
  id uuid primary key default gen_random_uuid(),
  teen_id uuid not null references public.profiles (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id),
  unlocked_at timestamptz not null default now(),
  unique (teen_id, achievement_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- 'halfway' | 'complete' | 'motivational' | 'confirm_request' (open set)
  type text not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
