"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Lightbulb, PencilLine, Rocket, Stethoscope } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ErrorBox, TextField } from "@/components/auth/fields";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { lintCopy } from "@/lib/content/lint";
import { buildExperimentDays } from "@/lib/engine/experiment";
import { cn } from "@/lib/utils";
import { ArmBadge } from "./arm-badge";
import type { Factor, IdeaTemplate } from "./types";

export type NewExperiment = {
  /** Set when the teen used a library idea. */
  ideaKey: string | null;
  factor: Factor;
  hypothesis: string;
  armA: string;
  armB: string;
};

/** Lane Backend: startExperiment, which writes experiments + 14 experiment_days. */
export type StartExperiment = (input: NewExperiment) => Promise<{ id: string }>;

const previewStart: StartExperiment = async () => {
  await new Promise((r) => setTimeout(r, 400));
  return { id: "exp-1" };
};

/**
 * Teen-typed text must stay about routine. Blocks dosing words and medicine
 * names using the same copy lint as the app's own text.
 */
export function isSafe(text: string, locale: string) {
  return !lintCopy(text, { locale: locale === "es" ? "es" : "en" }).some(
    (issue) => issue.rule === "dosing" || issue.rule === "medication",
  );
}

type DesignerProps = {
  /** Ideas matching the teen's barriers come first. */
  forYou: IdeaTemplate[];
  more: IdeaTemplate[];
  start?: StartExperiment;
  /** Opened from a care-team suggestion: start on this idea's plan. */
  suggested?: IdeaTemplate | null;
};

export function ExperimentDesigner({ forYou, more, start = previewStart, suggested = null }: DesignerProps) {
  const t = useTranslations("Experiments");
  const tIdea = useTranslations("ExperimentIdeas");
  const locale = useLocale();
  const [draft, setDraft] = useState<NewExperiment | null>(() =>
    suggested
      ? {
          ideaKey: suggested.key,
          factor: suggested.factor,
          hypothesis: tIdea(`${suggested.key}.hypothesis`),
          armA: tIdea(`${suggested.key}.armA`),
          armB: tIdea(`${suggested.key}.armB`),
        }
      : null,
  );
  const [writing, setWriting] = useState(false);
  const [own, setOwn] = useState({ armA: "", armB: "", hypothesis: "" });
  const [error, setError] = useState<string | null>(null);
  const [startedId, setStartedId] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const fromIdea = (idea: IdeaTemplate): NewExperiment => ({
    ideaKey: idea.key,
    factor: idea.factor,
    hypothesis: tIdea(`${idea.key}.hypothesis`),
    armA: tIdea(`${idea.key}.armA`),
    armB: tIdea(`${idea.key}.armB`),
  });

  function applyOwn() {
    const armA = own.armA.trim();
    const armB = own.armB.trim();
    const hypothesis = own.hypothesis.trim();
    if (!armA || !armB) return setError(t("fillBoth"));
    if (![armA, armB, hypothesis].every((s) => isSafe(s, locale))) return setError(t("unsafe"));
    setError(null);
    setDraft({ ideaKey: null, factor: "style", armA, armB, hypothesis: hypothesis || t("ownTitle") });
  }

  function launch() {
    if (!draft) return;
    startTransition(async () => {
      const { id } = await start(draft);
      setStartedId(id);
    });
  }

  // 3. Started
  if (startedId) {
    return (
      <div role="status" className="flex flex-col items-center gap-4 py-6 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-accent text-primary">
          <Rocket aria-hidden className="size-10" />
        </span>
        <h1 className="text-3xl">{t("started")}</h1>
        <p className="text-lg">{t("startedBody")}</p>
        <Link href={`/teen/experiments/${startedId}`} className={buttonVariants({ size: "lg", className: "w-full" })}>
          {t("seeTest")}
        </Link>
      </div>
    );
  }

  // 2. Review the plan
  if (draft) {
    const title = draft.ideaKey ? tIdea(`${draft.ideaKey}.title`) : t("ownTitle");
    return (
      <div className="flex flex-col gap-6">
        <Button variant="ghost" className="self-start" onClick={() => setDraft(null)}>
          <ArrowLeft aria-hidden /> {t("moreIdeas")}
        </Button>
        <div>
          <h1 className="text-3xl">{t("reviewTitle")}</h1>
          <p className="text-muted-foreground">{t("reviewBody")}</p>
        </div>
        <Card className="flex flex-col gap-4">
          {suggested && draft.ideaKey === suggested.key && (
            <span className="inline-flex items-center gap-2 self-start rounded-full bg-blue-soft px-3 py-1 text-sm font-bold text-blue">
              <Stethoscope aria-hidden className="size-4" /> {t("suggestedBanner")}
            </span>
          )}
          <h2 className="text-2xl">{title}</h2>
          <p>{draft.hypothesis}</p>
          {(["A", "B"] as const).map((arm) => (
            <div key={arm} className="flex items-center gap-3 rounded-lg bg-muted p-3">
              <ArmBadge arm={arm} />
              <span className="flex flex-col">
                <span className="text-sm text-muted-foreground">
                  {arm === "A" ? t("optionAHint") : t("optionBHint")}
                </span>
                <span className="font-semibold">{arm === "A" ? draft.armA : draft.armB}</span>
              </span>
            </div>
          ))}
          <ol className="grid grid-cols-7 gap-1.5" aria-label={t("calendar")}>
            {buildExperimentDays(14).map((d) => (
              <li
                key={d.day_index}
                className={cn(
                  "grid aspect-square place-items-center rounded-lg text-sm font-bold",
                  d.arm === "A" ? "bg-secondary text-secondary-foreground" : "bg-xp text-xp-foreground",
                )}
              >
                {d.arm}
              </li>
            ))}
          </ol>
        </Card>
        <Button size="lg" className="w-full" onClick={launch} disabled={busy}>
          {busy ? t("saving") : t("startTest")}
        </Button>
      </div>
    );
  }

  // 1. Pick an idea
  const ideaList = (ideas: IdeaTemplate[]) => (
    <ul className="flex flex-col gap-3">
      {ideas.map((idea) => (
        <li key={idea.key}>
          <button
            type="button"
            onClick={() => setDraft(fromIdea(idea))}
            className="flex w-full flex-col gap-2 rounded-lg border-2 bg-card p-4 text-left transition-colors hover:border-primary hover:bg-muted"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-lg font-semibold">{tIdea(`${idea.key}.title`)}</span>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                {t(`factor_${idea.factor}`)}
              </span>
            </span>
            <span className="text-muted-foreground">{tIdea(`${idea.key}.hypothesis`)}</span>
            <span className="flex flex-wrap items-center gap-2 text-sm">
              <ArmBadge arm="A" className="size-6 text-xs" /> {tIdea(`${idea.key}.armA`)}
              <span aria-hidden className="text-muted-foreground">·</span>
              <ArmBadge arm="B" className="size-6 text-xs" /> {tIdea(`${idea.key}.armB`)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl">{t("designerTitle")}</h1>
        <p className="text-muted-foreground">{t("designerBody")}</p>
      </div>

      {forYou.length > 0 && (
        <section aria-labelledby="for-you" className="flex flex-col gap-3">
          <h2 id="for-you" className="flex items-center gap-2 text-xl">
            <Lightbulb aria-hidden className="size-5 text-primary" /> {t("forYou")}
          </h2>
          {ideaList(forYou)}
        </section>
      )}

      <section aria-labelledby="more" className="flex flex-col gap-3">
        <h2 id="more" className="text-xl">{t("moreIdeas")}</h2>
        {ideaList(more)}
      </section>

      <section className="flex flex-col gap-3">
        {!writing ? (
          <Button variant="outline" size="lg" className="w-full" onClick={() => setWriting(true)}>
            <PencilLine aria-hidden /> {t("ownIdea")}
          </Button>
        ) : (
          <Card className="flex flex-col gap-4">
            <h2 className="text-xl">{t("ownIdea")}</h2>
            <p className="text-sm text-muted-foreground">{t("ownHint")}</p>
            <TextField
              label={`A · ${t("ownA")}`}
              value={own.armA}
              maxLength={80}
              onChange={(e) => setOwn({ ...own, armA: e.target.value })}
            />
            <TextField
              label={`B · ${t("ownB")}`}
              value={own.armB}
              maxLength={80}
              onChange={(e) => setOwn({ ...own, armB: e.target.value })}
            />
            <TextField
              label={t("ownHypothesis")}
              value={own.hypothesis}
              maxLength={140}
              onChange={(e) => setOwn({ ...own, hypothesis: e.target.value })}
            />
            {error && <ErrorBox message={error} />}
            <Button size="lg" className="w-full" onClick={applyOwn}>
              {t("useIdea")}
            </Button>
          </Card>
        )}
      </section>
    </div>
  );
}
