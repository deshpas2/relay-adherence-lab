import type { FormState } from "@/components/auth/form-state";

/**
 * Barrier keys, matching barriers.key in the database (Section 3.3).
 * Labels live under Onboarding.barrier_<key> in the messages files.
 * TODO(lane-db): load from the barriers table once it's seeded.
 */
export const BARRIER_KEYS = [
  "forget",
  "busy",
  "taste",
  "swallow",
  "embarrassed",
  "away",
  "feel",
] as const;

export type BarrierKey = (typeof BARRIER_KEYS)[number];

/** A time of day on the teen's schedule (set by the care team). */
export type ScheduleSlot = {
  id: string;
  label: "morning" | "afternoon" | "evening" | "bedtime";
  /** "07:30" */
  time: string;
};

/** Everything onboarding collects. Writes teen_barriers + reminder times. */
export type OnboardingAnswers = {
  barriers: BarrierKey[];
  primaryBarrier: BarrierKey | "other" | null;
  /** The "Something else" box. Empty if not used. */
  otherText: string;
  reminders: { slotId: string; time: string }[];
};

/** Lane Backend: a server action that saves answers and completes the onboard quest. */
export type SaveOnboarding = (answers: OnboardingAnswers) => Promise<FormState>;
