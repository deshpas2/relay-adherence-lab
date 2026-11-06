import "server-only";
import { cookies } from "next/headers";
import { ageInYears, sharingMode, type AdultConsent } from "@/lib/engine/consent";

/**
 * DEMO state for the sample teen (Sam) and their caregiver, kept in cookies so
 * the teen app and the parent app on the same laptop/phone agree.
 * TODO(backend): birth month/year on the patient record (set at enrollment),
 * and adult consent + share choice on guardian_links, enforced by RLS.
 */
export const BIRTH_COOKIE = "relay_demo_birth";
export const CONSENT_COOKIE = "relay_adult_consent";

export const SAMPLE_TEEN = { name: "Sam", caregiver: "Elena", defaultBirth: "2009-03" };

function parseConsent(raw: string | undefined): AdultConsent | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as AdultConsent;
    return typeof v.share === "boolean" && typeof v.agreedAt === "string" ? v : null;
  } catch {
    return null;
  }
}

export async function getTeenSharing() {
  const store = await cookies();
  const birth = store.get(BIRTH_COOKIE)?.value ?? SAMPLE_TEEN.defaultBirth;
  const age = ageInYears(birth, new Date()) ?? 17;
  const consent = parseConsent(store.get(CONSENT_COOKIE)?.value);
  return { ...SAMPLE_TEEN, birth, age, consent, mode: sharingMode(age, consent) };
}
