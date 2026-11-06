"use client";

import { Check, Circle, Minus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatClock } from "@/lib/format-clock";
import type { DoseSlot } from "./types";

/** Today's schedule at a glance. Missed doses look neutral, never red. */
export function TodayList({ slots }: { slots: DoseSlot[] }) {
  const t = useTranslations("TeenHome");
  const locale = useLocale();

  return (
    <section aria-labelledby="today" className="flex flex-col gap-3">
      <h2 id="today" className="text-xl">{t("today")}</h2>
      <ol className="flex flex-col divide-y rounded-2xl border bg-card">
        {slots.map((slot) => {
          const done = slot.status === "taken" || slot.status === "late";
          const missed = slot.status === "missed";
          return (
            <li key={slot.id} className="flex items-center gap-3 p-4">
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full",
                  done ? "bg-success-soft text-success" : "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check aria-hidden className="size-5" /> : missed ? <Minus aria-hidden className="size-5" /> : <Circle aria-hidden className="size-4" />}
              </span>
              <span className="flex flex-1 flex-col">
                <span className="font-medium">{t(`slot_${slot.label}`)}</span>
                <span className="text-sm text-muted-foreground">
                  {slot.meds.map((m) => m.name).join(" · ")}
                </span>
              </span>
              <span className="text-right text-sm">
                <span className="block font-medium">{formatClock(slot.time, locale)}</span>
                <span className="block text-muted-foreground">
                  {done
                    ? t("statusDone", { time: formatClock(slot.loggedAt ?? slot.time, locale) })
                    : missed
                      ? t("statusMissed")
                      : t("statusLater")}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
