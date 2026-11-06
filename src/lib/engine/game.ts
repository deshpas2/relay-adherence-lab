import type { DoseStatus } from "./types";

export const xpRewards = {
  doseOnTime: 10,
  experimentDay: 5,
  medExplored: 15,
  findingAdopted: 50,
} as const;

const xpPerLevelStep = 50;

export type XpEvent =
  | { type: "dose_logged"; status: DoseStatus }
  | { type: "experiment_day" }
  | { type: "quest_complete"; reward: number }
  | { type: "med_explored"; firstTime: boolean }
  | { type: "finding_adopted" };

/** Positive-only: the lowest any event can score is 0. */
export function xpForEvent(event: XpEvent): number {
  switch (event.type) {
    case "dose_logged":
      return event.status === "taken" ? xpRewards.doseOnTime : 0;
    case "experiment_day":
      return xpRewards.experimentDay;
    case "quest_complete":
      return Math.max(0, event.reward);
    case "med_explored":
      return event.firstTime ? xpRewards.medExplored : 0;
    case "finding_adopted":
      return xpRewards.findingAdopted;
  }
}

export function levelForXp(xp: number): number {
  if (!(xp > 0)) return 1;
  return Math.floor(Math.sqrt(xp / xpPerLevelStep)) + 1;
}

/** The XP total at which a level begins. */
export function xpForLevel(level: number): number {
  return xpPerLevelStep * (level - 1) ** 2;
}

/** Everything an XP bar needs. */
export function levelProgress(xp: number) {
  const level = levelForXp(xp);
  const levelStartXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const xpIntoLevel = xp - levelStartXp;

  return {
    level,
    levelStartXp,
    nextLevelXp,
    xpIntoLevel,
    xpToNext: nextLevelXp - xp,
    fraction: xpIntoLevel / (nextLevelXp - levelStartXp),
  };
}

export function applyXp(state: { xp: number }, events: XpEvent[]) {
  const gained = events.reduce((sum, event) => sum + xpForEvent(event), 0);
  const xp = state.xp + gained;
  const level = levelForXp(xp);

  return {
    xp,
    level,
    gained,
    leveledUp: level > levelForXp(state.xp),
  };
}

export type QuestStatus = "available" | "active" | "complete";

/**
 * Moves a quest forward. Progress never goes back, and `completedNow` is true
 * only on the update that finishes it, so a reward can't be paid twice.
 */
export function updateQuestProgress(
  current: { progress: number; status: QuestStatus },
  value: number,
) {
  const progress = Math.min(1, Math.max(current.progress, value, 0));
  const status: QuestStatus =
    progress >= 1 ? "complete" : progress > 0 ? "active" : current.status;

  return {
    progress,
    status,
    completedNow: status === "complete" && current.status !== "complete",
  };
}
