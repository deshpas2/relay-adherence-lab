"use client";

import { useState, useTransition } from "react";
import { CalendarCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { ProgressRing } from "@/components/game/progress-ring";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { computeResult, experimentMilestone } from "@/lib/engine/experiment";
import { xpRewards } from "@/lib/engine/game";
import { Confetti } from "@/components/game/confetti";
import { sendReminder } from "@/lib/push/client";
import { DayStrip } from "./day-strip";
import { DecisionPanel } from "./decision-panel";
import { LogDayCard } from "./log-day-card";
import { ResultReadout } from "./result-readout";
import type { DoseStatus, ExperimentDecision, ExperimentView as Experiment } from "./types";

/**
 * Lane Backend: logExperimentDay and adoptResult. XP and pop-ups are worked out
 * on the server in the same action (Section 6.5); the UI only shows them.
 */
export type ExperimentActions = {
  logDay: (experimentId: string, dayIndex: number, status: DoseStatus, ease: number) => Promise<{ xpGained: number }>;
  decide: (experimentId: string, decision: ExperimentDecision) => Promise<{ xpGained: number }>;
};

/** PREVIEW ONLY: pretends to save until the real actions are passed in. */
const previewActions: ExperimentActions = {
  logDay: async () => {
    await new Promise((r) => setTimeout(r, 300));
    return { xpGained: xpRewards.experimentDay };
  },
  decide: async (_id, decision) => {
    await new Promise((r) => setTimeout(r, 300));
    return { xpGained: decision === "adopted" ? xpRewards.findingAdopted : 0 };
  },
};

export function ExperimentRunView({
  experiment,
  actions = previewActions,
  preview = false,
  celebrate = false,
}: {
  experiment: Experiment;
  actions?: ExperimentActions;
  /** Shows a button to jump to the next day, for demos. */
  preview?: boolean;
  /** Opened from the "test is done" notification: celebrate on arrival. */
  celebrate?: boolean;
}) {
  const t = useTranslations("Experiments");
  const tNote = useTranslations("Notifications");
  const [days, setDays] = useState(experiment.days);
  const [today, setToday] = useState(experiment.today);
  const [decision, setDecision] = useState(experiment.decision);
  const [busy, startTransition] = useTransition();
  const [party, setParty] = useState(celebrate);

  const total = days.length;
  const logged = days.filter((d) => d.status !== null).length;
  const todayRow = days.find((d) => d.dayIndex === today);
  const loggedToday = todayRow?.status != null;
  const finished = logged === total || experiment.status === "done";
  const tomorrow = days.find((d) => d.dayIndex === today + 1);
  const { winner } = computeResult(days);

  function saveDay(status: DoseStatus, ease: number) {
    if (!todayRow) return;
    startTransition(async () => {
      const { xpGained } = await actions.logDay(experiment.id, todayRow.dayIndex, status, ease);
      setDays((all) => all.map((d) => (d.dayIndex === todayRow.dayIndex ? { ...d, status, ease } : d)));
      if (xpGained) toast(t("dayXp", { xp: xpGained }), "xp");

      const milestone = experimentMilestone(logged, logged + 1, total);
      if (milestone) toast(`${tNote(`${milestone}_title`)} ${tNote(`${milestone}_body`)}`, "info");
      if (milestone === "complete") {
        setParty(true);
        // Also lets the phone know, so the result is one tap away later.
        // TODO(backend): the server sends this in logExperimentDay instead.
        sendReminder({ teen: "me", type: "complete" }).catch(() => {});
      }
    });
  }

  function decide(choice: ExperimentDecision) {
    startTransition(async () => {
      const { xpGained } = await actions.decide(experiment.id, choice);
      setDecision(choice);
      if (xpGained) toast(t("adoptXp", { xp: xpGained }), "xp");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {party && <Confetti />}
      {party && (
        <div role="status" className="rounded-xl bg-accent p-5 text-center">
          <p className="text-2xl font-bold">{t("celebrateTitle")}</p>
          <p className="text-muted-foreground">{t("celebrateBody")}</p>
        </div>
      )}
      <header className="flex items-center gap-4">
        <ProgressRing value={logged / total} size={84} label={t("daysLogged", { n: logged, total })}>
          <span className="text-lg font-semibold">
            {logged}/{total}
          </span>
        </ProgressRing>
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            {t(`factor_${experiment.factor}`)}
          </span>
          <h1 className="text-3xl leading-tight">{experiment.title}</h1>
          <p className="text-muted-foreground">{experiment.hypothesis}</p>
        </div>
      </header>

      {finished ? (
        <DecisionPanel winner={winner} decision={decision} busy={busy} onDecide={decide} />
      ) : loggedToday || !todayRow ? (
        <Card role="status" className="flex flex-col items-center gap-2 py-6 text-center">
          <CalendarCheck aria-hidden className="size-10 text-primary" />
          <p className="text-xl font-semibold">{t("savedTitle")}</p>
          {tomorrow && <p className="text-muted-foreground">{t("savedNext", { arm: tomorrow.arm })}</p>}
          {preview && tomorrow && (
            <Button variant="outline" size="sm" onClick={() => setToday(today + 1)}>
              {t("previewNextDay")}
            </Button>
          )}
        </Card>
      ) : (
        <LogDayCard
          key={today}
          arm={todayRow.arm}
          armText={todayRow.arm === "A" ? experiment.armA : experiment.armB}
          busy={busy}
          onSave={saveDay}
        />
      )}

      <ResultReadout days={days} armA={experiment.armA} armB={experiment.armB} />
      <DayStrip days={days} today={today} />
    </div>
  );
}
