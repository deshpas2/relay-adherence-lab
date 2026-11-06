# Relay

An adherence platform for teen kidney-transplant patients. [BUILD_GUIDE.md](BUILD_GUIDE.md) is the source of truth, and [CLAUDE.md](CLAUDE.md) has the project rules.

## Setup

```
npm install
cp .env.local.example .env.local   # then add your Supabase keys
npm run dev
```

The project uses a hosted Supabase project, so Docker is not needed. To work on the schema, link once with `npx supabase login` and `npx supabase link --project-ref <ref>`, then use `npm run db:push` and `npm run db:types`.

`NEXT_PUBLIC_SUPABASE_URL` is the bare project URL (`https://<ref>.supabase.co`), with no `/rest/v1` on the end.

## Checks

```
npm run typecheck && npm run lint && npm test
```

`npm test` also runs the database tests in `tests/db/`. They apply every migration to an in-process Postgres and check privacy rules, view math, seed copy and that `database.ts` matches the schema. No Docker or network is needed.

## Database (Lane DB)

| What | Where |
|---|---|
| Migrations | `supabase/migrations/0001_init.sql` (tables), `0002_rls.sql` (privacy), `0003_views.sql` (clinician views), `0004_seed.sql` (catalog) |
| Types (shared contract) | `src/lib/types/database.ts` |
| Typed read helpers | `src/lib/supabase/queries.ts` |
| Service-role client (server only, Lane Backend) | `src/lib/supabase/admin.ts` |
| Decisions beyond the guide | `docs/decisions.md` → "Phase 1 — Lane DB" |

Only Lane DB pushes, because pushing changes the shared database for everyone:

```
npx supabase db push --remote --dry-run   # check first
npm run db:push
npm run db:types                          # then commit database.ts
npm run db:seed:demo                      # (re)build the demo accounts
npm run db:smoke                          # live privacy checks as the demo users
```

### Demo accounts

Every demo account uses the password `relay-demo-2026`. All data is simulated.

| Role | Sign in as | Story |
|---|---|---|
| Clinician | `dr.rivera@demo.relay.test` | Sees all five teens |
| Teen | `maya@demo.relay.test` | Halfway through a timing experiment, and option B is ahead |
| Teen | `leo@demo.relay.test` | Adopted a winning strategy and has stayed on time since |
| Teen | `sam@demo.relay.test` | Stopped logging 5 days ago, so he's on the attention list |
| Teen | `ava@demo.relay.test` | Onboarded yesterday |
| Teen | `noah@demo.relay.test` | Experiment was too close to call |
| Parent | `maya.parent@…` (full), `leo.parent@…` (adherence), `sam.parent@…` (confirm only), `noah.parent@…` (full) | Linked |
| Parent | `ava.parent@demo.relay.test` | Not linked yet. Redeem invite code `AVA2PARX`. |
