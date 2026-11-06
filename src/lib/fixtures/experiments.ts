import { buildExperimentDays } from "@/lib/engine/experiment";
import type { DoseStatus } from "@/lib/engine/types";
import type { IdeaTemplate } from "@/components/experiments/types";

/**
 * SAMPLE DATA ONLY — simulated, not a real patient.
 * The idea library is placeholder content for the care team to review.
 * Ideas only change routine (where, cues, who helps, how) — never what,
 * how much, or when a medicine is taken.
 */
export const ideaLibrary: IdeaTemplate[] = [
  { key: "toothbrush", barrier: "forget", factor: "cue" },
  { key: "nightBefore", barrier: "busy", factor: "style" },
  { key: "ownRoom", barrier: "embarrassed", factor: "place" },
  { key: "friendText", barrier: "away", factor: "who" },
  { key: "parentCheck", barrier: "forget", factor: "who" },
  { key: "pillCase", barrier: "away", factor: "place" },
];

/** The sample teen's barriers, picked in onboarding. */
export const sampleBarriers = ["forget", "busy"] as const;

// Days 1-6 logged; today is day 7. B (pills by the toothbrush) is ahead.
const sampleLog: { status: DoseStatus; ease: number }[] = [
  { status: "late", ease: 3 }, // A
  { status: "taken", ease: 4 }, // B
  { status: "missed", ease: 2 }, // A
  { status: "taken", ease: 5 }, // B
  { status: "taken", ease: 3 }, // A
  { status: "taken", ease: 4 }, // B
];

export const sampleExperiment = {
  id: "exp-1",
  ideaKey: "toothbrush",
  factor: "cue" as const,
  status: "active" as const,
  decision: null,
  today: 7,
  days: buildExperimentDays(14).map((d, i) => ({
    dayIndex: d.day_index,
    arm: d.arm,
    status: sampleLog[i]?.status ?? null,
    ease: sampleLog[i]?.ease ?? null,
  })),
};

export const sampleQuests = [
  { key: "onboard", xpReward: 20, progress: 1, status: "complete" as const },
  { key: "firstExperiment", xpReward: 50, progress: 6 / 14, status: "active" as const },
  { key: "exploreMeds", xpReward: 15, progress: 0, status: "available" as const },
  { key: "twoWeeksMornings", xpReward: 100, progress: 9 / 14, status: "active" as const },
];
