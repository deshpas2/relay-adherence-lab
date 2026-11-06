import { describe, expect, it } from "vitest";
import {
  attentionReasons,
  computeAdherence,
  type DoseRecord,
} from "@/lib/engine/adherence";

const dose = (status: DoseRecord["status"], verified = false): DoseRecord => ({
  status,
  verified,
});

describe("computeAdherence", () => {
  it("keeps verified and self-reported apart", () => {
    const result = computeAdherence([
      dose("taken", true),
      dose("taken"),
      dose("late", true),
      dose("missed"),
    ]);
    expect(result).toEqual({
      total: 4,
      onTimeRate: 0.5,
      selfReportedRate: 0.75,
      verifiedRate: 0.5,
    });
  });

  it("doesn't count a verified flag on a dose that wasn't taken", () => {
    expect(computeAdherence([dose("missed", true)]).verifiedRate).toBe(0);
  });

  it("counts skipped doses in the total", () => {
    expect(computeAdherence([dose("taken"), dose("skipped")]).selfReportedRate).toBe(0.5);
  });

  it("returns null rates when there is nothing to measure", () => {
    expect(computeAdherence([])).toEqual({
      total: 0,
      onTimeRate: null,
      selfReportedRate: null,
      verifiedRate: null,
    });
  });
});

describe("attentionReasons", () => {
  const now = new Date("2026-11-05T12:00:00Z");
  const base = {
    now,
    lastLogAt: new Date("2026-11-05T08:00:00Z"),
    recentOnTimeRate: 0.9,
    previousOnTimeRate: 0.9,
    tooCloseExperiments: 0,
  };

  it("is empty when all is well", () => {
    expect(attentionReasons(base)).toEqual([]);
  });

  it("flags a teen who stopped logging after 3 days", () => {
    expect(
      attentionReasons({ ...base, lastLogAt: new Date("2026-11-02T12:00:00Z") }),
    ).toEqual(["stopped_logging"]);
    expect(
      attentionReasons({ ...base, lastLogAt: new Date("2026-11-02T12:00:01Z") }),
    ).toEqual([]);
  });

  it("flags a teen who has never logged", () => {
    expect(
      attentionReasons({ ...base, lastLogAt: null, recentOnTimeRate: null }),
    ).toEqual(["stopped_logging"]);
  });

  it("flags a clear drop in on-time rate", () => {
    expect(attentionReasons({ ...base, recentOnTimeRate: 0.7 })).toEqual(["dropping"]);
  });

  it("ignores a small drop, or one it can't measure", () => {
    expect(attentionReasons({ ...base, recentOnTimeRate: 0.8 })).toEqual([]);
    expect(attentionReasons({ ...base, previousOnTimeRate: null })).toEqual([]);
  });

  it("flags experiments that are too close", () => {
    expect(attentionReasons({ ...base, tooCloseExperiments: 1 })).toEqual(["too_close"]);
  });

  it("reports every reason that applies", () => {
    expect(
      attentionReasons({
        ...base,
        lastLogAt: new Date("2026-10-01T00:00:00Z"),
        recentOnTimeRate: 0.2,
        tooCloseExperiments: 2,
      }),
    ).toEqual(["stopped_logging", "dropping", "too_close"]);
  });
});
