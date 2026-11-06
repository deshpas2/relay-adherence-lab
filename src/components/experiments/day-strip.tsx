"use client";

import { Check, Clock, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ExperimentDayRow } from "./types";

/** The 14-day calendar: arm letter + how each logged day went. */
export function DayStrip({ days, today }: { days: ExperimentDayRow[]; today: number }) {
  const t = useTranslations("Experiments");

  return (
    <section aria-labelledby="calendar" className="flex flex-col gap-3">
      <h2 id="calendar" className="text-xl">{t("calendar")}</h2>
      <ol className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const isToday = day.dayIndex === today && day.status === null;
          const status = day.status
            ? t(`status_${day.status}`)
            : isToday
              ? t("status_today")
              : t("status_none");
          const Icon =
            day.status === "taken" ? Check : day.status === "late" ? Clock : day.status ? Minus : null;
          return (
            <li
              key={day.dayIndex}
              aria-label={t("dayCell", { day: day.dayIndex, arm: day.arm, status })}
              aria-current={isToday ? "date" : undefined}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-xl border text-xs",
                day.status === "taken" && "border-success/40 bg-success-soft",
                day.status && day.status !== "taken" && "bg-muted",
                !day.status && "bg-card",
                isToday && "border-2 border-primary",
              )}
            >
              <span className="text-sm font-bold" aria-hidden>
                {day.arm}
              </span>
              <span aria-hidden className="grid h-4 place-items-center">
                {Icon ? (
                  <Icon className={cn("size-3.5", day.status === "taken" ? "text-success" : "text-muted-foreground")} />
                ) : (
                  <span className="text-muted-foreground">{day.dayIndex}</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
