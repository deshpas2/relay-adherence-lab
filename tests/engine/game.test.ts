import { describe, expect, it } from "vitest";
import {
  applyXp,
  levelForXp,
  levelProgress,
  updateQuestProgress,
  xpForEvent,
  xpForLevel,
} from "@/lib/engine/game";

describe("xpForEvent", () => {
  it("matches the guide", () => {
    expect(xpForEvent({ type: "dose_logged", status: "taken" })).toBe(10);
    expect(xpForEvent({ type: "experiment_day" })).toBe(5);
    expect(xpForEvent({ type: "quest_complete", reward: 30 })).toBe(30);
    expect(xpForEvent({ type: "med_explored", firstTime: true })).toBe(15);
    expect(xpForEvent({ type: "finding_adopted" })).toBe(50);
  });

  it("gives on-time XP only for on-time doses", () => {
    expect(xpForEvent({ type: "dose_logged", status: "late" })).toBe(0);
    expect(xpForEvent({ type: "dose_logged", status: "missed" })).toBe(0);
    expect(xpForEvent({ type: "dose_logged", status: "skipped" })).toBe(0);
  });

  it("gives explore XP only once per med", () => {
    expect(xpForEvent({ type: "med_explored", firstTime: false })).toBe(0);
  });

  it("never returns a negative amount", () => {
    expect(xpForEvent({ type: "quest_complete", reward: -40 })).toBe(0);
  });
});

describe("levelForXp", () => {
  it("follows floor(sqrt(xp / 50)) + 1", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(49)).toBe(1);
    expect(levelForXp(50)).toBe(2);
    expect(levelForXp(199)).toBe(2);
    expect(levelForXp(200)).toBe(3);
    expect(levelForXp(450)).toBe(4);
    expect(levelForXp(5000)).toBe(11);
  });

  it("treats bad input as level 1", () => {
    expect(levelForXp(-10)).toBe(1);
    expect(levelForXp(Number.NaN)).toBe(1);
  });
});

describe("xpForLevel", () => {
  it("is the first XP total that reaches each level", () => {
    for (let level = 1; level <= 30; level++) {
      const floor = xpForLevel(level);
      expect(levelForXp(floor)).toBe(level);
      if (floor > 0) expect(levelForXp(floor - 1)).toBe(level - 1);
    }
  });
});

describe("levelProgress", () => {
  it("shows progress through the current level", () => {
    expect(levelProgress(125)).toEqual({
      level: 2,
      levelStartXp: 50,
      nextLevelXp: 200,
      xpIntoLevel: 75,
      xpToNext: 75,
      fraction: 0.5,
    });
  });

  it("starts each level at zero", () => {
    expect(levelProgress(200)).toMatchObject({ level: 3, xpIntoLevel: 0, fraction: 0 });
  });
});

describe("applyXp", () => {
  it("adds XP and reports a level up", () => {
    expect(applyXp({ xp: 45 }, [{ type: "dose_logged", status: "taken" }])).toEqual({
      xp: 55,
      level: 2,
      gained: 10,
      leveledUp: true,
    });
  });

  it("adds several events at once", () => {
    const next = applyXp({ xp: 0 }, [
      { type: "dose_logged", status: "taken" },
      { type: "experiment_day" },
    ]);
    expect(next).toMatchObject({ xp: 15, gained: 15, leveledUp: false });
  });

  it("never lowers XP or level", () => {
    const next = applyXp({ xp: 500 }, [
      { type: "dose_logged", status: "missed" },
      { type: "quest_complete", reward: -100 },
    ]);
    expect(next).toEqual({ xp: 500, level: 4, gained: 0, leveledUp: false });
  });
});

describe("updateQuestProgress", () => {
  const fresh = { progress: 0, status: "available" as const };

  it("moves a quest to active", () => {
    expect(updateQuestProgress(fresh, 0.5)).toEqual({
      progress: 0.5,
      status: "active",
      completedNow: false,
    });
  });

  it("completes a quest once", () => {
    const done = updateQuestProgress(fresh, 1);
    expect(done).toEqual({ progress: 1, status: "complete", completedNow: true });
    expect(updateQuestProgress(done, 1).completedNow).toBe(false);
  });

  it("never moves progress backwards", () => {
    const quest = { progress: 0.8, status: "active" as const };
    expect(updateQuestProgress(quest, 0.2).progress).toBe(0.8);
  });

  it("keeps progress between 0 and 1", () => {
    expect(updateQuestProgress(fresh, 3).progress).toBe(1);
    expect(updateQuestProgress(fresh, -1).progress).toBe(0);
  });
});
