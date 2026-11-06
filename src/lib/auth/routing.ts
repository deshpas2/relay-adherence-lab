export type Role = "teen" | "parent" | "clinician";

export const roleHome: Record<Role, string> = {
  teen: "/teen/home",
  parent: "/parent/home",
  clinician: "/clinic/home",
};

const sectionOwner: Record<string, Role> = {
  teen: "teen",
  parent: "parent",
  clinic: "clinician",
  link: "parent",
};

const authPages = new Set(["sign-in", "sign-up"]);

export type RouteDecision = { type: "allow" } | { type: "redirect"; to: string };

const allow: RouteDecision = { type: "allow" };
const redirectTo = (to: string): RouteDecision => ({ type: "redirect", to });

/**
 * Decides where a request may go. Pure so every role and path can be tested.
 * Paths are private unless listed here, so a new page is never public by
 * accident. This is a first filter only: server actions and RLS re-check.
 */
export function decideRoute(input: {
  pathname: string;
  signedIn: boolean;
  role: Role | null;
}): RouteDecision {
  const { pathname, signedIn, role } = input;
  const section = pathname.split("/")[1] ?? "";

  if (section === "auth") return allow;

  if (!signedIn) {
    return authPages.has(section) ? allow : redirectTo("/sign-in");
  }

  if (!role) {
    return authPages.has(section)
      ? allow
      : redirectTo("/sign-in?error=no_profile");
  }

  if (section === "" || authPages.has(section)) {
    return redirectTo(roleHome[role]);
  }

  const owner = sectionOwner[section];
  return owner && owner !== role ? redirectTo(roleHome[role]) : allow;
}
