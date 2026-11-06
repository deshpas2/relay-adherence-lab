import { Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ProgressRing } from "@/components/game/progress-ring";
import { ConfirmList } from "@/components/parent/confirm-list";
import { sampleFamily } from "@/lib/fixtures/parent";
import { ParentPrivate } from "@/components/sharing/parent-private";
import { caregiverCanSee } from "@/lib/engine/consent";
import { getTeenSharing } from "@/lib/sharing/state";

// TODO(backend): the linked teen, their share_level, and doses awaiting confirmation.
export default async function ParentHomePage() {
  const t = await getTranslations("Parent");
  const f = sampleFamily;
  const pct = Math.round(f.onTimeRate * 100);
  const sharing = await getTeenSharing();
  // At 18+, nothing is shown unless the patient chose to share.
  if (!caregiverCanSee(sharing.mode)) return <ParentPrivate name={f.teenName} mode={sharing.mode} />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl">{t("title", { name: f.teenName })}</h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle", { name: f.teenName })}</p>
      </div>

      <section className="flex items-center gap-5 rounded-3xl border bg-card p-5">
        <ProgressRing value={f.onTimeRate} size={96} label={t("onTimeLabel", { pct })}>
          <span className="flex flex-col items-center leading-none">
            <span className="font-heading text-2xl font-bold">{pct}%</span>
            <span className="mt-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{t("onTime")}</span>
          </span>
        </ProgressRing>
        <div className="flex flex-col gap-1">
          <p className="font-heading text-lg font-bold">{t("last14", { taken: f.takenLast14, total: f.totalLast14 })}</p>
          <p className="text-sm text-muted-foreground">
            {t(sharing.mode === "minor_shared" ? "sharedMinor" : "sharedAdult", { name: f.teenName })}
          </p>
        </div>
      </section>

      <section aria-labelledby="confirm" className="flex flex-col gap-3">
        <div>
          <h2 id="confirm" className="text-xl">{t("confirmTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("confirmBody", { name: f.teenName })}</p>
        </div>
        <ConfirmList teenName={f.teenName} doses={[...f.doses]} />
      </section>

      <p className="flex items-start gap-2 rounded-2xl border bg-card p-3 text-sm text-muted-foreground">
        <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
        {t("safety", { name: f.teenName })}
      </p>
      <p className="text-center text-xs text-muted-foreground">{t("sampleData")}</p>
    </div>
  );
}
