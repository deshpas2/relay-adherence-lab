/**
 * Re-engagement ladder for a teen who goes quiet (no dose log, check-in or
 * app visit). Each step stays with the teen and gets more personal:
 *
 *   Day 3   app notification        (automatic)
 *   Day 7   text message            (automatic, no health details)
 *   Day 10  voice note from their own nurse  (a person records it)
 *   Day 14  care team phone call    (a person makes it)
 *
 * Any activity from the teen resets the count to 0, so the ladder stops.
 * Pure and deterministic so every step can be tested.
 */

export type ReengageChannel = "app" | "sms" | "nurse_voice" | "care_team_call";

export const REENGAGE_LADDER: readonly { day: number; channel: ReengageChannel; needsPerson: boolean }[] = [
  { day: 3, channel: "app", needsPerson: false },
  { day: 7, channel: "sms", needsPerson: false },
  { day: 10, channel: "nurse_voice", needsPerson: true },
  { day: 14, channel: "care_team_call", needsPerson: true },
];

export type StepState =
  /** Not reached yet. */
  | "upcoming"
  /** Reached and sent automatically. */
  | "sent"
  /** Reached, and a person still needs to act (record / call). */
  | "action_needed"
  /** Reached, and the person has acted. */
  | "done";

export type ReengageStep = {
  day: number;
  channel: ReengageChannel;
  needsPerson: boolean;
  state: StepState;
  /** Days until this step, 0 once reached. */
  dueInDays: number;
};

/**
 * Where a teen is on the ladder.
 * @param daysQuiet whole days since the teen's last activity
 * @param completed person-led steps already handled (e.g. the nurse recorded)
 */
export function reengagementPlan(daysQuiet: number, completed: readonly ReengageChannel[] = []) {
  const days = Math.max(0, Math.floor(daysQuiet));
  const steps: ReengageStep[] = REENGAGE_LADDER.map((s) => {
    const reached = days >= s.day;
    const state: StepState = !reached
      ? "upcoming"
      : !s.needsPerson
        ? "sent"
        : completed.includes(s.channel)
          ? "done"
          : "action_needed";
    return { ...s, state, dueInDays: Math.max(0, s.day - days) };
  });
  const reached = steps.filter((s) => s.state !== "upcoming");
  return {
    daysQuiet: days,
    /** True once the first step is reached. */
    active: reached.length > 0,
    /** The highest step reached, or null. */
    current: reached.at(-1) ?? null,
    /** The next step not yet reached, or null after day 14. */
    next: steps.find((s) => s.state === "upcoming") ?? null,
    /** True when the care team must call (day 14 reached and no call logged). */
    callNeeded: steps.some((s) => s.channel === "care_team_call" && s.state === "action_needed"),
    steps,
  };
}
