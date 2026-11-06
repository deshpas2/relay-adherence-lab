import { describe, expect, it } from "vitest";
import { maxLeadMin, personalizeReminder, pickSendTime, type PersonalProfile } from "@/lib/engine/personalize";

const base: PersonalProfile = {
  name: "Maya",
  tone: "playful",
  discreet: false,
  doseTime: "19:30",
  quietHours: [],
  typicalDelayMin: null,
  barrier: "forget",
  keptStrategy: null,
};

const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));

describe("pickSendTime", () => {
  it("sends 10 minutes before the dose by default", () => {
    expect(pickSendTime(base)).toMatchObject({ sendAt: "19:20", leadMin: 10 });
  });

  it("sends earlier for a teen who usually logs late, up to the cap", () => {
    expect(pickSendTime({ ...base, typicalDelayMin: 12 })).toMatchObject({ sendAt: "19:08", leadMin: 22 });
    expect(pickSendTime({ ...base, typicalDelayMin: 90 }).leadMin).toBe(maxLeadMin);
  });

  it("moves out of quiet hours", () => {
    const r = pickSendTime({ ...base, doseTime: "07:30", quietHours: [{ start: "07:15", end: "07:25" }] });
    expect(r.sendAt).toBe("07:14");
    expect(r.reasons.map((x) => x.code)).toContain("moved_for_quiet_hours");
  });

  it("handles quiet hours that cross midnight", () => {
    const r = pickSendTime({ ...base, doseTime: "06:30", quietHours: [{ start: "22:00", end: "06:25" }] });
    expect(minutes(r.sendAt)).toBeGreaterThanOrEqual(minutes("06:25"));
  });

  it("keeps the care team's dose time when the dose is in quiet hours", () => {
    const r = pickSendTime({ ...base, doseTime: "12:30", quietHours: [{ start: "08:00", end: "15:00" }] });
    expect(r).toMatchObject({ sendAt: "12:25", leadMin: 5 });
  });

  it("never sends after the dose or more than the cap before it", () => {
    for (const delay of [null, -20, 0, 6, 15, 40, 200]) {
      for (const dose of ["00:05", "07:30", "12:00", "23:59"]) {
        const r = pickSendTime({ ...base, doseTime: dose, typicalDelayMin: delay });
        expect(r.leadMin).toBeGreaterThanOrEqual(0);
        expect(r.leadMin).toBeLessThanOrEqual(maxLeadMin);
      }
    }
  });
});

describe("personalizeReminder", () => {
  it("uses the teen's tone and their barrier tip", () => {
    const m = personalizeReminder(base);
    expect(m.titleKey).toBe("playful_title");
    expect(m.bodyKeys).toEqual(["playful_body", "tip_forget"]);
  });

  it("brings up a strategy the teen kept instead of a tip", () => {
    const m = personalizeReminder({ ...base, tone: "warm", keptStrategy: { label: "gym bag backup", wins: 6, days: 7 } });
    expect(m.bodyKeys).toEqual(["warm_body", "strategy_line"]);
    expect(m.params).toMatchObject({ strategy: "gym bag backup", wins: 6, days: 7 });
  });

  it("goes neutral in discreet mode, with no strategy or barrier", () => {
    const m = personalizeReminder({ ...base, discreet: true, keptStrategy: { label: "x", wins: 1, days: 1 } });
    expect(m.titleKey).toBe("discreet_title");
    expect(m.bodyKeys).toEqual(["discreet_body"]);
    expect(m.reasons.map((r) => r.code)).toContain("discreet");
  });
});
