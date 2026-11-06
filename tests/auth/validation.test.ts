import { describe, expect, it } from "vitest";
import {
  buildProfileInsert,
  generateInviteCode,
  normalizeInviteCode,
  parseDisplayName,
  parseEmail,
  parsePassword,
  parseShareLevel,
  parseSignupRole,
} from "@/lib/auth/validation";

describe("parseSignupRole", () => {
  it("accepts teen and parent", () => {
    expect(parseSignupRole("teen")).toBe("teen");
    expect(parseSignupRole("parent")).toBe("parent");
  });

  it("never lets anyone sign themselves up as a clinician", () => {
    expect(parseSignupRole("clinician")).toBeNull();
  });

  it("rejects anything else", () => {
    for (const value of ["admin", "", null, undefined, 1, ["teen"]]) {
      expect(parseSignupRole(value)).toBeNull();
    }
  });
});

describe("parseEmail", () => {
  it("trims and lowercases", () => {
    expect(parseEmail("  Sam@Example.COM ")).toBe("sam@example.com");
  });

  it("rejects non-emails", () => {
    for (const value of ["", "sam", "sam@", "@x.io", "a b@x.io", null]) {
      expect(parseEmail(value)).toBeNull();
    }
  });
});

describe("parsePassword", () => {
  it("needs at least 8 characters and keeps spaces", () => {
    expect(parsePassword("short")).toBeNull();
    expect(parsePassword(" 12345678 ")).toBe(" 12345678 ");
    expect(parsePassword(null)).toBeNull();
  });
});

describe("parseDisplayName", () => {
  it("trims, and needs 1 to 50 characters", () => {
    expect(parseDisplayName("  Sam ")).toBe("Sam");
    expect(parseDisplayName("   ")).toBeNull();
    expect(parseDisplayName("x".repeat(51))).toBeNull();
    expect(parseDisplayName(null)).toBeNull();
  });
});

describe("parseShareLevel", () => {
  it("accepts only the three levels", () => {
    expect(parseShareLevel("confirm_only")).toBe("confirm_only");
    expect(parseShareLevel("adherence")).toBe("adherence");
    expect(parseShareLevel("full")).toBe("full");
    expect(parseShareLevel("everything")).toBeNull();
    expect(parseShareLevel(null)).toBeNull();
  });
});

describe("invite codes", () => {
  it("are 10 characters with no look-alikes", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateInviteCode()).toMatch(/^[2-9A-HJ-NP-Z]{10}$/);
    }
  });

  it("don't repeat", () => {
    const codes = new Set(Array.from({ length: 500 }, generateInviteCode));
    expect(codes.size).toBe(500);
  });

  it("forgive case, spaces and dashes when typed", () => {
    expect(normalizeInviteCode(" abcde-fghjk ")).toBe("ABCDEFGHJK");
  });

  it("reject the wrong shape", () => {
    for (const value of ["ABC", "ABCDEFGHJKL", "ABCDEFGHI1", "", null]) {
      expect(normalizeInviteCode(value)).toBeNull();
    }
  });
});

describe("buildProfileInsert", () => {
  const id = "user-1";

  it("builds a profile from sign-up details", () => {
    expect(
      buildProfileInsert(id, { role: "teen", display_name: " Sam " }, "es"),
    ).toEqual({ id, role: "teen", display_name: "Sam", locale: "es" });
  });

  it("refuses a clinician role, which user metadata could fake", () => {
    expect(
      buildProfileInsert(id, { role: "clinician", display_name: "Sam" }, "en"),
    ).toBeNull();
  });

  it("refuses missing details", () => {
    expect(buildProfileInsert(id, { role: "teen" }, "en")).toBeNull();
    expect(buildProfileInsert(id, {}, "en")).toBeNull();
    expect(buildProfileInsert(id, undefined, "en")).toBeNull();
  });
});
