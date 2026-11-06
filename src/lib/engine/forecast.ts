/**
 * Relay Forecast: teens report their week as weather; the care team sees a
 * signal. A missing reply is "fog": we've lost the signal.
 *
 *   sunny  -> doing_well    (meds went fine)
 *   cloudy -> watch         (a bit harder)
 *   rainy  -> check_soon    (missed some, something's up)
 *   stormy -> needs_person  (really struggling)
 *   none   -> fog           (no reply)
 */

export type Weather = "sunny" | "cloudy" | "rainy" | "stormy";
export type CareSignal = "doing_well" | "watch" | "check_soon" | "needs_person" | "fog";

export const WEATHERS: Weather[] = ["sunny", "cloudy", "rainy", "stormy"];

const SIGNAL: Record<Weather, CareSignal> = {
  sunny: "doing_well",
  cloudy: "watch",
  rainy: "check_soon",
  stormy: "needs_person",
};

/** Check-ins go out on these weekdays (0 = Sunday): Monday and Thursday. */
export const CHECKIN_DAYS = [1, 4] as const;

/** The care-team signal for a teen's latest reply, or fog if they haven't replied. */
export function weatherSignal(weather: Weather | null): CareSignal {
  return weather ? SIGNAL[weather] : "fog";
}

/** True when a person on the care team should reach out. */
export function needsPerson(signal: CareSignal) {
  return signal === "needs_person" || signal === "fog";
}

/** Days from `weekday` (0-6) until the next check-in day, 0 if today is one. */
export function daysUntilCheckin(weekday: number, days: readonly number[] = CHECKIN_DAYS) {
  const d = ((Math.floor(weekday) % 7) + 7) % 7;
  return Math.min(...days.map((c) => (c - d + 7) % 7));
}

/** Sorts signals worst first, so the clinic forecast leads with who needs help. */
export const SIGNAL_ORDER: CareSignal[] = ["needs_person", "fog", "check_soon", "watch", "doing_well"];
