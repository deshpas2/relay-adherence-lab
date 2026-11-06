import { describe, expect, it } from "vitest";
import { reengagementPlan } from "@/lib/engine/reengage";

const states = (days: number, done: Parameters<typeof reengagementPlan>[1] = []) =>
  reengagementPlan(days, done).steps.map((s) => s.state);

describe("reengagementPlan", () => {
  it("does nothing for an active teen", () => {
    const plan = reengagementPlan(0);
    expect(plan.active).toBe(false);
    expect(plan.current).toBeNull();
    expect(plan.next?.channel).toBe("app");
    expect(states(2)).toEqual(["upcoming", "upcoming", "upcoming", "upcoming"]);
  });

  it("steps up on days 3, 7, 10 and 14", () => {
    expect(reengagementPlan(3).current?.channel).toBe("app");
    expect(reengagementPlan(7).current?.channel).toBe("sms");
    expect(reengagementPlan(10).current?.channel).toBe("nurse_voice");
    expect(reengagementPlan(14).current?.channel).toBe("care_team_call");
    expect(reengagementPlan(6).current?.channel).toBe("app");
  });

  it("sends app and text steps automatically", () => {
    expect(states(8)).toEqual(["sent", "sent", "upcoming", "upcoming"]);
  });

  it("waits on a person for the voice note and the call", () => {
    expect(states(10)).toEqual(["sent", "sent", "action_needed", "upcoming"]);
    expect(states(15, ["nurse_voice"])).toEqual(["sent", "sent", "done", "action_needed"]);
    expect(reengagementPlan(15, ["nurse_voice"]).callNeeded).toBe(true);
    expect(reengagementPlan(15, ["nurse_voice", "care_team_call"]).callNeeded).toBe(false);
  });

  it("says how long until the next step", () => {
    const plan = reengagementPlan(8);
    expect(plan.next?.channel).toBe("nurse_voice");
    expect(plan.next?.dueInDays).toBe(2);
    expect(reengagementPlan(20).next).toBeNull();
  });

  it("treats bad input as zero days", () => {
    expect(reengagementPlan(-4).daysQuiet).toBe(0);
    expect(reengagementPlan(3.9).daysQuiet).toBe(3);
  });
});
