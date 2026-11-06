# Relay — Build Guide (DEAP)

**A fun, interactive adherence platform for teen kidney-transplant patients.** Teens run small experiments on their own routine, explore *why* each medicine matters, earn their way through levels, and a parent can confirm doses so clinicians see real adherence.

**Stack:** Next.js (App Router) + TypeScript + Supabase (Postgres, Auth, Storage, RLS, Realtime) + Tailwind. Deploy on Vercel.
**Team:** 3 people, ~12 hours with Claude Code. Real product, not a throwaway prototype.
**Product name in code:** `relay` (rename freely).

> This file is the source of truth. Put it at the repo root as `BUILD_GUIDE.md`, add the `CLAUDE.md` (Appendix A), and run Claude Code one phase at a time. When this guide conflicts with a model's default instinct, follow this guide.

---

## 0. How to use this guide

1. One person does **Phase 0** (scaffold + Supabase project + schema) alone, so everyone starts from the same foundation.
2. After Phase 0, the three lanes (Section 7) run in parallel. Each phase lists per-lane tasks and a ready-to-paste Claude Code prompt.
3. Commit after every phase. Merge to `main` often (every 60–90 min). Short-lived branches `lane-db`, `lane-fe`, `lane-be`.
4. The **contract** between people is two things: the **database schema** (Section 3) and the **generated TypeScript types** (`supabase gen types typescript`). Don't change a shared table or type without telling the other two.
5. Definition of done for each phase: `npm run typecheck && npm run lint && npm test` pass, the feature works against the real Supabase project, and it's committed.

### Hard rules (safety — non-negotiable, enforce in code and copy)
- **Never** show, suggest, or let any screen change a dose amount, timing-as-prescribed, or whether to take a medicine. Relay changes *routine and behaviour* (when/where/how/who helps), never the prescription. Dose questions route to the care team.
- The "why this medicine" content is **hand-authored, clinician-reviewable placeholder content** stored in the database — it is **never AI-generated at runtime** and never contradicts the prescription. Every med screen carries: *"Sample education, reviewed by your care team. Not medical advice."*
- Patients are **minors**. Enforce privacy with Row-Level Security on every table (Section 3.4). A teen controls what their parent sees; a clinician sees only their enrolled patients; no role sees another's data by default.
- **No guilt mechanics.** The game is positive-only: you *earn* XP and unlock levels. Never "you lost your streak," never red failure screens, never shame copy. A missed dose is data, handled kindly.
- Every teen-facing string passes the copy lint (Section 6.4): no dosing words, no shame words, reading level ≤ grade 6, no medication names invented by the app.
- All demo data is clearly simulated/de-identified. No real patient data in the repo.

---

## 1. Product overview

### 1.1 The three interfaces (one app, role-based)
| Role | Route group | What they do |
|---|---|---|
| **Teen** | `(teen)` | Onboarding + barrier check-in, log doses, explore their meds ("why"), run experiments as quests, earn XP/levels, control sharing/language/accessibility. |
| **Parent/guardian** | `(parent)` | Link to their teen (invite code), see adherence at the level the teen allows, **confirm doses** they witnessed. Respectful of teen autonomy. |
| **Clinician** | `(clinic)` | See enrolled patients, each teen's experiments and verified adherence, the strategy leaderboard, the attention list, and recommend an experiment during a visit. |

One Next.js app. A user's `role` (in their profile) decides which route group and nav they get. Middleware guards each group.

### 1.2 The core loop (teen)
1. **Onboarding:** one-line intro, the "we never change your dose" disclaimer, a privacy explainer ("your care team sees your experiment results"), a short tooltip walkthrough, then a **barrier check-in** (pick from the barriers list + an "Other" free-text).
2. **Explore my meds:** an interactive card per medicine — tap the pill/syrup to open dialogue-box / flow-chart explanations of what's in it and why it matters *to them*.
3. **Log doses:** quick "took it" logging. A parent can **confirm**, which marks the dose *verified* for the clinician.
4. **Experiments as quests:** Relay suggests ≥2 experiments from the teen's barriers. Each experiment is a 2-week A/B "quest." Finishing it earns XP and shows an honest result (which option worked).
5. **Level up:** consistency and finishing quests earn XP → levels unlock. Half-way and completion pop-ups keep it motivating.

### 1.3 What each feature maps to (so nothing is hand-wavy)
| Feature | Screens | Backend | Tables |
|---|---|---|---|
| Onboarding + barriers | `(teen)/onboarding/*` | server actions | `teen_barriers`, `profiles` |
| Explore meds ("why") | `(teen)/meds/[id]` | read-only | `medications`, `medication_content`, `patient_medications` |
| Dose logging | `(teen)/home`, `(teen)/log` | `logDose` action | `dose_logs` |
| Parent confirmation | `(parent)/confirm` | `confirmDose` action + Realtime | `parent_confirmations`, `dose_logs` |
| Experiments (quests) | `(teen)/experiments/*` | experiment engine | `experiments`, `experiment_days` |
| Gamification | `(teen)/home`, badges | game engine | `game_state`, `quests`, `quest_progress`, `achievements`, `achievement_unlocks` |
| Clinician dashboard | `(clinic)/*` | SQL views | `v_strategy_leaderboard`, `v_attention_list`, `v_clinic_overview` |
| Notifications | global | notification triggers | `notifications` |

---

## 2. Architecture

- **Next.js (latest stable, App Router), TypeScript strict.** Server Components for data reads; **Server Actions** for writes; Route Handlers only where a webhook/edge function is needed.
- **Supabase**: Postgres (the SQL layer), Auth (email magic-link + password), Storage (not used for photos — see 2.1), Realtime (parent-confirm + clinician live updates), Row-Level Security on everything.
- **Tailwind CSS** + a small design-token system (Section 5). **shadcn/ui** for primitives, **lucide-react** icons, **Recharts** for clinician charts.
- **i18n**: `next-intl`, locale auto-detected from the browser, messages in `/messages/<locale>.json`. Ship `en` + `es`.
- **State**: mostly server state (Supabase). Light client state with `zustand` where needed (onboarding wizard, game toasts).
- **Testing**: Vitest for engine/unit logic; a few Playwright smoke tests for the core loop.
- **Hosting**: Vercel (web app) + Supabase (DB/auth). Env vars in `.env.local` and Vercel project settings.

### 2.1 Decisions already made
- **Web app (PWA), not native.** Installable, mobile-first, opens on any phone.
- **No photos.** Adherence verification is **parent confirmation only** (a parent taps "I saw them take it"). Don't build Storage/photo upload.
- **Three real roles with real auth and RLS.** This is a product, so accounts and linking are real, not faked. Seed demo accounts for the demo.

### 2.2 Repo structure
```
relay/
├── BUILD_GUIDE.md            # this file
├── CLAUDE.md                 # Appendix A
├── .env.local.example
├── supabase/
│   ├── migrations/           # SQL migrations (Vrushti owns)
│   │   ├── 0001_init.sql
│   │   ├── 0002_rls.sql
│   │   ├── 0003_views.sql
│   │   └── 0004_seed.sql
│   └── seed/                 # demo data scripts
├── src/
│   ├── middleware.ts         # auth + role routing
│   ├── app/
│   │   ├── (auth)/           # sign in / sign up / link
│   │   ├── (teen)/           # teen app
│   │   ├── (parent)/         # parent app
│   │   ├── (clinic)/         # clinician dashboard
│   │   └── api/              # route handlers (webhooks, push)
│   ├── lib/
│   │   ├── supabase/         # server + browser clients
│   │   ├── engine/           # experiment + game + adherence logic (pure TS)
│   │   ├── content/          # copy lint, barrier/strategy constants
│   │   └── types/            # generated DB types + app types
│   ├── components/           # design system + shared UI
│   ├── messages/             # en.json, es.json
│   └── styles/tokens.css
└── tests/
```

---

## 3. Database schema (Vrushti owns — but everyone reads this)

Postgres via Supabase. `id` columns are `uuid default gen_random_uuid()`. Timestamps `timestamptz default now()`. Enums as Postgres enum types. **Every table has RLS enabled (3.4).**

### 3.1 Identity & relationships
```sql
create type app_role as enum ('teen','parent','clinician');

-- one row per auth user
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null,
  display_name text not null,
  locale text not null default 'en',
  -- NOTE: do not store a minor's DOB in this prototype; use age_band if needed
  age_band text,                 -- e.g. '13-15','16-18'
  a11y jsonb not null default '{}', -- {highContrast, largeText, reduceMotion, haptics}
  created_at timestamptz default now()
);

-- teen <-> parent (teen invites parent with a code; parent accepts)
create type link_status as enum ('pending','active','revoked');
create table guardian_links (
  id uuid primary key default gen_random_uuid(),
  teen_id uuid not null references profiles(id) on delete cascade,
  parent_id uuid references profiles(id) on delete set null,
  invite_code text unique not null,
  status link_status not null default 'pending',
  -- what the teen lets the parent see:
  share_level text not null default 'confirm_only', -- 'confirm_only'|'adherence'|'full'
  created_at timestamptz default now()
);

-- clinician <-> teen (clinician enrolls patient)
create table care_links (
  id uuid primary key default gen_random_uuid(),
  teen_id uuid not null references profiles(id) on delete cascade,
  clinician_id uuid not null references profiles(id) on delete cascade,
  status link_status not null default 'active',
  enrolled_at timestamptz default now(),
  unique (teen_id, clinician_id)
);
```

### 3.2 Medications & the "why" explorer content
```sql
create type med_form as enum ('pill','capsule','syrup','tablet','inhaler');

-- catalog of medicines (sample set, clinician-vetted)
create table medications (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,          -- 'tacrolimus'
  display_name text not null,         -- 'Tacrolimus'
  form med_form not null,
  color text,                          -- for the illustrated pill/syrup
  is_sample boolean not null default true
);

-- the explorable content, per locale. HAND-AUTHORED. Never AI-generated at runtime.
create table medication_content (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references medications(id) on delete cascade,
  locale text not null default 'en',
  what_it_is text not null,            -- plain, grade-6
  why_it_matters text not null,        -- "your kidney needs this so your body doesn't reject it"
  ingredients jsonb not null,          -- [{name, role, plain}] explorable hotspots
  flow jsonb not null,                 -- [{step, text}] flow-chart / dialogue sequence
  reviewed boolean not null default false,
  unique (medication_id, locale)
);

-- a teen's actual regimen (schedule only; never a dose the app can change)
create table patient_medications (
  id uuid primary key default gen_random_uuid(),
  teen_id uuid not null references profiles(id) on delete cascade,
  medication_id uuid not null references medications(id),
  schedule jsonb not null,             -- [{time:'07:30', label:'morning'}]
  is_controller boolean not null default true,
  created_at timestamptz default now()
);
```

### 3.3 Adherence, barriers, experiments, game
```sql
create type dose_status as enum ('taken','late','missed','skipped');

create table dose_logs (
  id uuid primary key default gen_random_uuid(),
  teen_id uuid not null references profiles(id) on delete cascade,
  patient_medication_id uuid not null references patient_medications(id) on delete cascade,
  scheduled_at timestamptz not null,
  status dose_status not null,
  logged_at timestamptz default now(),
  verified boolean not null default false,  -- set true when a parent confirms
  experiment_id uuid                        -- optional link to an active experiment day
);

create table parent_confirmations (
  id uuid primary key default gen_random_uuid(),
  dose_log_id uuid not null references dose_logs(id) on delete cascade,
  parent_id uuid not null references profiles(id) on delete cascade,
  confirmed boolean not null,
  confirmed_at timestamptz default now()
);

-- barrier catalog + a teen's selections
create table barriers (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,            -- 'forget','taste','embarrassed',...
  created_at timestamptz default now()
);
create table teen_barriers (
  id uuid primary key default gen_random_uuid(),
  teen_id uuid not null references profiles(id) on delete cascade,
  barrier_id uuid references barriers(id),
  is_primary boolean not null default false,
  free_text text,                      -- the "Other" box
  created_at timestamptz default now()
);

-- experiments (A/B, 2-week crossover) — these are the "quests"
create type exp_status as enum ('active','done','abandoned');
create type exp_decision as enum ('adopted','rerun','dropped');
create table experiments (
  id uuid primary key default gen_random_uuid(),
  teen_id uuid not null references profiles(id) on delete cascade,
  barrier_id uuid references barriers(id),
  factor text not null,                -- 'timing'|'place'|'cue'|'who'|'style'
  hypothesis text not null,
  arm_a text not null,                 -- current routine
  arm_b text not null,                 -- the new idea
  days int not null default 14,
  status exp_status not null default 'active',
  decision exp_decision,
  started_at timestamptz default now()
);
create table experiment_days (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references experiments(id) on delete cascade,
  day_index int not null,              -- 1..days
  arm char(1) not null check (arm in ('A','B')),
  status dose_status,                  -- filled when the teen logs that day
  ease smallint check (ease between 1 and 5),
  logged_at timestamptz,
  unique (experiment_id, day_index)
);

-- gamification (positive-only)
create table game_state (
  teen_id uuid primary key references profiles(id) on delete cascade,
  xp int not null default 0,
  level int not null default 1,
  updated_at timestamptz default now()
);
create table quests (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  title text not null,
  description text not null,
  xp_reward int not null,
  kind text not null                   -- 'experiment'|'streak'|'explore'|'onboard'
);
create type quest_status as enum ('available','active','complete');
create table quest_progress (
  id uuid primary key default gen_random_uuid(),
  teen_id uuid not null references profiles(id) on delete cascade,
  quest_id uuid not null references quests(id),
  status quest_status not null default 'available',
  progress numeric not null default 0, -- 0..1
  completed_at timestamptz,
  unique (teen_id, quest_id)
);
create table achievements (
  id uuid primary key default gen_random_uuid(),
  key text unique not null, title text not null, description text not null, icon text
);
create table achievement_unlocks (
  id uuid primary key default gen_random_uuid(),
  teen_id uuid not null references profiles(id) on delete cascade,
  achievement_id uuid not null references achievements(id),
  unlocked_at timestamptz default now(),
  unique (teen_id, achievement_id)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,                  -- 'halfway'|'complete'|'motivational'|'confirm_request'
  title text not null, body text not null,
  data jsonb not null default '{}',
  read boolean not null default false,
  created_at timestamptz default now()
);
```

### 3.4 Row-Level Security (the privacy backbone — Vrushti, do not skip)
Enable RLS on **every** table. Representative policies (write the rest by the same pattern):

```sql
alter table profiles enable row level security;
create policy "own profile" on profiles for all using (id = auth.uid());

-- a teen's dose logs: the teen, their active parent, and their clinician can read
alter table dose_logs enable row level security;
create policy "teen rw own doses" on dose_logs for all using (teen_id = auth.uid());
create policy "parent reads linked teen doses" on dose_logs for select using (
  exists (select 1 from guardian_links g
          where g.teen_id = dose_logs.teen_id and g.parent_id = auth.uid()
            and g.status = 'active' and g.share_level in ('adherence','full')));
create policy "clinician reads enrolled teen doses" on dose_logs for select using (
  exists (select 1 from care_links c
          where c.teen_id = dose_logs.teen_id and c.clinician_id = auth.uid()
            and c.status = 'active'));

-- parent can confirm only doses of a teen they're linked to
alter table parent_confirmations enable row level security;
create policy "parent confirms linked teen" on parent_confirmations for insert with check (
  parent_id = auth.uid() and exists (
    select 1 from dose_logs d join guardian_links g on g.teen_id = d.teen_id
    where d.id = dose_log_id and g.parent_id = auth.uid() and g.status='active'));

-- experiments: teen full; clinician read-only on enrolled; parent only if share_level='full'
alter table experiments enable row level security;
create policy "teen rw own experiments" on experiments for all using (teen_id = auth.uid());
create policy "clinician reads enrolled experiments" on experiments for select using (
  exists (select 1 from care_links c where c.teen_id = experiments.teen_id
          and c.clinician_id = auth.uid() and c.status='active'));
```
Rule of thumb: **teen = full on own rows; parent = narrow read + confirm, gated by `share_level`; clinician = read on enrolled patients.** Catalog tables (`medications`, `barriers`, `quests`, `achievements`, `medication_content`) are readable by all authenticated users.

### 3.5 Clinician aggregation views (power the dashboard)
```sql
-- strategy leaderboard: which experiment factors/arms teens adopt and how much they help
create view v_strategy_leaderboard as
select e.factor as strategy,
       count(*) filter (where e.status='done') as teens_tried,
       round(100.0 * count(*) filter (where e.decision='adopted')
             / nullif(count(*) filter (where e.status='done'),0)) as pct_adopted
from experiments e group by e.factor;

-- attention list: teens who stopped logging, whose tests are 'too close', or dropping
create view v_attention_list as
select p.id as teen_id, p.display_name,
       max(d.logged_at) as last_log,
       (now() - max(d.logged_at)) as since_last_log
from profiles p left join dose_logs d on d.teen_id = p.id
where p.role='teen' group by p.id, p.display_name;
```
(Expand with clinic overview: experiments started vs finished, avg on-time before/after an adopted strategy, # self-managing. Keep the heavy math in SQL views so the app just reads.)

---

## 4. Auth & roles (Sneha)

- Supabase Auth: email magic-link primary, password optional. On first sign-in, a **`profiles` row** is created with the chosen `role` (sign-up picks teen / parent / clinician).
- **`middleware.ts`**: read the session, load `profile.role`, and rewrite/guard route groups — a teen hitting `(clinic)` is redirected to `(teen)`, etc. Unauthenticated → `(auth)/sign-in`.
- **Linking:**
  - Teen → parent: teen generates an `invite_code` (a `guardian_links` row, status `pending`); parent enters it → status `active`. Teen sets `share_level`.
  - Clinician → teen: clinician enrolls a patient (creates `care_links`). For the demo, seed these.
- **Supabase clients:** one server client (cookies) for Server Components/Actions, one browser client for Realtime. Put both in `lib/supabase/`.
- Generate types after every schema change: `supabase gen types typescript --local > src/lib/types/database.ts`. This is the shared contract.

---

## 5. Design system (Shruti)

Mobile-first, warm, teen-credible, game-like but calm. Avoid "hospital app" blandness and avoid dark/guilt patterns.

- **Tokens** in `styles/tokens.css` as CSS variables, with light + dark themes (define every color as a token; redefine under `@media (prefers-color-scheme: dark)` and `[data-theme]`). A warm accent (ember/violet) for the teen app; a calmer blue/slate for the clinician app (switch by route group via a `data-app` attribute).
- **Type:** a friendly rounded display face + a clean body face (Google Fonts). Body ≥ 16px, grade-6 reading level in teen copy.
- **Accessibility built in from the start:** semantic landmarks, labelled controls, visible focus rings, 44px+ targets, `prefers-reduced-motion` respected, a user **a11y toggle** (high-contrast, large-text, haptics on/off) persisted to `profiles.a11y`. Use the **Vibration API** + an on-screen flash for alert feedback where supported.
- **Components to build:** `AppShell` (per role), `Button`, `Card`, `Sheet`, `ProgressRing`, `XPBar`, `LevelBadge`, `MedIllustration` (SVG pill/syrup), `HotspotPopover`, `FlowStep`, `QuestCard`, `ExperimentCard`, `ResultReadout`, `DoseCard`, `ConfirmCard`, `TriageRow`, `Leaderboard`, `Toast`, `A11yMenu`, `LangSwitch`.
- Reuse the visual language from the published Relay prototype where it helps (the constellation/experiment readouts), but this is the real, data-backed version.

---

## 6. Feature specs

### 6.1 Onboarding + barrier check-in (teen) — Shruti (UI) + Sneha (actions)
Wizard (`(teen)/onboarding`): (1) one-line intro; (2) disclaimer card "We never change your dose or meds — dose questions go to your care team"; (3) privacy "your care team sees your experiment results; you choose what your parent sees"; (4) a 3–4 step tooltip walkthrough of the tabs; (5) **barrier check-in** — the barriers list as tappable chips + "pick your biggest" + an **"Other"** free-text; (6) capture dose times/routine. Writes `teen_barriers`, `patient_medications`, seeds the first quests, marks the onboarding quest complete.

### 6.2 Explore my meds — the "why" explorer — Shruti (UI) + Vrushti (content/data)
`(teen)/meds` lists the teen's meds as illustrated cards. `(teen)/meds/[id]` is the **interactive explorer**:
- A large SVG **pill or syrup** illustration (`MedIllustration`, keyed by `form` + `color`).
- **Explore mode:** tappable **hotspots** on/around the med open **dialogue-box popovers** ("What's inside," "What it does," "Why *you* need it"). Content comes from `medication_content.ingredients` (array of `{name, role, plain}`).
- **Flow mode:** a simple **flow-chart / dialogue sequence** (`medication_content.flow`) that walks "you take this → it calms your immune system → your body doesn't attack your new kidney → you stay healthy." Friendly, grade-6, never scary, never dosing.
- Persistent footer: *"Sample education, reviewed by your care team. Not medical advice."* Exploring a med can grant a small one-time XP (an `explore` quest).
- **Content is seeded, not generated.** Author ~4 sample meds (tacrolimus, mycophenolate, prednisone, a generic rescue) with `reviewed=false` and a note that the DEAP team supplies the real text.

### 6.3 Dose logging + parent confirmation — Sneha (engine/actions) + Shruti/Sneha (UI)
- Teen `(teen)/home`: next dose card, big **"Took it"** (writes `dose_logs` status `taken`), plus **"Not yet"** and a kind **missed-dose** path (no shame; logs `missed`, offers to tweak a reminder).
- When a teen logs a dose and has an active parent link with `share_level in (adherence,full)`, create a **confirm request** notification for the parent.
- Parent `(parent)/confirm`: list of recent doses awaiting confirmation; **"I saw them take it"** writes `parent_confirmations` and sets `dose_logs.verified=true`. Use **Realtime** so it appears live. Parent sees only what `share_level` allows.
- The clinician dashboard shows **verified** vs **self-reported** adherence distinctly.

### 6.4 Experiments as quests — Sneha (engine) + Shruti (UI)
Port the Relay experiment model into the DB:
- **Designer** (`(teen)/experiments/new`): pick a hypothesis from the library (seeded, tied to the teen's barriers) or write one; Relay scaffolds arm A (current) / arm B (new) + 14-day crossover; launch → `experiments` + 14 `experiment_days` (alternating arms). Framed as a **quest** ("Level 3: the Morning Routine Challenge").
- **Run:** each day the teen logs that day's dose + an ease rating (1–5) → fills `experiment_days`.
- **Result readout** (`ResultReadout`): per-arm on-time % and ease, an **honest verdict** ("B is winning" / "too close to call — keep going"), with the small-sample caveat. Adopt / rerun / drop → `decision`.
- **Engine** (`lib/engine/experiment.ts`, pure TS, unit-tested): `computeResult(days)` → `{aAdh,bAdh,aEase,bEase,lift,winner,verdict,nMin}`. Reuse the thresholds from the prototype (winner needs `nMin≥3` and `|lift|≥0.15`).
- **Copy lint** (`lib/content/lint.ts`): reject dosing words `/(double|extra|skip|stop taking|half|take more|crush|mix|catch up)/i`, shame words `/(failed|lazy|should have|why didn't)/i`, med names outside the catalog, grade > 6, >1 "!". A Vitest test runs it over every seeded string.

### 6.5 Gamification — Sneha (engine) + Shruti (UI)
Positive-only. `lib/engine/game.ts` (pure, tested):
- **XP sources:** log a dose on time (+10), finish an experiment day (+5), complete a quest (reward), explore a med (+15 once), adopt an experiment finding (+50). Never *lose* XP.
- **Levels:** `level = floor(sqrt(xp / 50)) + 1` (gentle curve); `XPBar` shows progress to next level.
- **Quests:** seeded (`onboard`, `explore your meds`, `first experiment`, `two weeks of mornings`…). `quest_progress` tracks 0..1; completion grants XP + maybe an achievement.
- **Achievements:** small, kind badges ("Explorer," "Scientist," "Two-week finisher"). Unlock writes `achievement_unlocks`.
- **Pop-ups (from the doc):** half-way through an experiment → "You're halfway! Morning pills are working great so far." On completion → "Your 2-week test is done. See what won →". Trigger these in the dose-log/experiment-day actions; store as `notifications`.
- Apply all XP/level/quest changes **server-side** in the same action that writes the dose/experiment, so the client can't desync or cheat.

### 6.6 Clinician dashboard — Sneha (full-stack over Vrushti's views)
`(clinic)`:
- **Patients / attention list** (`v_attention_list`): teens who stopped logging, tests "too close to call," on-time rate dropping — with a plain reason and a suggested next step.
- **Patient detail:** experiments + results, **verified vs self-reported** adherence over time (Recharts), barriers, meds.
- **Strategy leaderboard** (`v_strategy_leaderboard`): strategy, # teens tried, % adopted, avg improvement.
- **Clinic overview:** experiments started vs finished, avg on-time before/after an adopted strategy, # self-managing.
- **Suggest-to-patient:** a button that recommends an experiment to a teen (creates a suggested `experiments` row or a notification the teen can accept).

### 6.7 Notifications — Sneha
In-app notification center (reads `notifications`, Realtime). Optional web-push (PWA) as a stretch; the half-way / completion / confirm-request messages are the must-haves. Respect the a11y haptics setting.

### 6.8 Accessibility & localization — shared, foundation-level
- a11y: as in Section 5 — build it in, don't bolt it on. Ship the a11y toggle and make the whole teen loop keyboard- and screen-reader-navigable.
- i18n: `next-intl`, auto-detect locale, **English + Spanish** fully translated (every teen-facing string via message keys, no hard-coded copy). `medication_content` and barriers are localized in the DB (`locale` column). Structure so a third language is just another `messages/*.json` + content rows.

---

## 7. Team lanes & the parallel plan

**Contract between lanes:** the **DB schema** (Section 3) and the **generated types** (`database.ts`). Vrushti publishes the schema in Phase 1 before the others build on it. Nobody changes a shared table/type silently.

### Lane DB — **Vrushti**
Owns `supabase/migrations/*`, RLS (3.4), the aggregation views (3.5), seed data (barriers, quests, achievements, 4 sample meds + content, demo accounts/links), and the typed query helpers in `lib/supabase/queries.ts`. Deliverable: a migrated Supabase project + `database.ts` the others import.

### Lane Frontend — **Shruti**
Owns the design system (Section 5), the **teen app** UI (onboarding, home, meds explorer, experiments/quests, dose logging, profile/a11y/lang), and the **parent app** UI (link, dashboard, confirm). Works against typed fixtures until the engine/queries land, then wires to server actions.

### Lane Backend — **Sneha** (also integrator)
Owns Supabase auth + middleware/role routing, account-linking, all **server actions** (logDose, confirmDose, startExperiment, logExperimentDay, adoptResult, suggestExperiment), the **engines** (`experiment.ts`, `game.ts`, `adherence.ts`, `lint.ts`), notifications, and the **clinician dashboard** (full-stack over Vrushti's views). Runs the merges.

### Suggested sequencing (so nobody is blocked)
1. **Phase 0 (together, ~45m):** one person scaffolds; all three get the repo running against the same Supabase project.
2. **Phase 1 (parallel):** Vrushti → schema + RLS + types; Shruti → design system + app shells + auth screens (static); Sneha → auth + middleware + Supabase clients.
3. From Phase 2 on, each phase (Section 8) has per-lane tasks. Integrate at the end of each.

---

## 8. Phased build plan (with Claude Code prompts)

Each phase ends green (`typecheck && lint && test`) + committed. Paste the prompt per lane.

**Phase 0 — Scaffold (together).** Create the Next.js app (TS strict, Tailwind, shadcn init, next-intl, zustand, vitest, Recharts, lucide, supabase-js + ssr). Create a Supabase project, put keys in `.env.local`. Add `CLAUDE.md`. Folders per 2.2.
> Prompt: *"Read BUILD_GUIDE.md fully. Execute Phase 0: scaffold the Next.js + TS + Tailwind + Supabase project exactly per Section 2.2, init shadcn and next-intl (en, es), set up the Supabase server/browser clients, and add CLAUDE.md. Run typecheck/lint, commit, and summarize in 5 lines. Do not start other phases."*

**Phase 1 — Foundations (parallel).**
- Vrushti: *"You are Lane DB. Implement Section 3: migrations for all tables, enum types, RLS on every table per 3.4, the views in 3.5, and seed data (barriers, quests, achievements, 4 sample meds + bilingual content, demo accounts + links). Generate database.ts. Commit per migration."*
- Shruti: *"You are Lane Frontend. Build the design system (Section 5) with light/dark tokens and the a11y toggle, plus the three AppShells and the auth screens as static UI. Use typed fixtures from Section 3. Don't touch engine or DB files."*
- Sneha: *"You are Lane Backend. Implement Supabase auth (magic-link + password), profile creation with role, middleware role-routing per Section 4, and the teen↔parent / clinician↔teen linking flows. Commit per flow."*

**Phase 2 — Teen core loop:** onboarding + barriers (6.1), dose logging (6.3 teen side), meds list. **Phase 3 — Experiments + game** (6.4, 6.5) with engine tests. **Phase 4 — Meds explorer** (6.2). **Phase 5 — Parent app + confirmation** (6.3 parent side, Realtime). **Phase 6 — Clinician dashboard + views** (6.6). **Phase 7 — Notifications, a11y pass, i18n (en+es) complete** (6.7, 6.8). **Phase 8 — Polish, seed the demo narrative, deploy to Vercel, smoke tests.**

Each later phase: a short per-lane prompt of the same shape ("You are Lane X, implement Section Y per the spec, write tests first for engine code, commit").

---

## 9. Testing & demo
- Vitest unit tests for `experiment.ts`, `game.ts`, `lint.ts` (every seeded string passes lint; XP/level math; experiment result thresholds).
- Playwright smoke: sign in as teen → onboard → log a dose → start an experiment → log a day; sign in as parent → confirm a dose; sign in as clinician → see the patient + leaderboard.
- **Seed a demo narrative:** 1 clinician, ~5 teens across states (one mid-experiment, one with an adopted win, one "attention list," one newly onboarded), each with a linked parent. A judge should be able to log into any role and see a coherent story.

---

## 10. Risks & cut list
If time runs short, cut in this order: web-push → third-language → clinic "overview" extras → achievements polish → Playwright. **Never cut:** RLS/privacy, the copy lint, the "we never change your dose" guardrails, verified-vs-self-reported distinction. The teen core loop + one experiment + the meds explorer + parent confirm + a basic clinician view is the demo; everything else is upside.

---

## Appendix A — `CLAUDE.md` (create in Phase 0)

````markdown
# Relay — project rules for Claude Code
Source of truth: BUILD_GUIDE.md. If it's silent, pick the simplest option and note it in docs/decisions.md.

## Commands
npm run dev | build | start | lint | typecheck | test
supabase gen types typescript --local > src/lib/types/database.ts   # after any schema change

## Hard rules (safety)
- Never show/suggest/change a dose or whether to take a med. Relay changes routine, not prescriptions. Dose questions → care team.
- "Why this medicine" content is hand-authored in the DB and clinician-reviewable. NEVER AI-generate medical content at runtime. Every med screen shows the "sample education, not medical advice" note.
- Patients are minors. RLS on every table. Teen controls parent visibility (share_level). Clinician sees only enrolled patients.
- Positive-only gamification. No guilt/streak-loss/shame. A missed dose is handled kindly.
- Every teen-facing string passes lib/content/lint.ts (no dosing/shame words, grade ≤6, no invented med names). Tests enforce it.
- No real patient data. Demo data is simulated/de-identified.

## Architecture
- Next.js App Router, TS strict. Server Components for reads, Server Actions for writes.
- Supabase: Postgres + Auth + RLS + Realtime. database.ts (generated) is the shared type contract.
- engine/ is pure, deterministic TS (no React, no DB). content/ holds lint + constants. i18n via next-intl (en, es).
- Apply XP/level/quest changes server-side in the same action that writes the underlying event.

## Lanes
- DB = Vrushti (schema, RLS, views, seed, queries). Frontend = Shruti (design system, teen app, parent app). Backend = Sneha (auth, actions, engines, clinician dashboard, integration).
- Don't change a shared table or type without telling the others. Add columns, don't rename/remove silently.

## Workflow
- One phase at a time. After each: typecheck, lint, test, commit, 5-line summary. Write tests first for engine code.
````

## Appendix B — Env & setup
`.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only). Supabase CLI for local migrations (`supabase start`, `supabase db reset`). Vercel project: add the same env vars. Never commit the service-role key.

## Appendix C — Open content questions for the DEAP team / clinician window
- The real "why this medicine" text for each med (we ship vetted placeholders).
- The real barrier taxonomy and strategy library (we seed a sample set).
- Which behavioural factors are safe for a teen to self-experiment vs clinician-led.
- Confirmation UX expectations from real parents (how much visibility is right vs teen autonomy).
