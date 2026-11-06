import { describe, expect, it } from "vitest";
import {
  buildExperimentDays,
  computeResult,
  experimentMilestone,
  type ExperimentDay,
} from "@/lib/engine/experiment";

const day = (
  arm: "A" | "B",
  status: ExperimentDay["status"],
  ease: number | null = null,
): ExperimentDay => ({ arm, status, ease });

const repeat = (count: number, value: ExperimentDay) =>
  Array.from({ length: count }, () => value);

describe("buildExperimentDays", () => {
  it("makes 14 alternating days by default", () => {
    const days = buildExperimentDays();
    expect(days).toHaveLength(14);
    expect(days[0]).toEqual({ day_index: 1, arm: "A" });
    expect(days[1]).toEqual({ day_index: 2, arm: "B" });
    expect(days[13]).toEqual({ day_index: 14, arm: "B" });
  });

  it("gives both arms the same number of days", () => {
    const days = buildExperimentDays(14);
    expect(days.filter((d) => d.arm === "A")).toHaveLength(7);
    expect(days.filter((d) => d.arm === "B")).toHaveLength(7);
  });
});

describe("computeResult", () => {
  it("names B the winner when it clearly leads", () => {
    const result = computeResult([
      day("A", "taken"),
      day("A", "missed"),
      day("A", "missed"),
      day("A", "missed"),
      ...repeat(4, day("B", "taken")),
    ]);
    expect(result).toMatchObject({
      aAdh: 0.25,
      bAdh: 1,
      lift: 0.75,
      winner: "B",
      verdict: "b_winning",
      nMin: 4,
    });
  });

  it("names A the winner when it clearly leads", () => {
    const result = computeResult([
      ...repeat(3, day("A", "taken")),
      ...repeat(3, day("B", "missed")),
    ]);
    expect(result).toMatchObject({ winner: "A", verdict: "a_winning", lift: -1 });
  });

  it("needs at least 3 logged days in each arm", () => {
    const result = computeResult([
      ...repeat(2, day("A", "missed")),
      ...repeat(7, day("B", "taken")),
    ]);
    expect(result).toMatchObject({
      nMin: 2,
      winner: null,
      verdict: "not_enough_data",
    });
  });

  it("calls a small lead too close", () => {
    const result = computeResult([
      ...repeat(6, day("A", "taken")),
      day("A", "missed"),
      ...repeat(7, day("B", "taken")),
    ]);
    expect(result.lift).toBeCloseTo(1 / 7);
    expect(result).toMatchObject({ winner: null, verdict: "too_close" });
  });

  it("treats a lead of exactly 0.15 as a win despite float error", () => {
    const result = computeResult([
      ...repeat(14, day("A", "taken")),
      ...repeat(6, day("A", "missed")),
      ...repeat(17, day("B", "taken")),
      ...repeat(3, day("B", "missed")),
    ]);
    expect(result.lift).toBeCloseTo(0.15);
    expect(result.winner).toBe("B");
  });

  it("counts only on-time days as adherent", () => {
    const result = computeResult([
      day("A", "taken"),
      day("A", "late"),
      day("A", "skipped"),
      day("A", "missed"),
    ]);
    expect(result.aAdh).toBe(0.25);
  });

  it("leaves days not yet logged out of the maths", () => {
    const result = computeResult([
      ...repeat(3, day("A", "taken")),
      ...repeat(4, day("A", null)),
      ...repeat(3, day("B", "taken")),
      ...repeat(4, day("B", null)),
    ]);
    expect(result).toMatchObject({ aAdh: 1, bAdh: 1, nMin: 3 });
  });

  it("averages ease, ignoring days without a rating", () => {
    const result = computeResult([
      day("A", "taken", 2),
      day("A", "taken", 4),
      day("A", "taken", null),
      day("B", "taken", 5),
    ]);
    expect(result.aEase).toBe(3);
    expect(result.bEase).toBe(5);
  });

  it("handles an experiment with nothing logged", () => {
    expect(computeResult([])).toEqual({
      aAdh: null,
      bAdh: null,
      aEase: null,
      bEase: null,
      lift: null,
      winner: null,
      verdict: "not_enough_data",
      nMin: 0,
    });
  });

  it("is the same every time", () => {
    const days = [...repeat(3, day("A", "taken")), ...repeat(3, day("B", "late"))];
    expect(computeResult(days)).toEqual(computeResult(days));
  });
});

describe("experimentMilestone", () => {
  it("fires halfway once, on the day it is reached", () => {
    expect(experimentMilestone(6, 7, 14)).toBe("halfway");
    expect(experimentMilestone(5, 6, 14)).toBeNull();
    expect(experimentMilestone(7, 8, 14)).toBeNull();
  });

  it("fires complete on the last day", () => {
    expect(experimentMilestone(13, 14, 14)).toBe("complete");
  });

  it("doesn't fire when a day is re-saved", () => {
    expect(experimentMilestone(7, 7, 14)).toBeNull();
    expect(experimentMilestone(14, 14, 14)).toBeNull();
  });

  it("rounds halfway up for odd lengths", () => {
    expect(experimentMilestone(3, 4, 7)).toBe("halfway");
  });
});
