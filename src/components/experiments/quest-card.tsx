import { CheckCircle2, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { XPBar } from "@/components/game/xp-bar";
import { cn } from "@/lib/utils";
import type { QuestView } from "./types";

/** One quest with its XP reward and progress. Progress only ever goes up. */
export function QuestCard({ quest }: { quest: QuestView }) {
  const t = useTranslations("Experiments");
  const done = quest.status === "complete";
  const pct = Math.round(quest.progress * 100);

  return (
    <li className={cn("flex items-center gap-4 rounded-lg border bg-card p-4", done && "bg-success-soft/60")}>
      <span
        aria-hidden
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-xl",
          done ? "bg-success text-background" : "bg-secondary text-secondary-foreground",
        )}
      >
        {done ? <CheckCircle2 className="size-6" /> : <Star className="size-6" />}
      </span>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-lg font-semibold">{quest.title}</span>
          <span className="shrink-0 text-sm font-semibold text-muted-foreground">
            {done ? t("questDone") : t("xpReward", { xp: quest.xpReward })}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">{quest.description}</span>
        {!done && <XPBar current={pct} goal={100} label={`${quest.title}: ${pct}%`} className="h-2.5" />}
      </div>
    </li>
  );
}
