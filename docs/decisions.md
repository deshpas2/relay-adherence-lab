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

## Phase 1 (Lane Backend)

### For Lane Frontend

- **Pages need a URL prefix.** Route groups don't appear in URLs, so the proxy can't tell whose page `/home` is. Put pages under a matching folder: `(teen)/teen/home`, `(parent)/parent/home`, `(clinic)/clinic/home`. Each role lands on its `/home` page. `(auth)/sign-in`, `(auth)/sign-up` and `(auth)/link` keep their short URLs; `/link` is for parents.
- **Paths are private by default.** Only `/sign-in`, `/sign-up` and `/auth/*` work signed out. A new public page must be added to `src/lib/auth/routing.ts`.
- **Each role layout calls `requireRole()`** from `src/lib/auth/session.ts`. The proxy alone is not enough.
- **Forms use `useActionState`** with the actions in `src/lib/actions/`, starting from `idleState`. Actions return codes, so show `ActionErrors.<code>` from the messages files. `/sign-in` also gets `?error=link_expired` or `?error=no_profile`, which use the same keys.
- **Form field names:** `email`, `password`, `displayName`, `role` (`teen` or `parent`), `inviteCode`, `linkId`, `shareLevel`.

### For Lane DB (proposed, needs agreement)

- **Clinicians can't sign themselves up.** The guide lets sign-up pick clinician, but that would let anyone request access to minors' data. Sign-up accepts only teen and parent, and clinician accounts are seeded. RLS must back this up: `profiles` must not let a user insert themselves as a clinician or change their own `role`. The guide's `"own profile" for all` policy allows both.
- **`ensureProfile` creates the profile on first sign-in** and does nothing if the row exists, so a database trigger can replace it safely. It needs a `profiles` insert policy for the user's own row.
- **Invite codes are redeemed with the service role.** A parent isn't on the row until they redeem it, so RLS hides it from them. `redeemGuardianInvite` updates only a pending, unclaimed row with that exact code. A `security definer` function could replace it.
- **Teens need insert and update on their own `guardian_links`.** Their policy should stop a teen setting `parent_id` directly, so a link can only become active through a redeemed code.

### Other

- **`src/lib/types/app-database.ts` is temporary.** It hand-copies `profiles` and `guardian_links` from Section 3 so auth compiles before the migrations exist. Its header explains the one-line swap once real types are generated.
- **`/auth/confirm` is a Route Handler,** an exception to "webhooks and push only". Email links arrive as a GET and have to set the session cookie.
- **The proxy loads `profiles.role` on each request,** as Section 4 asks, although the Next 16 docs advise against database reads there. Revisit this if it slows pages down.
- **Clinician enrollment is not built.** Section 4 says to seed `care_links` for the demo. A real flow needs a way for the teen to consent, such as a code, which needs a schema change.
- **Invite codes don't expire,** because `guardian_links` has no expiry column. They have 50 bits of randomness and work once.

## Engines and copy lint (Lane Backend, ahead of Phase 3)

Built early because they need no database or UI.

### Copy lint (`src/lib/content/lint.ts`)

- **Whole-word matching.** The guide's plain regex rejects its own "You're halfway!", so patterns match whole words and their other forms.
- **Stricter than the guide.** It also catches rewordings like "take twice as much", "you should've" and brand names such as Prograf.
- **Spanish has its own word lists and uses the Crawford grade formula,** because English formulas overrate Spanish. The Spanish lists need a fluent reviewer.
- **Reading level:** strings under 5 words aren't scored, and strings under 8 words get 3 extra grades of tolerance, because the formulas are unreliable on short text. Catalog medicine names don't count toward the score.
- **The English med-screen disclaimer is exempt from the reading-level check only.** Its wording is fixed by the hard rules and it scores 7.6.
- **The lint is a safety net, not a review.** Word lists can't catch every unsafe sentence or every medicine name, so clinician review of copy is still needed.
- **Seeded copy isn't linted yet.** `tests/content/lint.test.ts` covers the messages files. Add the seed strings when Lane DB's seed lands, passing the real catalog from `medications`.

### Engines (`src/lib/engine/`)

- **On time means status `taken`.** `late` counts as taken for adherence but not as on time, so it earns no on-time XP. It never loses XP.
- **Not-yet-logged experiment days are left out** of per-arm rates, and `nMin` is the logged-day count of the smaller arm.
- **Arms alternate A, B, A, B,** as the guide says. A fixed order keeps the engine deterministic.
- **The engines return codes, not copy.** `Verdict` maps to `ExperimentVerdict.*` in the messages files.
- **The halfway pop-up doesn't use the guide's "Morning pills are working great so far."** That may be untrue for a given teen's test, which would break the honest-verdict rule. It says "Nice work sticking with your test."
- **Attention thresholds are placeholders for a clinician to confirm:** no log for 3 days, or an on-time rate down by 15 points or more. The guide doesn't set them.
- **Achievement rules aren't built.** They depend on the keys in Lane DB's seed.
