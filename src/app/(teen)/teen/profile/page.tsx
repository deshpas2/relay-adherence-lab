import { getLocale } from "next-intl/server";
import { PersonalSettings } from "@/components/personal/personal-settings";
import { getSampleProfile } from "@/lib/fixtures/personal";

// TODO(backend): the signed-in teen's saved preferences and learned pattern.
export default async function MePage() {
  const profile = getSampleProfile("me", await getLocale());
  if (!profile) return null;
  return <PersonalSettings profile={profile} />;
}
