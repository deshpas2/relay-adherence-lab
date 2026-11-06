"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** 1 (hard) to 5 (easy). Radio buttons, so arrow keys work. */
export function EasePicker({ value, onChange }: { value: number | null; onChange: (n: number) => void }) {
  const t = useTranslations("Experiments");
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-medium">{t("easeQuestion")}</legend>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const checked = value === n;
          return (
            <label
              key={n}
              className={cn(
                "grid h-12 cursor-pointer place-items-center rounded-xl border-2 font-heading text-lg font-semibold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted",
              )}
            >
              <input
                type="radio"
                name="ease"
                value={n}
                checked={checked}
                onChange={() => onChange(n)}
                aria-label={t("easeN", { n })}
                className="sr-only"
              />
              {n}
            </label>
          );
        })}
      </div>
      <div className="flex justify-between text-sm text-muted-foreground" aria-hidden>
        <span>{t("easeHard")}</span>
        <span>{t("easeEasy")}</span>
      </div>
    </fieldset>
  );
}
