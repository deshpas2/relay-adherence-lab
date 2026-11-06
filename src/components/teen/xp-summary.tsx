"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { LevelBadge } from "@/components/game/level-badge";
import { XPBar } from "@/components/game/xp-bar";
import { levelProgress } from "./level";

export function XPSummary({ xp }: { xp: number }) {
  const t = useTranslations("TeenHome");
  const { level, xpIntoLevel, xpToNext, levelSize } = levelProgress(xp);

  return (
    <Card className="flex items-center gap-4">
      <LevelBadge level={level} label={t("level")} />
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2 text-sm font-medium">
          <span>{t("xpTotal", { xp })}</span>
          <span className="text-muted-foreground">{t("xpToNext", { xp: xpToNext, level: level + 1 })}</span>
        </div>
        <XPBar
          current={xpIntoLevel}
          goal={levelSize}
          label={t("xpBarLabel", { current: xpIntoLevel, goal: levelSize, level: level + 1 })}
        />
      </div>
    </Card>
  );
}
