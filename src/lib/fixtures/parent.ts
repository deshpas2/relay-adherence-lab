/** SAMPLE DATA ONLY — simulated family, not real people. */
export const sampleFamily = {
  teenName: "Maya",
  inviteCode: "K7QM4-XP2R9",
  shareLevel: "adherence" as const,
  onTimeRate: 0.86,
  takenLast14: 24,
  totalLast14: 28,
  doses: [
    { id: "d1", slot: "morning" as const, time: "07:30", loggedAt: "07:34", day: "today" as const },
    { id: "d2", slot: "evening" as const, time: "19:30", loggedAt: "19:41", day: "yesterday" as const },
    { id: "d3", slot: "morning" as const, time: "07:30", loggedAt: "07:29", day: "yesterday" as const },
  ],
  barrierKeys: ["forget", "busy", "feel", "away", "embarrassed"] as const,
};
