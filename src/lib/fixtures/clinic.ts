/**
 * SAMPLE DATA ONLY — a simulated, de-identified clinic panel for the demo.
 * Numbers are generated from a fixed seed so every reload shows the same story.
 * TODO(backend): replace with v_attention_list, v_strategy_leaderboard and
 * per-patient queries (Section 3.5).
 */
import { buildExperimentDays, computeResult, type ExperimentResult } from "@/lib/engine/experiment";
import type { DoseStatus } from "@/lib/engine/types";
import type { ReengageChannel } from "@/lib/engine/reengage";
import type { Weather } from "@/lib/engine/forecast";

/** The nurse who knows each sample teen (records day-10 voice notes). */
export const SAMPLE_NURSE = "Nurse Ana";

export type ClinicBarrier =
  | "forget"
  | "activities"
  | "embarrassed"
  | "feel_fine"
  | "side_effects"
  | "schedule_changes"
  | "mood"
  | "unclear_who"
  | "away";

export type PatientStatus = "green" | "amber" | "red";
export type Factor = "place" | "cue" | "who" | "style";

type ExperimentSpec = {
  barrier: ClinicBarrier;
  factor: Factor;
  hypothesis: string;
  armA: string;
  armB: string;
  baseMiss: number;
  effect: number;
  easeA: number;
  easeB: number;
  status: "active" | "done";
  decision?: "adopted" | "rerun";
  daysLogged: number;
};

type PatientSeed = {
  id: string;
  name: string;
  age: number;
  primary: ClinicBarrier;
  barriers: ClinicBarrier[];
  story: string;
  plan: string;
  adh: number;
  verif: number;
  status: PatientStatus;
  /** Days since the teen's last activity (dose log, check-in or visit). */
  lastCheckinDays: number;
  /** Person-led re-engagement steps already handled. */
  reengageDone?: ReengageChannel[];
  /** Latest weather check-in, or null for no reply (fog). */
  weather: Weather | null;
  /** Days since that reply. */
  weatherDays: number;
  experiments: ExperimentSpec[];
};

const SEEDS: PatientSeed[] = [
  {
    id: "maya", name: "Maya R.", age: 16, primary: "activities", barriers: ["activities", "side_effects"],
    story: "Basketball and exams. Evening doses slip when practice runs late.",
    plan: "Keep a backup in my gym bag", adh: 0.86, verif: 0.5, status: "amber", lastCheckinDays: 2, weather: "cloudy", weatherDays: 2,
    experiments: [
      { barrier: "activities", factor: "place", hypothesis: "A backup in my gym bag will help on late practice nights.", armA: "Only the ones at home", armB: "A backup in my gym bag", baseMiss: 0.34, effect: 0.62, easeA: 2, easeB: 4, status: "done", decision: "adopted", daysLogged: 14 },
      { barrier: "forget", factor: "cue", hypothesis: "Keeping my meds by my toothbrush will help me remember.", armA: "Phone reminder only", armB: "Meds by my toothbrush", baseMiss: 0.3, effect: 0.55, easeA: 3, easeB: 5, status: "active", daysLogged: 9 },
    ],
  },
  {
    id: "kai", name: "Kai T.", age: 17, primary: "embarrassed", barriers: ["embarrassed", "schedule_changes"],
    story: "Won't take meds where friends can see. The school-day dose is the weak point.",
    plan: "A private spot at school, discreet reminders", adh: 0.9, verif: 0.35, status: "green", lastCheckinDays: 1, weather: "sunny", weatherDays: 1,
    experiments: [
      { barrier: "embarrassed", factor: "place", hypothesis: "Taking my meds somewhere private at school will feel easier.", armA: "At the lunch table", armB: "Somewhere private", baseMiss: 0.44, effect: 0.7, easeA: 1, easeB: 4, status: "done", decision: "adopted", daysLogged: 14 },
    ],
  },
  {
    id: "diego", name: "Diego S.", age: 14, primary: "feel_fine", barriers: ["feel_fine", "unclear_who"],
    story: "Feels healthy, so the reason why slips. Has not opened the app in 15 days.",
    plan: "Reason-why reminders, check-in with mom after dinner", adh: 0.7, verif: 0.6, status: "red", lastCheckinDays: 15, reengageDone: ["nurse_voice"], weather: null, weatherDays: 0,
    experiments: [
      { barrier: "feel_fine", factor: "style", hypothesis: "A short reason why with each reminder will help me stick with it.", armA: "Plain reminder", armB: "Reminder with a reason why", baseMiss: 0.42, effect: 0.6, easeA: 3, easeB: 4, status: "active", daysLogged: 7 },
    ],
  },
  {
    id: "aaliyah", name: "Aaliyah B.", age: 15, primary: "side_effects", barriers: ["side_effects", "mood"],
    story: "Side effects wear on her. Her first experiment came back too close to call.",
    plan: "Meds on the nightstand, mom checks in", adh: 0.78, verif: 0.45, status: "amber", lastCheckinDays: 8, weather: "stormy", weatherDays: 8,
    experiments: [
      { barrier: "side_effects", factor: "style", hypothesis: "Logging how I feel each day will help me talk to my care team.", armA: "No feeling log", armB: "One-tap feeling log", baseMiss: 0.38, effect: 0.12, easeA: 3, easeB: 3, status: "done", decision: "rerun", daysLogged: 14 },
    ],
  },
  {
    id: "sam", name: "Sam W.", age: 18, primary: "schedule_changes", barriers: ["schedule_changes", "activities"],
    story: "Rotating night shifts. Testing a pill case that goes to every shift.",
    plan: "Pill case in my work bag", adh: 0.9, verif: 0.2, status: "green", lastCheckinDays: 0, weather: "sunny", weatherDays: 0,
    experiments: [
      { barrier: "schedule_changes", factor: "place", hypothesis: "A pill case in my work bag will help on shift days.", armA: "Meds stay at home", armB: "Pill case in my work bag", baseMiss: 0.4, effect: 0.72, easeA: 2, easeB: 5, status: "done", decision: "adopted", daysLogged: 14 },
    ],
  },
  {
    id: "priya", name: "Priya K.", age: 13, primary: "forget", barriers: ["forget", "unclear_who"],
    story: "Newly handling her own meds. Running a cue experiment with family support.",
    plan: "Breakfast and bedtime check-in with a parent", adh: 0.92, verif: 0.8, status: "amber", lastCheckinDays: 3, weather: "rainy", weatherDays: 3,
    experiments: [
      { barrier: "forget", factor: "who", hypothesis: "A quick check-in from a parent will help me remember.", armA: "I remember on my own", armB: "A parent checks in", baseMiss: 0.38, effect: 0.6, easeA: 3, easeB: 4, status: "active", daysLogged: 11 },
    ],
  },
];

/* ---------- deterministic random numbers ---------- */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type DoseCell = { status: "taken" | "late" | "missed"; verified: boolean };

export type ClinicExperiment = ExperimentSpec & {
  id: string;
  result: ExperimentResult;
};

export type Patient = Omit<PatientSeed, "experiments"> & {
  doses: DoseCell[]; // last 28 doses, oldest first
  onTime: number; // self-reported on-time rate
  verified: number; // share of doses a parent confirmed
  trend: { week: string; selfReported: number; verified: number }[];
  experiments: ClinicExperiment[];
};

function buildExperiment(pid: string, i: number, spec: ExperimentSpec): ClinicExperiment {
  const rnd = mulberry32(hash(`${pid}:${i}`));
  const days = buildExperimentDays(14).map((d) => {
    if (d.day_index > spec.daysLogged) return { arm: d.arm, status: null, ease: null };
    const pMiss = spec.baseMiss * (d.arm === "B" ? 1 - spec.effect : 1);
    const r = rnd();
    const status: DoseStatus = r < pMiss ? "missed" : r < pMiss + 0.05 ? "late" : "taken";
    const base = d.arm === "A" ? spec.easeA : spec.easeB;
    return { arm: d.arm, status, ease: Math.max(1, Math.min(5, Math.round(base + (rnd() - 0.5)))) };
  });
  return { ...spec, id: `${pid}-${i}`, result: computeResult(days) };
}

function buildPatient(seed: PatientSeed): Patient {
  const rnd = mulberry32(hash(`${seed.id}:doses`));
  const doses: DoseCell[] = Array.from({ length: 28 }, () => {
    const r = rnd();
    const status = r < seed.adh ? "taken" : r < seed.adh + 0.08 ? "late" : "missed";
    return { status, verified: status !== "missed" && rnd() < seed.verif };
  });
  const onTime = doses.filter((d) => d.status === "taken").length / doses.length;
  const verified = doses.filter((d) => d.verified).length / doses.length;

  const tr = mulberry32(hash(`${seed.id}:trend`));
  const end = Math.round(onTime * 100);
  const start = seed.status === "green" ? end - 15 : seed.status === "red" ? end + 20 : end - 7;
  const trend = Array.from({ length: 8 }, (_, i) => {
    const base = start + ((end - start) * i) / 7;
    const self = Math.max(35, Math.min(100, Math.round(base + (i === 7 ? 0 : (tr() - 0.5) * 7))));
    return { week: `W${i + 1}`, selfReported: self, verified: Math.round(self * (seed.verif * 0.9 + 0.05)) };
  });

  return {
    ...seed,
    doses,
    onTime,
    verified,
    trend,
    experiments: seed.experiments.map((e, i) => buildExperiment(seed.id, i, e)),
  };
}

export const samplePatients: Patient[] = SEEDS.map(buildPatient);

export function getSamplePatient(id: string) {
  return samplePatients.find((p) => p.id === id) ?? null;
}

/** Strategy leaderboard: which kinds of change teens adopt (v_strategy_leaderboard). */
export function strategyLeaderboard() {
  const all = samplePatients.flatMap((p) => p.experiments);
  const factors: Factor[] = ["place", "cue", "who", "style"];
  return factors
    .map((factor) => {
      const exps = all.filter((e) => e.factor === factor);
      const done = exps.filter((e) => e.status === "done");
      const adopted = done.filter((e) => e.decision === "adopted");
      const lifts = done.flatMap((e) => (e.result.lift === null ? [] : [e.result.lift]));
      return {
        factor,
        tried: exps.length,
        finished: done.length,
        pctAdopted: done.length ? Math.round((adopted.length / done.length) * 100) : null,
        avgLift: lifts.length ? Math.round((lifts.reduce((a, b) => a + b, 0) / lifts.length) * 100) : null,
      };
    })
    .filter((row) => row.tried > 0)
    .sort((a, b) => (b.pctAdopted ?? -1) - (a.pctAdopted ?? -1));
}
