import type { TeenHomeData } from "@/components/teen/types";

/**
 * SAMPLE DATA ONLY — simulated, not a real patient.
 * Used until Lane DB's tables and queries land.
 */
export const sampleTeenHome: TeenHomeData = {
  displayName: "Sam",
  xp: 140,
  slots: [
    {
      id: "slot-morning",
      time: "07:30",
      label: "morning",
      status: "pending",
      meds: [
        { id: "pm-tac-am", name: "Tacrolimus", form: "capsule", color: "#3c717d" },
        { id: "pm-myc-am", name: "Mycophenolate", form: "tablet", color: "#17283d" },
      ],
    },
    {
      id: "slot-evening",
      time: "19:30",
      label: "evening",
      status: "pending",
      meds: [
        { id: "pm-tac-pm", name: "Tacrolimus", form: "capsule", color: "#3c717d" },
        { id: "pm-myc-pm", name: "Mycophenolate", form: "tablet", color: "#17283d" },
      ],
    },
  ],
  quest: { id: "exp-1", title: "Morning Routine Challenge", day: 7, days: 14 },
};
