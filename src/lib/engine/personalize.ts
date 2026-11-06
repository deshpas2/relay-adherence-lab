/**
 * Personalization layer: picks WHEN to send a teen's reminder and WHICH
 * hand-written message to use, from their situation and preferences.
 *
 * Safety: it only moves the REMINDER, never the dose. The reminder always goes
 * out at or before the dose time the care team set, and never more than
 * `maxLeadMin` before it. Wording comes from a reviewed library (messages
 * files, key `Personal`); nothing is AI-written. Returns keys + params, not
 * text, so every line stays translatable and copy-linted.
 */

export type Tone = "playful" | "direct" | "warm";

export type PersonalProfile = {
  name: string;
  tone: Tone;
  /** Lock-screen privacy: neutral wording that never hints at health. */
  discreet: boolean;
  /** "HH:MM" set by the care team. Never changed here. */
  doseTime: string;
  /** Times the teen doesn't want messages, e.g. school or sleep. */
  quietHours: { start: string; end: string }[];
  /** Learned: median minutes between dose time and the teen's log (+ = late). */
  typicalDelayMin: number | null;
  /** The teen's biggest barrier key, from onboarding. */
  barrier: string;
  /** A strategy the teen kept from an experiment, with its record. */
  keptStrategy: { label: string; wins: number; days: number } | null;
};

export type ReasonCode =
  | "default_lead"
  | "earlier_for_late_pattern"
  | "moved_for_quiet_hours"
  | "dose_in_quiet_hours"
  | "tone"
  | "discreet"
  | "kept_strategy"
  | "barrier_tip";

export type Reason = { code: ReasonCode; params?: Record<string, string | number> };

export type PersonalMessage = {
  /** "HH:MM" when the reminder goes out. */
  sendAt: string;
  /** Minutes before the dose time. */
  leadMin: number;
  titleKey: string;
  bodyKeys: string[];
  params: Record<string, string | number>;
  reasons: Reason[];
};

const DEFAULT_LEAD = 10;
const MIN_LEAD = 5;
export const maxLeadMin = 30;

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const toHHMM = (min: number) => {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

/** True if minute-of-day `t` falls in the window (windows may cross midnight). */
function inWindow(t: number, w: { start: string; end: string }) {
  const s = toMin(w.start);
  const e = toMin(w.end);
  return s <= e ? t >= s && t < e : t >= s || t < e;
}

/** When to send: earlier for a teen who usually logs late, and out of quiet hours. */
export function pickSendTime(p: Pick<PersonalProfile, "doseTime" | "quietHours" | "typicalDelayMin">) {
  const dose = toMin(p.doseTime);
  const reasons: Reason[] = [];

  let lead = DEFAULT_LEAD;
  if (p.typicalDelayMin !== null && p.typicalDelayMin > 5) {
    lead = Math.min(maxLeadMin, Math.max(MIN_LEAD, DEFAULT_LEAD + p.typicalDelayMin));
    reasons.push({ code: "earlier_for_late_pattern", params: { delay: p.typicalDelayMin, lead } });
  } else {
    reasons.push({ code: "default_lead", params: { lead } });
  }

  const quiet = (t: number) => p.quietHours.find((w) => inWindow(t, w));
  if (quiet(dose)) {
    // The dose itself is in quiet hours: the care team's time wins, send just before.
    lead = MIN_LEAD;
    reasons.splice(0, reasons.length, { code: "dose_in_quiet_hours", params: { lead } });
  } else {
    // Move earlier, a minute at a time, until out of quiet hours (within the max lead),
    // else move later toward the dose.
    let t = dose - lead;
    if (quiet(t)) {
      let fixed: number | null = null;
      for (let l = lead + 1; l <= maxLeadMin; l++) if (!quiet(dose - l)) { fixed = l; break; }
      if (fixed === null) for (let l = lead - 1; l >= 0; l--) if (!quiet(dose - l)) { fixed = l; break; }
      if (fixed !== null) {
        lead = fixed;
        t = dose - lead;
        reasons.push({ code: "moved_for_quiet_hours", params: { lead } });
      }
    }
  }

  return { sendAt: toHHMM(dose - lead), leadMin: lead, reasons };
}

/** Builds the teen's next dose reminder. */
export function personalizeReminder(p: PersonalProfile): PersonalMessage {
  const timing = pickSendTime(p);
  const reasons = [...timing.reasons];
  const params: Record<string, string | number> = { name: p.name };

  if (p.discreet) {
    reasons.push({ code: "discreet" });
    return { ...timing, titleKey: "discreet_title", bodyKeys: ["discreet_body"], params, reasons };
  }

  reasons.push({ code: "tone", params: { tone: p.tone } });
  const bodyKeys = [`${p.tone}_body`];
  if (p.keptStrategy && p.keptStrategy.days > 0) {
    params.strategy = p.keptStrategy.label;
    params.wins = p.keptStrategy.wins;
    params.days = p.keptStrategy.days;
    bodyKeys.push("strategy_line");
    reasons.push({ code: "kept_strategy", params: { wins: p.keptStrategy.wins, days: p.keptStrategy.days } });
  } else {
    bodyKeys.push(`tip_${p.barrier}`);
    reasons.push({ code: "barrier_tip", params: { barrier: p.barrier } });
  }
  return { ...timing, titleKey: `${p.tone}_title`, bodyKeys, params, reasons };
}
