import { describe, expect, it } from "vitest";
import { adultMonth, ageInYears, caregiverCanSee, isEnrollableAge, sharingMode } from "@/lib/engine/consent";

const nov2026 = new Date(2026, 10, 6); // 6 Nov 2026

describe("ageInYears", () => {
  it("counts whole years from month + year of birth", () => {
    expect(ageInYears("2009-03", nov2026)).toBe(17);
    expect(ageInYears("2008-11", nov2026)).toBe(18); // turns 18 this month
    expect(ageInYears("2008-12", nov2026)).toBe(17); // not until next month
  });

  it("rejects bad input", () => {
    expect(ageInYears("2008-13", nov2026)).toBeNull();
    expect(ageInYears("March 2008", nov2026)).toBeNull();
  });

  it("knows the month someone turns 18", () => {
    expect(adultMonth("2009-03")).toBe("2027-03");
  });
});

describe("sharingMode", () => {
  it("shares everything with the caregiver under 18, whatever was chosen", () => {
    expect(sharingMode(17, null)).toBe("minor_shared");
    expect(sharingMode(15, { share: false, agreedAt: "x" })).toBe("minor_shared");
    expect(caregiverCanSee("minor_shared")).toBe(true);
  });

  it("asks for consent at 18, and shares nothing until then", () => {
    expect(sharingMode(18, null)).toBe("adult_needs_consent");
    expect(caregiverCanSee("adult_needs_consent")).toBe(false);
  });

  it("follows the adult's choice", () => {
    expect(sharingMode(19, { share: true, agreedAt: "x" })).toBe("adult_shared");
    expect(sharingMode(19, { share: false, agreedAt: "x" })).toBe("adult_private");
    expect(caregiverCanSee("adult_shared")).toBe(true);
    expect(caregiverCanSee("adult_private")).toBe(false);
  });
});

describe("isEnrollableAge", () => {
  it("accepts program ages only", () => {
    expect(isEnrollableAge(16)).toBe(true);
    expect(isEnrollableAge(7)).toBe(false);
    expect(isEnrollableAge(26)).toBe(false);
    expect(isEnrollableAge(null)).toBe(false);
  });
});
