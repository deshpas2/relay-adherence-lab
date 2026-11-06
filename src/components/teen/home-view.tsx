"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/toast";
import { DoseCard } from "./dose-card";
import { levelProgress } from "@/lib/engine/game";
import { TodayList } from "./today-list";
import type { DoseSlot, TeenHomeData } from "./types";
import { XPSummary } from "./xp-summary";

export type LogResult = { xpGained: number; loggedAt: string };

/**
 * Logs every med in a slot. Lane Backend: wrap logDose so XP is worked out on
 * the server, in the same action that writes dose_logs (Section 6.5).
 */
export type LogSlotAction = (slotId: string, status: "taken" | "missed") => Promise<LogResult>;

/** PREVIEW ONLY: pretends to save, so the screen can be tried before the DB lands. */
const previewLog: LogSlotAction = async (_slotId, status) => {
  await new Promise((r) => setTimeout(r, 300));
  const now = new Date();
  const loggedAt = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return { xpGained: status === "taken" ? 10 : 0, loggedAt };
};

export function HomeView({ data, logSlot = previewLog }: { data: TeenHomeData; logSlot?: LogSlotAction }) {
  const t = useTranslations("TeenHome");
  const [slots, setSlots] = useState(data.slots);
  const [xp, setXp] = useState(data.xp);
  const [justLogged, setJustLogged] = useState<DoseSlot | null>(null);
  // Slots the teen said "Not yet" to; they move to the back of the line.
  const [later, setLater] = useState<string[]>([]);
  const [busy, startTransition] = useTransition();

  const pending = slots.filter((s) => s.status === "pending");
  const next =
    pending.find((s) => !later.includes(s.id)) ?? pending[0] ?? null;

  function log(status: "taken" | "missed") {
    if (!next) return;
    startTransition(async () => {
      const result = await logSlot(next.id, status);
      const updated: DoseSlot = { ...next, status, loggedAt: result.loggedAt };
      setSlots((all) => all.map((s) => (s.id === next.id ? updated : s)));
      setJustLogged(status === "missed" ? updated : null);

      if (result.xpGained > 0) {
        const before = levelProgress(xp).level;
        const after = levelProgress(xp + result.xpGained).level;
        setXp(xp + result.xpGained);
        toast(t("xpToast", { xp: result.xpGained }), "xp");
        if (after > before) toast(t("levelUpToast", { level: after }), "xp");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl">{t("greeting", { name: data.displayName })}</h1>
        <XPSummary xp={xp} />
      </div>

      <DoseCard
        slot={justLogged ? null : next}
        justLogged={justLogged}
        busy={busy}
        onTook={() => log("taken")}
        onNotYet={() => {
          if (next) setLater((l) => [...l, next.id]);
          toast(t("notYetToast"));
        }}
        onMissed={() => log("missed")}
      />
      {justLogged && next && (
        <button
          type="button"
          onClick={() => setJustLogged(null)}
          className="-mt-3 min-h-11 font-semibold text-primary underline-offset-4 hover:underline"
        >
          {t("showNext")}
        </button>
      )}

      <TodayList slots={slots} />
    </div>
  );
}
