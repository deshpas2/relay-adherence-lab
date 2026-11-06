"use client";

import { useTransition } from "react";
import { Bell, CloudSun, FlaskConical, PartyPopper, Send, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { sendReminder, type PushKind } from "@/lib/push/client";

const KINDS: { type: PushKind; icon: LucideIcon; opens: string; idea?: string }[] = [
  { type: "reminder", icon: Bell, opens: "/teen/home" },
  { type: "suggest", icon: FlaskConical, opens: "/teen/experiments/new", idea: "parentCheck" },
  { type: "complete", icon: PartyPopper, opens: "/teen/experiments/exp-1" },
  { type: "checkin", icon: CloudSun, opens: "/teen/checkin" },
];

/** Demo remote: sends each kind of notification to every subscribed phone. */
export function NotifyLab() {
  const t = useTranslations("NotifyLab");
  const tP = useTranslations("Personal");
  const [busy, startTransition] = useTransition();

  function send(type: PushKind, idea?: string) {
    startTransition(async () => {
      try {
        const { sent } = await sendReminder({ teen: "me", type, idea });
        toast(tP("sentPhones", { n: sent }));
      } catch {
        toast(tP("pushFailed"));
      }
    });
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {KINDS.map(({ type, icon: Icon, opens, idea }) => (
        <li key={type} className="flex flex-col gap-3 rounded-lg border bg-card p-5">
          <span className="grid size-11 place-items-center rounded-xl bg-accent text-primary">
            <Icon aria-hidden className="size-5" />
          </span>
          <div className="flex-1">
            <h2 className="text-lg">{t(`type_${type}`)}</h2>
            <p className="text-sm text-muted-foreground">{t(`desc_${type}`)}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{t("opens", { where: opens })}</p>
          </div>
          <Button onClick={() => send(type, idea)} disabled={busy}>
            <Send aria-hidden /> {t("send")}
          </Button>
        </li>
      ))}
    </ul>
  );
}
