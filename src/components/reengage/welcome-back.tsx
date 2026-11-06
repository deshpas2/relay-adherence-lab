"use client";

import { useState } from "react";
import { HeartHandshake } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { TeenMessage } from "./teen-message";

/**
 * Shown when a teen opens Relay after going quiet. No guilt: nothing is lost,
 * and the ladder resets as soon as they're back.
 * TODO(backend): opening the app records activity, which resets daysQuiet.
 */
export function WelcomeBack({ name, nurse, daysQuiet }: { name: string; nurse: string; daysQuiet: number }) {
  const t = useTranslations("Reengage");
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <section aria-labelledby="welcome-back" className="flex flex-col gap-4 rounded-3xl border-2 border-primary/40 bg-accent p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <HeartHandshake aria-hidden className="size-6" />
        </span>
        <div>
          <h2 id="welcome-back" className="text-2xl">{t("welcome_title", { name })}</h2>
          <p className="mt-1">{t("welcome_body")}</p>
        </div>
      </div>
      {daysQuiet >= 10 && <TeenMessage channel="nurse_voice" name={name} nurse={nurse} />}
      <Button size="lg" className="w-full" onClick={() => setOpen(false)}>
        {t("welcome_cta")}
      </Button>
    </section>
  );
}
