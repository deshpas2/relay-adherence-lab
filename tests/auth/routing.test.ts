import { describe, expect, it } from "vitest";
import { decideRoute, roleHome, type Role } from "@/lib/auth/routing";

const allow = { type: "allow" };
const to = (path: string) => ({ type: "redirect", to: path });
const signedIn = (pathname: string, role: Role | null) =>
  decideRoute({ pathname, signedIn: true, role });
const signedOut = (pathname: string) =>
  decideRoute({ pathname, signedIn: false, role: null });

describe("signed-out visitors", () => {
  it("can reach the sign-in, sign-up and email-link routes", () => {
    expect(signedOut("/sign-in")).toEqual(allow);
    expect(signedOut("/sign-up")).toEqual(allow);
    expect(signedOut("/auth/confirm")).toEqual(allow);
  });

  it("are sent to sign-in from everywhere else, including unknown paths", () => {
    for (const path of ["/", "/teen/home", "/parent/home", "/clinic/home", "/link", "/anything", "/api/x"]) {
      expect(signedOut(path)).toEqual(to("/sign-in"));
    }
  });
});

describe("signed-in users", () => {
  const roles: Role[] = ["teen", "parent", "clinician"];

  it("go to their home from / and from the auth pages", () => {
    for (const role of roles) {
      expect(signedIn("/", role)).toEqual(to(roleHome[role]));
      expect(signedIn("/sign-in", role)).toEqual(to(roleHome[role]));
      expect(signedIn("/sign-up", role)).toEqual(to(roleHome[role]));
    }
  });

  it("can open their own section", () => {
    expect(signedIn("/teen/meds/1", "teen")).toEqual(allow);
    expect(signedIn("/parent/confirm", "parent")).toEqual(allow);
    expect(signedIn("/clinic/patients", "clinician")).toEqual(allow);
  });

  it("are sent home from every other role's section", () => {
    expect(signedIn("/clinic/patients", "teen")).toEqual(to("/teen/home"));
    expect(signedIn("/parent/confirm", "teen")).toEqual(to("/teen/home"));
    expect(signedIn("/teen/home", "parent")).toEqual(to("/parent/home"));
    expect(signedIn("/clinic", "parent")).toEqual(to("/parent/home"));
    expect(signedIn("/teen", "clinician")).toEqual(to("/clinic/home"));
    expect(signedIn("/parent/home", "clinician")).toEqual(to("/clinic/home"));
  });

  it("matches whole path segments, not prefixes", () => {
    expect(signedIn("/teenager", "parent")).toEqual(allow);
    expect(signedIn("/clinical", "teen")).toEqual(allow);
  });

  it("only lets parents open the link page", () => {
    expect(signedIn("/link", "parent")).toEqual(allow);
    expect(signedIn("/link", "teen")).toEqual(to("/teen/home"));
    expect(signedIn("/link", "clinician")).toEqual(to("/clinic/home"));
  });
});

describe("signed-in users with no profile", () => {
  it("stay on the auth pages so they can't loop", () => {
    expect(signedIn("/sign-in", null)).toEqual(allow);
    expect(signedIn("/sign-up", null)).toEqual(allow);
    expect(signedIn("/auth/confirm", null)).toEqual(allow);
  });

  it("can't reach any app section", () => {
    for (const path of ["/", "/teen/home", "/parent/home", "/clinic/home", "/link"]) {
      expect(signedIn(path, null)).toEqual(to("/sign-in?error=no_profile"));
    }
  });
});
