import type { PersonalProfile, Tone } from "@/lib/engine/personalize";

/**
 * SAMPLE DATA ONLY — each teen's reminder preferences and learned pattern.
 * TODO(backend): preferences live on profiles; typicalDelayMin is computed
 * from dose_logs (median of logged_at - scheduled_at over the last 14 days);
 * keptStrategy comes from adopted experiments.
 */
type Seed = Omit<PersonalProfile, "keptStrategy"> & {
  keptStrategy: { label: { en: string; es: string }; wins: number; days: number } | null;
};

const SLEEP = { start: "22:00", end: "06:30" };
const SCHOOL = { start: "08:00", end: "15:00" };

const SEEDS: Record<string, Seed> = {
  // The teen in the teen app (Sam, sample data).
  me: {
    name: "Sam", tone: "playful", discreet: false, doseTime: "19:30", quietHours: [SLEEP, SCHOOL],
    typicalDelayMin: 12, barrier: "forget",
    keptStrategy: { label: { en: "toothbrush trick", es: "truco del cepillo" }, wins: 3, days: 3 },
  },
  maya: {
    name: "Maya", tone: "playful", discreet: false, doseTime: "19:30", quietHours: [SLEEP],
    typicalDelayMin: 18, barrier: "activities",
    keptStrategy: { label: { en: "gym bag backup", es: "reserva en la mochila" }, wins: 6, days: 7 },
  },
  kai: {
    name: "Kai", tone: "direct", discreet: true, doseTime: "12:30", quietHours: [SCHOOL, SLEEP],
    typicalDelayMin: 4, barrier: "embarrassed",
    keptStrategy: { label: { en: "private spot", es: "lugar privado" }, wins: 7, days: 7 },
  },
  diego: {
    name: "Diego", tone: "warm", discreet: false, doseTime: "20:00", quietHours: [SLEEP],
    typicalDelayMin: 25, barrier: "feel_fine", keptStrategy: null,
  },
  aaliyah: {
    name: "Aaliyah", tone: "warm", discreet: false, doseTime: "19:00", quietHours: [SLEEP],
    typicalDelayMin: 8, barrier: "side_effects", keptStrategy: null,
  },
  sam: {
    name: "Sam", tone: "direct", discreet: false, doseTime: "20:00", quietHours: [{ start: "09:00", end: "16:00" }],
    typicalDelayMin: 0, barrier: "schedule_changes",
    keptStrategy: { label: { en: "pill case", es: "pastillero" }, wins: 6, days: 7 },
  },
  priya: {
    name: "Priya", tone: "playful", discreet: false, doseTime: "07:30", quietHours: [SCHOOL, SLEEP],
    typicalDelayMin: 6, barrier: "forget", keptStrategy: null,
  },
};

export const TONES: Tone[] = ["playful", "direct", "warm"];
export const QUIET_PRESETS = { school: SCHOOL, sleep: SLEEP } as const;

/** A teen's profile with strategy text in the right language, or null. */
export function getSampleProfile(id: string, locale: string): PersonalProfile | null {
  const s = SEEDS[id];
  if (!s) return null;
  const lang = locale === "es" ? "es" : "en";
  return {
    ...s,
    quietHours: [...s.quietHours],
    keptStrategy: s.keptStrategy ? { ...s.keptStrategy, label: s.keptStrategy.label[lang] } : null,
  };
}
