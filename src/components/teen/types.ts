/**
 * What the teen screens need to draw. Kept close to the tables in
 * BUILD_GUIDE Section 3 so sample data can be swapped for real queries.
 */

export type MedForm = "pill" | "capsule" | "syrup" | "tablet" | "inhaler";

export type MedSummary = {
  /** patient_medications.id */
  id: string;
  /** medications.display_name — always from the catalog, never typed by the app */
  name: string;
  form: MedForm;
  color: string;
};

export type SlotStatus = "pending" | "taken" | "late" | "missed";

/** One time of day on the teen's schedule, with the meds due then. */
export type DoseSlot = {
  id: string;
  /** "07:30", from patient_medications.schedule */
  time: string;
  label: "morning" | "afternoon" | "evening" | "bedtime";
  meds: MedSummary[];
  status: SlotStatus;
  /** "07:32" once logged */
  loggedAt?: string;
};

export type QuestSummary = {
  id: string;
  title: string;
  day: number;
  days: number;
};

export type TeenHomeData = {
  displayName: string;
  /** game_state.xp */
  xp: number;
  slots: DoseSlot[];
  quest: QuestSummary | null;
};
