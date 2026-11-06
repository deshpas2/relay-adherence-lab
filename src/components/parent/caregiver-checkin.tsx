"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/**
 * The parent's own view of what gets in the way. Goes to the care team only,
 * never to the teen, so both can answer honestly.
 * TODO(backend): save as a caregiver check-in the clinician can compare.
 */
export function CaregiverCheckin({ teenName, keys }: { teenName: string; keys: readonly string[] }) {
  const t = useTranslations("Parent");
  const [picked, setPicked] = useState<string[]>([]);
  const [sent, setSent] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">{t("checkinTitle", { name: teenName })}</legend>
        {keys.map((k) => {
          const on = picked.includes(k);
          return (
            <label
              key={k}
              className={cn(
                "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 font-medium transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ring",
                on ? "border-primary bg-accent" : "bg-card hover:bg-muted",
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={on}
                onChange={() => {
                  setSent(false);
                  setPicked((p) => (on ? p.filter((x) => x !== k) : [...p, k]));
                }}
              />
              <span
                aria-hidden
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-md border-2",
                  on ? "border-primary bg-primary text-primary-foreground" : "border-input",
                )}
              >
                {on && <Check className="size-3.5" />}
              </span>
              {t(`cg_${k}`)}
            </label>
          );
        })}
      </fieldset>
      <Button
        size="lg"
        variant={sent ? "secondary" : "default"}
        className="w-full"
        disabled={picked.length === 0}
        onClick={() => {
          setSent(true);
          toast(t("sentToast"));
        }}
      >
        {sent ? t("sent") : t("share")}
      </Button>
    </div>
  );
}
