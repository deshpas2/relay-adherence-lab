# Relay — project rules for Claude Code

Source of truth: **BUILD_GUIDE.md**. If it's silent on something, pick the simplest option and note it in `docs/decisions.md`.

## Commands
```
npm run dev | build | start | lint | typecheck | test
npm run db:push    # apply migrations to the hosted project (Lane DB only)
npm run db:types   # regenerate src/lib/types/database.ts after any schema change
```

## Hard rules (safety — enforce in code and copy)
- **Never** show, suggest, or change a dose, its timing-as-prescribed, or whether to take a medicine. Relay changes **routine and behaviour** (when/where/how/who helps), not prescriptions. Dose questions route to the care team.
- The **"why this medicine"** content is **hand-authored in the database and clinician-reviewable**. **Never AI-generate medical content at runtime.** Every med screen shows: *"Sample education, reviewed by your care team. Not medical advice."*
- Patients are **minors**. **Row-Level Security on every table.** The teen controls what their parent sees (`guardian_links.share_level`). A clinician sees only enrolled patients. No role sees another's data by default.
- **Positive-only gamification.** No guilt, no streak-loss, no shame copy, no red failure screens. A missed dose is data, handled kindly.
- Every teen-facing string passes `lib/content/lint.ts`: no dosing words, no shame words, reading level ≤ grade 6, no medication names outside the catalog, ≤1 "!". Tests enforce it over all seeded copy.
- **No real patient data.** All demo data is simulated/de-identified.

## Architecture
- **Next.js (App Router), TypeScript strict.** Server Components for reads, **Server Actions** for writes, Route Handlers only for webhooks/push.
- **Supabase**: Postgres + Auth + RLS + Realtime. The generated `src/lib/types/database.ts` is the **shared type contract** — regenerate it after every schema change.
- `lib/engine/` is **pure, deterministic TypeScript** (no React, no DB imports); randomness only in seed/sim helpers. `lib/content/` holds the copy lint + barrier/strategy constants.
- i18n via **next-intl** (`en`, `es`); every teen-facing string is a message key, never hard-coded. `medication_content` and barriers are localized in the DB.
- Apply all **XP / level / quest** changes **server-side in the same action** that writes the underlying event (dose log, experiment day), so the client can't desync or cheat.
- Accessibility is foundational: semantic HTML, ARIA, keyboard nav, 44px+ targets, visible focus, `prefers-reduced-motion`, a persisted a11y toggle (high-contrast / large-text / haptics).

## Lanes (don't cross silently)
- **DB — Vrushti:** schema, RLS, aggregation views, seed data, typed query helpers.
- **Frontend — Shruti:** design system, teen app UI, parent app UI.
- **Backend — Sneha:** auth, middleware/role routing, account linking, server actions, engines (experiment/game/adherence/lint), notifications, clinician dashboard, integration.
- Don't change a shared table or type without telling the other two. **Add** columns; never rename or remove silently.

## Workflow
- Work **one phase at a time** (BUILD_GUIDE.md Section 8). After each phase: `typecheck`, `lint`, `test`, commit, 5-line summary.
- **Write tests first** for engine code (experiment results, XP/level math, copy lint).
- Merge to `main` every 60–90 minutes. Short-lived branches `lane-db`, `lane-fe`, `lane-be`.
