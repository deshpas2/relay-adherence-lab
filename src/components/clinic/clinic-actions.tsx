"use client";

import { useState, useTransition } from "react";
import { CloudSun, FlaskConical } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { sendReminder } from "@/lib/push/client";

type Idea = { key: string; title: string; hypothesis: string };

/**
 * Clinician actions on a patient. Suggesting a test and sending a check-in
 * push a notification to the teen's phone (demo: every subscribed phone).
 * TODO(backend): suggestExperiment also stores the suggestion (Section 6.6).
 */
export function ClinicActions({ teenId, first, ideas }: { teenId: string; first: string; ideas: Idea[] }) {
  const t = useTranslations("Clinic");
  const tP = useTranslations("Personal");
  const tF = useTranslations("Forecast");
  const [open, setOpen] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [busy, startTransition] = useTransition();

  function push(type: "suggest" | "checkin", idea?: string, done?: string) {
    startTransition(async () => {
      try {
        const { sent } = await sendReminder({ teen: teenId, type, idea });
        if (done) toast(done);
        toast(tP("sentPhones", { n: sent }));
      } catch {
        toast(tP("pushFailed"));
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => setOpen(true)} disabled={busy}>
        <FlaskConical aria-hidden /> {t("recommend")}
      </Button>
      <Button variant="outline" onClick={() => push("checkin")} disabled={busy}>
        <CloudSun aria-hidden /> {tF("sendCheckin")}
      </Button>
      <Button
        variant="outline"
        aria-pressed={flagged}
        onClick={() => {
          setFlagged(!flagged);
          toast(flagged ? t("unflagged") : t("flagged"));
        }}
      >
        {flagged ? t("flaggedButton") : t("flag")}
      </Button>
      <Button variant="outline" onClick={() => toast(t("encouraged", { name: first }))}>
        {t("encourage")}
      </Button>

      <Sheet open={open} onOpenChange={setOpen} title={t("recommendTitle")} description={t("recommendBody", { name: first })}>
        <ul className="flex flex-col gap-2">
          {ideas.map((idea) => (
            <li key={idea.key}>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setOpen(false);
                  push("suggest", idea.key, t("recommended", { name: first }));
                }}
                className="flex w-full items-start gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted"
              >
                <FlaskConical aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
                <span className="flex flex-col">
                  <span className="font-semibold">{idea.title}</span>
                  <span className="text-sm text-muted-foreground">{idea.hypothesis}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </div>
  );
}
