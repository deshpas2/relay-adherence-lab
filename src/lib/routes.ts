/**
 * Which URLs belong to which role.
 *
 * Route groups like (teen) don't show up in the URL, so every role needs
 * its own path names. Lane Backend's proxy can use this list to send each
 * user to their own area.
 */

export type AppRole = "teen" | "parent" | "clinician";

export const ROLE_ROUTES: Record<AppRole, readonly string[]> = {
  teen: ["/home", "/meds", "/experiments", "/profile", "/onboarding", "/log"],
  parent: ["/family", "/confirm"],
  clinician: ["/patients", "/strategies", "/overview"],
};

/** Where each role lands after signing in. */
export const ROLE_HOME: Record<AppRole, string> = {
  teen: "/home",
  parent: "/confirm",
  clinician: "/patients",
};

/** The role that owns a path, or null for shared pages like sign-in. */
export function roleForPath(pathname: string): AppRole | null {
  for (const [role, routes] of Object.entries(ROLE_ROUTES)) {
    if (routes.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
      return role as AppRole;
    }
  }
  return null;
}
