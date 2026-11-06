"use client";

import { Check, RotateCcw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import type { Arm, ExperimentDecision } from "./types";

type DecisionPanelProps = {
  /** The engine's winner. With no clear winner, "keep" isn't offered. */
  winner: Arm | null;
  decision: ExperimentDecision | null;
  busy: boolean;
  onDecide: (decision: ExperimentDecision) => void;
};

/** After 14 days: keep the winner, run it again, or drop it. */
export function DecisionPanel({ winner, decision, busy, onDecide }: DecisionPanelProps) {
  const t = useTranslations("Experiments");

  if (decision) {
    return (
      <Card role="status" className="bg-accent text-center font-heading text-xl font-semibold">
        {t(`decided_${decision}`, { arm: winner ?? "B" })}
      </Card>
    );
  }

  const options = [
    ...(winner
      ? [{ key: "adopted" as const, icon: Check, label: t("adopt", { arm: winner }), hint: t("adoptHint") }]
      : []),
    { key: "rerun" as const, icon: RotateCcw, label: t("rerun"), hint: t("rerunHint") },
    { key: "dropped" as const, icon: X, label: t("drop"), hint: t("dropHint") },
  ];

  return (
    <Card className="flex flex-col gap-4 border-2 border-primary/30">
      <div>
        <h2 className="text-2xl">{t("decisionTitle")}</h2>
        <p className="text-muted-foreground">{t("decisionBody")}</p>
      </div>
      <div className="flex flex-col gap-2">
        {options.map(({ key, icon: Icon, label, hint }, i) => (
          <button
            key={key}
            type="button"
            disabled={busy}
            onClick={() => onDecide(key)}
            className={
              i === 0
                ? "flex min-h-14 items-center gap-3 rounded-2xl bg-primary px-4 py-3 text-left text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                : "flex min-h-14 items-center gap-3 rounded-2xl border-2 bg-card px-4 py-3 text-left transition-colors hover:bg-muted disabled:opacity-50"
            }
          >
            <Icon aria-hidden className="size-5 shrink-0" />
            <span className="flex flex-col">
              <span className="font-semibold">{label}</span>
              <span className="text-sm opacity-80">{hint}</span>
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}
