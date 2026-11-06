import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { ProgressRing } from "@/components/game/progress-ring";
import { ArmBadge } from "./arm-badge";
import type { ExperimentView } from "./types";

/** The active test, as a card linking to its page. */
export function ExperimentCard({ experiment }: { experiment: ExperimentView }) {
  const t = useTranslations("Experiments");
  const logged = experiment.days.filter((d) => d.status !== null).length;
  const total = experiment.days.length;
  const todayArm = experiment.days.find((d) => d.dayIndex === experiment.today)?.arm ?? "A";

  return (
    <Link
      href={`/teen/experiments/${experiment.id}`}
      className="flex items-center gap-4 rounded-xl border-2 border-primary/30 bg-card p-5 transition-colors hover:bg-muted"
    >
      <ProgressRing value={logged / total} size={72} label={t("daysLogged", { n: logged, total })}>
        <span className="text-sm font-semibold">
          {logged}/{total}
        </span>
      </ProgressRing>
      <span className="flex flex-1 flex-col gap-1">
        <span className="text-xl font-semibold">{experiment.title}</span>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArmBadge arm={todayArm} className="size-6 text-xs" />
          {t("todayOption", { arm: todayArm })}
        </span>
      </span>
      <ChevronRight aria-hidden className="size-5 text-muted-foreground" />
    </Link>
  );
}
