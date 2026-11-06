"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { NAV_ITEMS } from "@/components/shell/nav-items";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TABS = NAV_ITEMS.teen;

/**
 * A short walkthrough of the four tabs: a mini tab bar with a speech bubble
 * pointing at one tab at a time.
 */
export function TourStep({ onDone }: { onDone: () => void }) {
  const t = useTranslations("Onboarding");
  const tNav = useTranslations("Nav");
  const [index, setIndex] = useState(0);
  const tab = TABS[index];
  const last = index === TABS.length - 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-secondary p-5">
        {/* speech bubble */}
        <div aria-live="polite" className="w-full rounded-2xl bg-card p-4 text-center shadow-sm">
          <p className="font-heading text-xl font-semibold">{tNav(tab.labelKey)}</p>
          <p className="mt-1">{t(`tour_${tab.labelKey}`)}</p>
        </div>

        {/* mini tab bar */}
        <div className="grid w-full grid-cols-3 gap-1 rounded-2xl bg-card p-1.5 shadow-sm" aria-hidden>
          {TABS.map((item, i) => {
            const Icon = item.icon;
            const active = i === index;
            return (
              <div
                key={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {tNav(item.labelKey)}
              </div>
            );
          })}
        </div>

        <p className="text-sm text-muted-foreground">
          {t("tourCount", { n: index + 1, total: TABS.length })}
        </p>
      </div>

      <Button size="lg" className="w-full" onClick={() => (last ? onDone() : setIndex(index + 1))}>
        {last ? t("next") : t("tourNext")}
      </Button>
    </div>
  );
}
