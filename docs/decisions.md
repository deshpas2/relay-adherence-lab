# Decisions

Choices made where BUILD_GUIDE.md is silent or out of date.

## Phase 0

- **`src/proxy.ts`, not `src/middleware.ts`.** Next.js 16 deprecated `middleware` and renamed it `proxy`. Wherever the guide says middleware, use `src/proxy.ts`.
- **`cacheComponents` is off.** Every page is per-user and reads cookies, so it would add Suspense requirements for no caching benefit.
- **No locale in the URL.** Locale comes from the `NEXT_LOCALE` cookie, then `Accept-Language`, then `en`. The guide asks for browser auto-detection and doesn't define locale routes.
- **Messages live in `src/messages/`**, following Section 2.2. Section 2 says `/messages/`; the two disagree.
- **Schema is Phase 1.** Section 0 lists the schema under Phase 0, but Section 8 gives it to Lane DB in Phase 1. We followed Section 8. `src/lib/types/database.ts` is a placeholder until then.
- **The proxy skips auth when Supabase env vars are missing, in development only.** In production it throws, so the app can't run without auth.
- **No Docker.** The team shares one hosted Supabase project instead of running Supabase locally, so `supabase start` and `supabase db reset` are not used. Only Lane DB runs `npm run db:push`, because a migration changes the database for everyone. Check it first with `npx supabase db push --remote --dry-run`.

## Phase 1 — Lane DB (schema, RLS, views, seed)

Everything the guide's schema defines exists unchanged. Additions only add columns, checks, indexes and functions.

**Schema additions**
- **`i18n` jsonb on catalog tables** (`barriers`, `quests`, `achievements`, `medications`). English stays in the guide's columns; other locales live in `i18n` as `{"es": {"<column>": "..."}}`. Use `localize(row, "title", locale)` from `lib/supabase/queries.ts`. `medication_content` keeps its per-locale rows as the guide says. `barriers` also gained a `label` column, because the guide gave barriers no display text.
- **Checks** on `share_level`, `factor`, `quests.kind`, `age_band`, `ease`, `progress`, `xp`, and the jsonb shapes. `dose_logs.experiment_id` now has a foreign key.
- **Uniqueness:** a parent links to a given teen at most once, and a parent confirms a given dose at most once.
- **The 4th sample medicine is amlodipine** (blood pressure), not "a generic rescue". Rescue medicines belong to the asthma prototype, and blood-pressure medicine is common after a kidney transplant.

**Privacy (RLS) decisions** (tested in `tests/db/rls.test.ts`)
- **What `share_level` means.** The guide never defined `confirm_only`, and its sample policy would have shown a `confirm_only` parent nothing, so they couldn't confirm anything. The levels are now:
  - `confirm_only`: the teen's name, their meds, and doses from the last 48 hours, so the parent can confirm them.
  - `adherence`: adds the full dose history.
  - `full`: adds barriers, experiments and game progress.
- **Nobody can change their own `role`.** Users can only update `display_name`, `locale`, `age_band` and `a11y` on their profile.
- **Nobody can sign themselves up as a clinician.**
  - A profile is created automatically at sign-up. Teen or parent comes from `user_metadata.role`; clinician only from `app_metadata.role`, which only the service role can set.
  - If the metadata has no role, no profile is created and the app inserts one (teen or parent only).
  - **Creating a clinician:** Supabase's admin API (`auth.admin.createUser`) writes `app_metadata` after the user row is inserted, so the trigger never sees the clinician role. Staff create the user, then insert the `profiles` row with the service-role key, which is what `supabase/seed/demo.mts` does.
- **Clinician enrollment (`care_links`) is staff/seed only.** If a clinician could enroll any teen id, anyone with a clinician account could read any teen. A teen-issued clinic code can replace this later.
- **`dose_logs.verified` can't be set by any client.** The trigger on `parent_confirmations` sets it, and changing a dose's status afterwards clears it.
- **XP can't be faked.** `game_state`, `quest_progress` and `achievement_unlocks` are read-only for clients, and server actions write them with `lib/supabase/admin.ts` (service role). A teen starts with a `game_state` row automatically.
- **Notifications** may be inserted for yourself, by a teen as a `confirm_request` to their active parent, or by a clinician as a `suggestion` to an enrolled teen.
- **Linking** (agreed with Lane Backend, answering "For Lane DB" on lane-be):
  - A teen may insert their own invite directly, writing only `teen_id`, `invite_code` and `share_level`. No client can write `parent_id` or `status` on insert, and a teen can't set an unclaimed invite to `active`. A link only goes active when a parent redeems the code.
  - Redeeming works two ways: Lane Backend's service-role server action, or the `accept_guardian_invite(p_code)` RPC (parent only; returns the teen's id; fails with `invite_not_found` or `already_linked`). The RPC is the recommended path, because it keeps the service-role key out of a user-facing request.
  - `create_guardian_invite(p_share_level)` (teen only) is also available. It generates the code in the database.
- **Profiles:** the sign-up trigger creates the profile, and Lane Backend's `ensureProfile` upsert is a no-op when the row already exists. Both paths are tested.
- **Helper functions live in the `private` schema** (not exposed by the API) and are `security definer`, so policies can check the link tables without recursing.
- **`anon` has no access to anything.**

**Views** (all `security_invoker`, so each clinician sees only their own patients)
- `v_experiment_results`: per-arm on-time rate, ease and lift (B − A).
- `v_strategy_leaderboard`: adds `avg_improvement_pts`.
- `v_daily_adherence`: verified vs self-reported counts per teen per day, for the chart. Days are UTC dates.
- `v_attention_list`: adds `reasons` (keys `not_logging`, `dropping`, `too_close`, which the app maps to i18n text) and `needs_attention`.
- `v_clinic_overview`: one row for the caller's patients.
- **Thresholds:** "too close" mirrors the experiment engine (a winner needs 3+ logged days per arm and |lift| ≥ 0.15). "Not logging" means no log in 3+ days. "Dropping" means on-time fell 15+ points, comparing the last 7 days with the 7 before, matching `lib/engine/adherence.ts` on lane-be.

**Testing without Docker**
- `tests/db/*` run every migration in PGlite, an in-process Postgres, with a small stand-in for Supabase's roles, `auth.users` and `auth.uid()`. They test RLS as each role, view math, seed copy-lint and that `database.ts` matches the schema. They run as part of `npm test`.
- `npm run db:smoke` repeats the key checks against the live project, as the seeded demo users.

**Demo data**
- `npm run db:seed:demo` creates the §9 story through the admin API. Every account is `<name>@demo.relay.test`, with password `relay-demo-2026` (or `DEMO_PASSWORD`).
- Re-running deletes and rebuilds demo-domain users only.
- Times are US Eastern (`DEMO_TZ_OFFSET_HOURS` changes that).
