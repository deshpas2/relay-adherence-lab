import { OnboardingWizard } from "@/components/onboarding/wizard";
import { sampleTeenHome } from "@/lib/fixtures/teen-home";
import { ROLE_HOME } from "@/lib/routes";

// TODO(lane-db/lane-be): load the teen's real schedule from patient_medications
// and pass save={saveOnboarding}.
export default function OnboardingPage() {
  const schedule = sampleTeenHome.slots.map(({ id, label, time }) => ({ id, label, time }));
  return <OnboardingWizard schedule={schedule} homeHref={ROLE_HOME.teen} />;
}
