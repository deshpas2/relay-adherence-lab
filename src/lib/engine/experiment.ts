import type { Arm, DoseStatus } from "./types";

export type ExperimentDay = {
  arm: Arm;
  /** Null until the teen logs that day. */
  status: DoseStatus | null;
  ease: number | null;
};

export type Verdict =
  | "a_winning"
  | "b_winning"
  | "too_close"
  | "not_enough_data";

export type ExperimentResult = {
  aAdh: number | null;
  bAdh: number | null;
  aEase: number | null;
  bEase: number | null;
  /** B's on-time rate minus A's. Positive means B is ahead. */
  lift: number | null;
  winner: Arm | null;
  verdict: Verdict;
  /** Logged days in whichever arm has fewer. */
  nMin: number;
};

const minDaysPerArm = 3;
const minLift = 0.15;
/** Stops 0.85 - 0.7 = 0.1499... from missing a lead of exactly 0.15. */
const floatTolerance = 1e-9;

const average = (values: number[]) =>
  values.length === 0
    ? null
    : values.reduce((sum, value) => sum + value, 0) / values.length;

/** Alternates arms so each gets the same number of days, starting with A. */
export function buildExperimentDays(days = 14) {
  return Array.from({ length: days }, (_, index) => ({
    day_index: index + 1,
    arm: (index % 2 === 0 ? "A" : "B") as Arm,
  }));
}

function summarizeArm(days: ExperimentDay[], arm: Arm) {
  const logged = days.filter((day) => day.arm === arm && day.status !== null);
  const onTime = logged.filter((day) => day.status === "taken").length;
  const ease = logged.flatMap((day) => (day.ease === null ? [] : [day.ease]));

  return {
    logged: logged.length,
    adherence: logged.length === 0 ? null : onTime / logged.length,
    ease: average(ease),
  };
}

/**
 * Compares the two arms. It only names a winner on enough data and a clear
 * lead, so a teen is never told something worked on the strength of noise.
 */
export function computeResult(days: ExperimentDay[]): ExperimentResult {
  const a = summarizeArm(days, "A");
  const b = summarizeArm(days, "B");
  const nMin = Math.min(a.logged, b.logged);
  const lift =
    a.adherence === null || b.adherence === null
      ? null
      : b.adherence - a.adherence;

  const base = {
    aAdh: a.adherence,
    bAdh: b.adherence,
    aEase: a.ease,
    bEase: b.ease,
    lift,
    nMin,
  };

  if (lift === null || nMin < minDaysPerArm) {
    return { ...base, winner: null, verdict: "not_enough_data" };
  }
  if (Math.abs(lift) < minLift - floatTolerance) {
    return { ...base, winner: null, verdict: "too_close" };
  }
  return lift > 0
    ? { ...base, winner: "B", verdict: "b_winning" }
    : { ...base, winner: "A", verdict: "a_winning" };
}

/**
 * Which pop-up a newly logged day earns, if any. Takes the logged-day count
 * before and after, so re-saving a day can't fire the same pop-up twice.
 */
export function experimentMilestone(
  loggedBefore: number,
  loggedAfter: number,
  totalDays: number,
): "halfway" | "complete" | null {
  if (loggedAfter <= loggedBefore) return null;
  if (loggedBefore < totalDays && loggedAfter >= totalDays) return "complete";

  const halfway = Math.ceil(totalDays / 2);
  return loggedBefore < halfway && loggedAfter >= halfway ? "halfway" : null;
}
