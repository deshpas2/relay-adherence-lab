"use client";

import { useTransition } from "react";
import { Cake } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import type { SharingMode } from "@/lib/engine/consent";
import { setDemoAge } from "@/lib/sharing/actions";

/** DEMO: switch the sample teen between 17 and 18 to show the consent flow. */
export function BirthdayDemo({ age, mode }: { age: number; mode: SharingMode }) {
  const t = useTranslations("Adult");
  const [pending, startTransition] = useTransition();

  function set(turns18: boolean) {
    startTransition(async () => {
      await setDemoAge(turns18);
      toast(turns18 ? t("demoNow18") : t("demoNow17"));
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-accent text-primary">
          <Cake aria-hidden className="size-5" />
        </span>
        <div>
          <h2 className="text-lg">{t("demoTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("demoState", { age, state: t(`mode_${mode}`) })}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{t("demoBody")}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant={age < 18 ? "default" : "outline"} onClick={() => set(false)} disabled={pending}>
          {t("demo17")}
        </Button>
        <Button variant={age >= 18 ? "default" : "outline"} onClick={() => set(true)} disabled={pending}>
          {t("demo18")}
        </Button>
      </div>
    </section>
  );
}
