"use client";

import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";

/**
 * Clinician actions on a patient. TODO(backend): suggestExperiment creates a
 * suggested experiment or a notification the teen can accept (Section 6.6).
 */
export function ClinicActions({ first, ideas }: { first: string; ideas: string[] }) {
  const t = useTranslations("Clinic");
  const [open, setOpen] = useState(false);
  const [flagged, setFlagged] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => setOpen(true)}>
        <FlaskConical aria-hidden /> {t("recommend")}
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
            <li key={idea}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  toast(t("recommended", { name: first }));
                }}
                className="flex w-full items-start gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted"
              >
                <FlaskConical aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
                <span className="font-medium">{idea}</span>
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </div>
  );
}
