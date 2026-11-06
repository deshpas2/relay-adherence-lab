import { LinkForm } from "@/components/auth/link-form";
import { ROLE_HOME } from "@/lib/routes";

// For parents. TODO(lane-be merge): pass action={redeemGuardianInvite}
export default function LinkPage() {
  return <LinkForm homeHref={ROLE_HOME.parent} />;
}
