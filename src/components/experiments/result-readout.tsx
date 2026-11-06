"use client";

import { Info, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { computeResult } from "@/lib/engine/experiment";
import { cn } from "@/lib/utils";
import { ArmBadge } from "./arm-badge";
import type { Arm, ExperimentDayRow } from "./types";

type ResultReadoutProps = {
  days: ExperimentDayRow[];
  armA: string;
  armB: string;
};

/**
 * The honest result (Section 6.4): per-option on-time rate and ease, the
 * engine's verdict, and the small-sample caveat. Names a winner only when
 * the engine does.
 */
export function ResultReadout({ days, armA, armB }: ResultReadoutProps) {
  const t = useTranslations("Experiments");
  const tVerdict = useTranslations("ExperimentVerdict");
  const result = computeResult(days);
  const logged = days.filter((d) => d.status !== null).length;

  const rows: { arm: Arm; text: string; adh: number | null; ease: number | null }[] = [
    { arm: "A", text: armA, adh: result.aAdh, ease: result.aEase },
    { arm: "B", text: armB, adh: result.bAdh, ease: result.bEase },
  ];

  return (
    <section aria-labelledby="result" className="flex flex-col gap-3">
      <h2 id="result" className="text-xl">{t("resultHeading")}</h2>
      <Card className="flex flex-col gap-5">
        <p aria-live="polite" className="text-xl font-semibold">
          {tVerdict(result.verdict)}
        </p>

        <ul className="flex flex-col gap-4">
          {rows.map((row) => {
            const winner = result.winner === row.arm;
            const pct = row.adh === null ? null : Math.round(row.adh * 100);
            return (
              <li key={row.arm} className={cn("flex flex-col gap-2 rounded-lg p-3", winner && "bg-accent")}>
                <div className="flex items-center gap-3">
                  <ArmBadge arm={row.arm} />
                  <span className="flex-1 font-medium">{row.text}</span>
                  {winner && (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold">
                      <Trophy aria-hidden className="size-4" /> {t("ahead")}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 text-sm">
                  <span className="text-muted-foreground">{t("onTime")}</span>
                  <div className="h-3 overflow-hidden rounded-full bg-xp-track" aria-hidden>
                    <div
                      className={cn("h-full rounded-full", row.arm === "A" ? "bg-primary/60" : "bg-primary")}
                      style={{ width: `${pct ?? 0}%` }}
                    />
                  </div>
                  <span className="w-16 text-right font-semibold">{pct === null ? t("noData") : `${pct}%`}</span>
                  <span className="text-muted-foreground">{t("ease")}</span>
                  <span />
                  <span className="w-16 text-right font-semibold">
                    {row.ease === null ? "–" : t("easeAvg", { n: row.ease.toFixed(1) })}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <p>{t("daysLogged", { n: logged, total: days.length })}</p>
          <p className="flex items-start gap-1.5">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
            {tVerdict("caveat")}
          </p>
        </div>
      </Card>
    </section>
  );
}
