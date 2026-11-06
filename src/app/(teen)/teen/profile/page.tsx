import { getFormatter, getLocale } from "next-intl/server";
import { PersonalSettings } from "@/components/personal/personal-settings";
import { CaregiverSharing } from "@/components/sharing/caregiver-sharing";
import { adultMonth } from "@/lib/engine/consent";
import { getSampleProfile } from "@/lib/fixtures/personal";
import { getTeenSharing } from "@/lib/sharing/state";

// TODO(backend): the signed-in teen's saved preferences and learned pattern.
export default async function MePage() {
  const [locale, format, sharing] = await Promise.all([getLocale(), getFormatter(), getTeenSharing()]);
  const profile = getSampleProfile("me", locale);
  if (!profile) return null;
  const [y, m] = (adultMonth(sharing.birth) ?? "2027-03").split("-").map(Number);
  const month = format.dateTime(new Date(y, m - 1, 1), { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-8">
      <PersonalSettings profile={profile} />
      <CaregiverSharing mode={sharing.mode} caregiver={sharing.caregiver} adultMonth={month} />
    </div>
  );
}
