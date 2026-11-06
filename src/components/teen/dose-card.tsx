"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Clock, PartyPopper } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatClock } from "@/lib/format-clock";
import { MedChip } from "./med-chip";
import { MissedSheet } from "./missed-sheet";
import type { DoseSlot } from "./types";

type DoseCardProps = {
  /** Opened from the reminder notification: draw attention to this card. */
  highlight?: boolean;
  slot: DoseSlot | null;
  /** The slot that was just logged, so the card can say thanks. */
  justLogged: DoseSlot | null;
  busy: boolean;
  onTook: () => void;
  onNotYet: () => void;
  onMissed: () => void;
};

/** The "Next up" card with the big Took it button. */
export function DoseCard({ slot, justLogged, busy, onTook, onNotYet, onMissed, highlight = false }: DoseCardProps) {
  const t = useTranslations("TeenHome");
  const locale = useLocale();
  const [missedOpen, setMissedOpen] = useState(false);

  // A kind word right after a missed dose, before moving on.
  if (justLogged?.status === "missed") {
    return (
      <Card className="flex flex-col gap-3 text-center">
        <p className="text-xl font-semibold">{t("missedLogged")}</p>
        <Link href="/teen/profile" className="font-semibold text-primary underline-offset-4 hover:underline">
          {t("newReminder")}
        </Link>
      </Card>
    );
  }

  if (!slot) {
    return (
      <Card className="flex flex-col items-center gap-2 py-8 text-center">
        <PartyPopper aria-hidden className="size-10 text-primary" />
        <h2 className="text-2xl">{t("allDoneTitle")}</h2>
        <p className="text-muted-foreground">{t("allDoneBody")}</p>
      </Card>
    );
  }

  return (
    <Card
      id="dose-card"
      className={cn("flex scroll-mt-24 flex-col gap-5 border-2 border-primary/30 p-6", highlight && "border-primary ring-4 ring-primary/30 motion-safe:animate-pulse [animation-iteration-count:2]")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">{t("nextUp")}</span>
          <h2 className="text-3xl">{t(`slot_${slot.label}`)}</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-semibold text-secondary-foreground">
          <Clock aria-hidden className="size-4" />
          {formatClock(slot.time, locale)}
        </span>
      </div>

      <ul className="flex flex-wrap gap-2" aria-label={t("medsLabel")}>
        {slot.meds.map((med) => (
          <li key={med.id}>
            <MedChip med={med} />
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2">
        <Button size="xl" onClick={onTook} disabled={busy}>
          <Check aria-hidden /> {t("tookIt")}
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onNotYet} disabled={busy}>
            {t("notYet")}
          </Button>
          <Button variant="ghost" onClick={() => setMissedOpen(true)} disabled={busy}>
            {t("missedIt")}
          </Button>
        </div>
      </div>

      <MissedSheet
        open={missedOpen}
        onOpenChange={setMissedOpen}
        onConfirm={() => {
          setMissedOpen(false);
          onMissed();
        }}
      />
    </Card>
  );
}
