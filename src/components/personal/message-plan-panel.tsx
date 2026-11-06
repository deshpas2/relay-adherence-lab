"use client";

import { useState, useTransition } from "react";
import { Clock, Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { personalizeReminder, type PersonalProfile } from "@/lib/engine/personalize";
import { formatClock } from "@/lib/format-clock";
import { sendReminder } from "@/lib/push/client";
import { reminderText } from "@/lib/push/reminder-text";
import { NotificationPreview } from "./notification-preview";
import { ReasonsList } from "./reasons-list";

/** Care team view of a teen's next personalized reminder, with live send. */
export function MessagePlanPanel({ teenId, profile }: { teenId: string; profile: PersonalProfile }) {
  const t = useTranslations("Personal");
  const locale = useLocale();
  const [busy, startTransition] = useTransition();
  const [hint, setHint] = useState(false);
  const msg = personalizeReminder(profile);
  const text = reminderText(msg, t);

  function send() {
    setHint(false);
    startTransition(async () => {
      try {
        const { sent } = await sendReminder({ teen: teenId });
        toast(t("sentPhones", { n: sent }));
        if (sent === 0) setHint(true);
      } catch {
        toast(t("pushFailed"));
      }
    });
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold">{t("nextReminder", { name: profile.name })}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">
            <Clock aria-hidden className="size-3.5" /> {formatClock(msg.sendAt, locale)}
          </span>
          <span className="text-xs text-muted-foreground">
            · {t("medTime", { time: formatClock(profile.doseTime, locale) })}
          </span>
        </div>
        <NotificationPreview title={text.title} body={text.body} time={formatClock(msg.sendAt, locale)} />
        <Button onClick={send} disabled={busy} className="self-start">
          <Send aria-hidden /> {busy ? t("sending") : t("sendNow")}
        </Button>
        {hint && <p className="text-sm text-muted-foreground">{t("noPhonesHint")}</p>}
      </div>
      <div>
        <h3 className="mb-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">{t("whyHeading")}</h3>
        <ReasonsList reasons={msg.reasons} name={profile.name} />
      </div>
    </div>
  );
}
