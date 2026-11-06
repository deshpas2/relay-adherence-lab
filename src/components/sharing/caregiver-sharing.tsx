"use client";

import { useId, useState, useTransition } from "react";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import type { SharingMode } from "@/lib/engine/consent";
import { setCaregiverSharing } from "@/lib/sharing/actions";

/** Me tab: who can see the teen's data. Locked on under 18; the adult's choice after. */
export function CaregiverSharing({
  mode,
  caregiver,
  adultMonth,
}: {
  mode: SharingMode;
  caregiver: string;
  /** Formatted month the teen turns 18, e.g. "March 2027". */
  adultMonth: string;
}) {
  const t = useTranslations("Adult");
  const [share, setShare] = useState(mode === "adult_shared");
  const [pending, startTransition] = useTransition();
  const id = useId();

  return (
    <section aria-labelledby="sharing" className="flex flex-col gap-3">
      <h2 id="sharing" className="text-xl">{t("sharingHeading")}</h2>
      {mode === "minor_shared" ? (
        <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
          <Lock aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="font-semibold">{t("minorLocked", { caregiver })}</p>
            <p className="text-sm text-muted-foreground">{t("minorWhen", { month: adultMonth })}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
          <label htmlFor={id} className="flex flex-1 cursor-pointer flex-col">
            <span className="font-semibold">{t("shareLabel", { caregiver })}</span>
            <span className="text-sm text-muted-foreground">
              {share ? t("shareOn", { caregiver }) : t("shareOff", { caregiver })}
            </span>
          </label>
          <Switch
            id={id}
            checked={share}
            disabled={pending}
            onCheckedChange={(v) => {
              setShare(v);
              startTransition(async () => {
                await setCaregiverSharing(v);
                toast(t("saved"));
              });
            }}
          />
        </div>
      )}
    </section>
  );
}
