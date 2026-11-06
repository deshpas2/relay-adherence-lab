"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ADULT_AGE } from "@/lib/engine/consent";
import { BIRTH_COOKIE, CONSENT_COOKIE, getTeenSharing, SAMPLE_TEEN } from "./state";

const YEAR = 60 * 60 * 24 * 365;
const opts = { path: "/", maxAge: YEAR, sameSite: "lax" as const, httpOnly: true };

/** The 18+ terms screen: needs the box ticked; sharing is off unless switched on. */
export async function acceptAdultTerms(formData: FormData) {
  const { age } = await getTeenSharing();
  if (age < ADULT_AGE || formData.get("agree") !== "on") redirect("/teen/turning-18");
  const share = formData.get("share") === "on";
  (await cookies()).set(CONSENT_COOKIE, JSON.stringify({ share, agreedAt: new Date().toISOString() }), opts);
  redirect("/teen/home");
}

/** Me tab: an adult turns caregiver sharing on or off. Ignored under 18. */
export async function setCaregiverSharing(share: boolean) {
  const { age, consent } = await getTeenSharing();
  if (age < ADULT_AGE || !consent) return;
  (await cookies()).set(CONSENT_COOKIE, JSON.stringify({ ...consent, share }), opts);
  revalidatePath("/", "layout");
}

/** DEMO: make Sam 17, or 18 as of this month (which brings up the terms screen). */
export async function setDemoAge(turns18: boolean) {
  const store = await cookies();
  const now = new Date();
  const birth = turns18
    ? `${now.getFullYear() - ADULT_AGE}-${String(now.getMonth() + 1).padStart(2, "0")}`
    : SAMPLE_TEEN.defaultBirth;
  store.set(BIRTH_COOKIE, birth, opts);
  store.delete(CONSENT_COOKIE);
  revalidatePath("/", "layout");
}
