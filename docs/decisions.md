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

## Phase 1 — Lane Frontend

- **Display + a11y settings live in a `relay_prefs` cookie** (`src/lib/prefs.ts`). The root layout reads it and puts `data-theme` / `data-contrast` / `data-text` / `data-motion` on `<html>` on the server, so there's no flash of the wrong theme. The a11y fields match `profiles.a11y`; Lane Backend can also save them to the profile once accounts exist and seed the cookie from it on sign-in.
- **Language switch writes the existing `NEXT_LOCALE` cookie** and refreshes. No locale in the URL (see Phase 0).
- **Every tap target is at least 44px**, so the shadcn button's small sizes (`xs`, `icon-xs`, `icon-sm`, `icon-lg`) were removed.
- **Pages follow Lane Backend's URL scheme:** `/teen/*`, `/parent/*`, `/clinic/*`, each landing on `/home` (parent home = confirm list, clinic home = patients). `src/lib/routes.ts` copies `roleHome` until lane-be is merged, then should be replaced by `src/lib/auth/routing.ts`.
- **The clinic colors switch on via `data-app="clinic"` on the shell wrapper** (correct on first paint), and also on `<html>` after load so pop-ups match.

## Phase 3 — Lane Frontend (experiments + game UI)

- **Engine and lint files are copied unchanged from lane-be** (`src/lib/engine/*`, `src/lib/content/lint.ts` and their tests), so the screens use the real `computeResult`, `experimentMilestone`, `levelProgress` and `lintCopy`. Being identical, they merge without conflicts.
- **The idea library leaves out the `timing` factor.** Dose times belong to the care team, so library ideas only change place, cues, who helps, or routine style. Library text is placeholder content for clinician review.
- **Teen-written experiment ideas are checked with `lintCopy`** and rejected on any dosing or medicine-name match, so a teen can't set up "take half" or "skip the morning dose" as an experiment. Lane Backend should run the same check in `startExperiment`.
- **"Keep option X" is only offered when the engine names a winner.** With "too close" or "not enough data", the teen can run it again or drop it.
- **Experiment pages show a "Preview: go to the next day" button outside production,** so a demo can walk through all 14 days.

## Re-engagement ladder (teen goes quiet)

- **"Quiet" = days since the teen's last activity** (dose log, check-in or opening the app). Any activity resets it to 0 and the ladder stops. Logic: `src/lib/engine/reengage.ts` (tested).
- **Steps stay with the teen and get more personal:** day 3 app notification, day 7 text, day 10 voice note from their own nurse, day 14 care-team phone call. App and text are automatic; the voice note and the call wait for a person and show as "Needs recording" / "Call needed".
- **Day 14 raises a red alert at the top of the clinician's patient list** until the call is logged (reached / left a message / no answer).
- **Texts and notifications never mention health or meds,** because they show on lock screens. The voice note is from the teen's own nurse, who is already bound by confidentiality. Parents are not part of the ladder.
- **Coming back is guilt-free:** a "Welcome back" card says nothing was lost, and shows the nurse's voice note if one was sent.
- **Sending is simulated for now.** TODO(backend): a daily job runs `reengagementPlan` per enrolled teen, writes `notifications` (app), sends the text through an SMS provider, stores voice notes in Storage, and creates care-team tasks. Thresholds (3/7/10/14) are placeholders for the care team to confirm.
