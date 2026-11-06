import { describe, expect, it } from "vitest";
import { ROLE_HOME, ROLE_ROUTES, roleForPath } from "@/lib/routes";

describe("roleForPath", () => {
  it("finds the owning role, including sub-pages", () => {
    expect(roleForPath("/home")).toBe("teen");
    expect(roleForPath("/meds/abc")).toBe("teen");
    expect(roleForPath("/confirm")).toBe("parent");
    expect(roleForPath("/patients/123")).toBe("clinician");
  });

  it("does not match look-alike paths", () => {
    expect(roleForPath("/homework")).toBeNull();
    expect(roleForPath("/")).toBeNull();
    expect(roleForPath("/sign-in")).toBeNull();
  });

  it("never gives two roles the same path", () => {
    const all = Object.values(ROLE_ROUTES).flat();
    expect(new Set(all).size).toBe(all.length);
  });

  it("sends each role home to a page it owns", () => {
    for (const [role, home] of Object.entries(ROLE_HOME)) {
      expect(roleForPath(home)).toBe(role);
    }
  });
});
