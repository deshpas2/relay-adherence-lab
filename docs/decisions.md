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
