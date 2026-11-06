/**
 * Caregiver sharing by age.
 *
 *   Under 18          -> all data is shared with the caregiver (not optional).
 *   18+, no consent   -> must see the adult terms screen before using the app;
 *                        the caregiver sees nothing in the meantime.
 *   18+, consented    -> shared only if the patient turned sharing on.
 *
 * Age comes from month + year of birth (no day), entered by the clinician.
 * The birthday is taken as the 1st of the birth month.
 */

export const ADULT_AGE = 18;

export type SharingMode = "minor_shared" | "adult_needs_consent" | "adult_shared" | "adult_private";

export type AdultConsent = { share: boolean; agreedAt: string };

const BIRTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** "2009-03" -> { year: 2009, month: 3 }, or null if malformed. */
export function parseBirth(value: string) {
  const m = BIRTH.exec(value);
  return m ? { year: Number(m[1]), month: Number(m[2]) } : null;
}

/** Whole years old on `today`, counting the birthday as the 1st of the month. */
export function ageInYears(birth: string, today: Date) {
  const b = parseBirth(birth);
  if (!b) return null;
  const months = (today.getFullYear() - b.year) * 12 + (today.getMonth() + 1 - b.month);
  return Math.floor(months / 12);
}

/** "YYYY-MM" of the month the patient turns 18. */
export function adultMonth(birth: string) {
  const b = parseBirth(birth);
  return b ? `${b.year + ADULT_AGE}-${String(b.month).padStart(2, "0")}` : null;
}

export function sharingMode(age: number, consent: AdultConsent | null): SharingMode {
  if (age < ADULT_AGE) return "minor_shared";
  if (!consent) return "adult_needs_consent";
  return consent.share ? "adult_shared" : "adult_private";
}

/** True when the caregiver may see the patient's data. */
export function caregiverCanSee(mode: SharingMode) {
  return mode === "minor_shared" || mode === "adult_shared";
}

/** Program ages a clinician can enroll (pediatric + young adult transition). */
export function isEnrollableAge(age: number | null): age is number {
  return age !== null && age >= 8 && age <= 25;
}
