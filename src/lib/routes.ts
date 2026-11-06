/**
 * Each role's landing page. Matches `roleHome` in Lane Backend's
 * src/lib/auth/routing.ts (pages live under /teen, /parent, /clinic).
 * TODO after merging lane-be: delete this file and import from there.
 */

export type AppRole = "teen" | "parent" | "clinician";

export const ROLE_HOME: Record<AppRole, string> = {
  teen: "/teen/home",
  parent: "/parent/home",
  clinician: "/clinic/home",
};
