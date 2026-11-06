import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { ProgressRing } from "@/components/game/progress-ring";
import type { QuestSummary } from "./types";

/** The teen's active experiment, as a quest card on the home screen. */
export function QuestTeaser({ quest }: { quest: QuestSummary }) {
  const t = useTranslations("TeenHome");
  return (
    <section aria-labelledby="quest" className="flex flex-col gap-3">
      <h2 id="quest" className="text-xl">{t("questHeading")}</h2>
      <Link
        href="/teen/experiments"
        className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:bg-muted"
      >
        <ProgressRing value={quest.day / quest.days} size={64} label={t("questDay", { day: quest.day, days: quest.days })}>
          <span className="text-sm font-semibold">
            {quest.day}/{quest.days}
          </span>
        </ProgressRing>
        <span className="flex flex-1 flex-col">
          <span className="font-heading text-lg font-semibold">{quest.title}</span>
          <span className="text-sm text-muted-foreground">{t("questDay", { day: quest.day, days: quest.days })}</span>
        </span>
        <ChevronRight aria-hidden className="size-5 text-muted-foreground" />
      </Link>
    </section>
  );
}
