import Link from "next/link";
import { Lock } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { PillArt } from "@/components/meds/pill-art";
import { sampleMeds } from "@/lib/fixtures/meds";
import { xpRewards } from "@/lib/engine/game";

// TODO(backend): the teen's meds from patient_medications + medication_content.
export default async function MedsPage() {
  const t = await getTranslations("Meds");
  const tDis = await getTranslations("Disclaimers");
  const locale = (await getLocale()) === "es" ? "es" : "en";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("intro")}</p>
      </div>
      <ul className="grid grid-cols-2 gap-3">
        {sampleMeds.map((med) => (
          <li key={med.slug}>
            <Link
              href={`/teen/meds/${med.slug}`}
              className="relative flex h-full flex-col gap-1 rounded-lg border bg-card p-4 transition-colors hover:bg-muted"
            >
              <span className="absolute top-3 right-3 rounded-md bg-accent px-2 py-0.5 text-xs font-bold text-primary">
                {t("xpBadge", { xp: xpRewards.medExplored })}
              </span>
              <span className="grid h-20 place-items-center">
                <PillArt form={med.form} color={med.color} size={58} />
              </span>
              <span className="text-base font-bold">{med.content[locale].nick}</span>
              <span className="text-sm text-muted-foreground">{med.name}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="flex items-start gap-2 rounded-lg border bg-card p-3 text-sm text-muted-foreground">
        <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
        {tDis("medScreen")}
      </p>
    </div>
  );
}
