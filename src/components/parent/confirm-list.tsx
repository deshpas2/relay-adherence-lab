"use client";

import { useState } from "react";
import { BadgeCheck, Pill } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { formatClock } from "@/lib/format-clock";
import { cn } from "@/lib/utils";

type Dose = { id: string; slot: "morning" | "evening"; time: string; loggedAt: string; day: "today" | "yesterday" };

/**
 * Doses the teen logged, waiting for a parent to confirm (Section 6.3).
 * TODO(backend): confirmDose writes parent_confirmations + dose_logs.verified,
 * and Realtime adds new doses here live.
 */
export function ConfirmList({ teenName, doses }: { teenName: string; doses: Dose[] }) {
  const t = useTranslations("Parent");
  const locale = useLocale();
  const [confirmed, setConfirmed] = useState<string[]>([]);

  return (
    <ul className="flex flex-col gap-2.5">
      {doses.map((d) => {
        const done = confirmed.includes(d.id);
        return (
          <li key={d.id} className={cn("flex items-center gap-3 rounded-2xl border bg-card p-4", done && "opacity-70")}>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border bg-muted text-primary">
              <Pill aria-hidden className="size-5" />
            </span>
            <span className="flex flex-1 flex-col">
              <span className="font-semibold">{t(`dose_${d.slot}`)} · {t(`day_${d.day}`)}</span>
              <span className="text-sm text-muted-foreground">
                {t("loggedAt", { name: teenName, time: formatClock(d.loggedAt, locale) })}
              </span>
            </span>
            {done ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1 text-sm font-bold text-primary">
                <BadgeCheck aria-hidden className="size-4" /> {t("confirmed")}
              </span>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  setConfirmed((c) => [...c, d.id]);
                  toast(t("confirmToast", { name: teenName }));
                }}
              >
                {t("sawIt")}
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
