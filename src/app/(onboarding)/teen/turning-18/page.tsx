import { redirect } from "next/navigation";
import { AdultConsentForm } from "@/components/sharing/adult-consent-form";
import { getTeenSharing } from "@/lib/sharing/state";

// Comes up the first time a patient opens Relay at 18 or older.
export default async function TurningEighteenPage() {
  const s = await getTeenSharing();
  if (s.mode !== "adult_needs_consent") redirect("/teen/home");
  return <AdultConsentForm name={s.name} caregiver={s.caregiver} />;
}
