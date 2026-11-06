"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Check, Clock, Flame, Heart, Lock, Shield, Zap, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { xpRewards } from "@/lib/engine/game";
import type { MedContent, MedIcon } from "@/lib/fixtures/meds";
import { PillArt } from "./pill-art";

const ICONS: Record<MedIcon, LucideIcon> = {
  shield: Shield,
  heart: Heart,
  check: Check,
  clock: Clock,
  bolt: Zap,
  flame: Flame,
};

type MedExplorerProps = {
  name: string;
  form: "capsule" | "tablet";
  color: string;
  content: MedContent;
};

/** The "why this medicine" explorer (Section 6.2): hero, journey, facts, XP. */
export function MedExplorer({ name, form, color, content }: MedExplorerProps) {
  const t = useTranslations("Meds");
  const tDis = useTranslations("Disclaimers");
  const [learned, setLearned] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/teen/meds" className="inline-flex min-h-11 items-center gap-2 self-start font-semibold text-primary">
        <ArrowLeft aria-hidden className="size-4" /> {t("back")}
      </Link>

      <header
        className="flex flex-col items-center gap-1 rounded-lg border bg-secondary px-5 py-7 text-center text-secondary-foreground"
      >
        <PillArt form={form} color={color} size={96} />
        <h1 className="mt-2 text-3xl">{content.nick}</h1>
        <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-75">{name}</p>
        <p className="mt-1 max-w-[28ch] text-lg opacity-95">{content.hook}</p>
      </header>

      <section aria-labelledby="why" className="flex flex-col gap-3">
        <h2 id="why" className="text-xl">{t("whyHeading")}</h2>
        <ol className="flex flex-col">
          {content.journey.map((step, i) => {
            const Icon = ICONS[step.icon];
            const last = i === content.journey.length - 1;
            return (
              <li key={step.title} className="relative flex gap-4 pb-4">
                {!last && <span aria-hidden className="absolute top-12 bottom-0 left-[22px] w-0.5 bg-border" />}
                <span className="z-10 grid size-11 shrink-0 place-items-center rounded-xl border bg-card text-primary">
                  <Icon aria-hidden className="size-5" />
                </span>
                <span className="flex flex-col pt-1">
                  <span className="text-base font-bold">{step.title}</span>
                  <span className="text-muted-foreground">{step.text}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="facts" className="flex flex-col gap-2">
        <h2 id="facts" className="text-xl">{t("goodToKnow")}</h2>
        {content.facts.map(([q, a]) => (
          <details key={q} className="group rounded-lg border bg-card px-4 py-3">
            <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-3 font-semibold">
              {q}
              <span aria-hidden className="text-xl text-muted-foreground transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-muted-foreground">{a}</p>
          </details>
        ))}
      </section>

      {learned ? (
        <p role="status" className="flex items-center gap-3 rounded-lg bg-accent p-4 font-semibold">
          <BadgeCheck aria-hidden className="size-6 text-primary" />
          {t("learnedDone")}
        </p>
      ) : (
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            setLearned(true);
            toast(t("learnedXp", { xp: xpRewards.medExplored, name: content.nick }), "xp");
          }}
        >
          {t("learned")}
        </Button>
      )}

      <p className="flex items-start gap-2 rounded-lg border bg-card p-3 text-sm text-muted-foreground">
        <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
        {tDis("medScreen")}
      </p>
    </div>
  );
}
