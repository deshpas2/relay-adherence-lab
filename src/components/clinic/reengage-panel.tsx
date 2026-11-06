"use client";

import { useState } from "react";
import { Bell, Check, Lock, MessageSquare, Mic, Phone, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { TeenMessage } from "@/components/reengage/teen-message";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { reengagementPlan, type ReengageChannel, type ReengageStep } from "@/lib/engine/reengage";
import { cn } from "@/lib/utils";

const ICON: Record<ReengageChannel, LucideIcon> = {
  app: Bell,
  sms: MessageSquare,
  nurse_voice: Mic,
  care_team_call: Phone,
};

type Props = { name: string; nurse: string; daysQuiet: number; done: ReengageChannel[] };

/**
 * The "Reaching out" ladder on a patient's page. App and text steps send
 * themselves; the nurse records the voice note and the care team logs the call.
 * TODO(backend): a daily job computes reengagementPlan for every enrolled teen,
 * writes `notifications` for the app step, sends the text through an SMS
 * provider, and creates care-team tasks for the voice note and the call.
 */
export function ReengagePanel({ name, nurse, daysQuiet, done: initialDone }: Props) {
  const t = useTranslations("Reengage");
  const [done, setDone] = useState<ReengageChannel[]>(initialDone);
  const [preview, setPreview] = useState<ReengageChannel | null>(null);
  const [recording, setRecording] = useState(false);
  const [calling, setCalling] = useState(false);
  const plan = reengagementPlan(daysQuiet, done);

  function stateLabel(s: ReengageStep) {
    if (s.state === "upcoming") return t("state_upcoming", { n: s.dueInDays });
    if (s.state === "sent") return t("state_sent");
    return t(`state_${s.state}_${s.channel}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">
        {plan.active ? (
          <span className="font-semibold">{t("panelQuiet", { name, n: plan.daysQuiet })} </span>
        ) : (
          <span className="font-semibold">{t("panelActive", { name })} </span>
        )}
        <span className="text-muted-foreground">{t("panelIntro", { name })}</span>
      </p>

      <ol className="flex flex-col">
        {plan.steps.map((s, i) => {
          const Icon = ICON[s.channel];
          const last = i === plan.steps.length - 1;
          const reached = s.state !== "upcoming";
          return (
            <li key={s.channel} className="relative flex gap-3 pb-4 last:pb-0">
              {!last && (
                <span
                  aria-hidden
                  className={cn("absolute top-10 bottom-0 left-[19px] w-0.5", reached ? "bg-primary/40" : "bg-border")}
                />
              )}
              <span
                className={cn(
                  "z-10 grid size-10 shrink-0 place-items-center rounded-full border-2",
                  s.state === "action_needed" && "border-[#c0392b] bg-[#fde8e8] text-[#b0352a]",
                  (s.state === "sent" || s.state === "done") && "border-primary bg-primary text-primary-foreground",
                  s.state === "upcoming" && "border-border bg-card text-muted-foreground",
                )}
              >
                {s.state === "sent" || s.state === "done" ? <Check aria-hidden className="size-4" /> : <Icon aria-hidden className="size-4" />}
              </span>
              <div className="flex flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-1">
                <div>
                  <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{t("dayN", { n: s.day })}</p>
                  <p className="font-semibold">{t(`step_${s.channel}`, { nurse })}</p>
                  <p
                    className={cn(
                      "text-sm",
                      s.state === "action_needed" ? "font-bold text-[#b0352a]" : "text-muted-foreground",
                    )}
                  >
                    {stateLabel(s)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.channel !== "care_team_call" && (
                    <Button size="sm" variant="outline" onClick={() => setPreview(s.channel)}>
                      {t("preview")}
                    </Button>
                  )}
                  {s.channel === "nurse_voice" && s.state === "action_needed" && (
                    <Button size="sm" onClick={() => setRecording(true)}>
                      <Mic aria-hidden /> {t("record")}
                    </Button>
                  )}
                  {s.channel === "care_team_call" && s.state === "action_needed" && (
                    <Button size="sm" onClick={() => setCalling(true)}>
                      <Phone aria-hidden /> {t("logCall")}
                    </Button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="flex items-start gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
        <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        {t("privacyNote", { name })}
      </p>

      <Sheet open={preview !== null} onOpenChange={(o) => !o && setPreview(null)} title={t("previewTitle", { name })}>
        {preview && (
          <div className="rounded-3xl bg-[#081621] p-4" data-app="teen">
            <TeenMessage channel={preview} name={name} nurse={nurse} />
          </div>
        )}
      </Sheet>

      <Sheet open={recording} onOpenChange={setRecording} title={t("recordTitle")} description={t("recordBody", { name })}>
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{t("recordScript")}</p>
          <p className="rounded-xl border bg-muted p-3">{t("voice_body", { name, nurse })}</p>
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              setRecording(false);
              setDone((d) => [...d, "nurse_voice"]);
              toast(t("recorded", { name }));
            }}
          >
            <Mic aria-hidden /> {t("recordSend")}
          </Button>
        </div>
      </Sheet>

      <Sheet open={calling} onOpenChange={setCalling} title={t("callTitle", { name })}>
        <div className="flex flex-col gap-2">
          {(["reached", "message", "noanswer"] as const).map((o) => (
            <Button
              key={o}
              variant={o === "reached" ? "default" : "outline"}
              size="lg"
              className="w-full justify-start"
              onClick={() => {
                setCalling(false);
                setDone((d) => [...d, "care_team_call"]);
                toast(t(`logged_${o}`, { name }));
              }}
            >
              {t(`outcome_${o}`, { name })}
            </Button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
