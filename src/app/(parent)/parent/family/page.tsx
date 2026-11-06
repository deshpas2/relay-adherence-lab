import { Link2, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { CaregiverCheckin } from "@/components/parent/caregiver-checkin";
import { sampleFamily } from "@/lib/fixtures/parent";

// TODO(backend): link status from guardian_links; save the check-in for the care team.
export default async function FamilyPage() {
  const t = await getTranslations("Parent");
  const f = sampleFamily;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl">{t("familyTitle")}</h1>

      <section className="flex flex-col items-center gap-1 rounded-3xl border bg-card p-5 text-center">
        <Link2 aria-hidden className="size-6 text-primary" />
        <p className="text-sm text-muted-foreground">{t("linkedTo", { name: f.teenName })}</p>
        <p className="font-heading text-2xl font-bold tracking-[0.14em] text-primary">{f.inviteCode}</p>
        <p className="text-sm text-muted-foreground">{t(`share_${f.shareLevel}`, { name: f.teenName })}</p>
      </section>

      <section aria-labelledby="checkin" className="flex flex-col gap-3">
        <div>
          <h2 id="checkin" className="text-xl">{t("checkinTitle", { name: f.teenName })}</h2>
          <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
            <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            {t("checkinBody", { name: f.teenName })}
          </p>
        </div>
        <CaregiverCheckin teenName={f.teenName} keys={f.barrierKeys} />
      </section>
      <p className="text-center text-xs text-muted-foreground">{t("sampleData")}</p>
    </div>
  );
}
