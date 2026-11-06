"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { BARRIER_KEYS, type BarrierKey } from "./types";

type BarrierStepProps = {
  selected: BarrierKey[];
  onToggle: (key: BarrierKey) => void;
  otherOn: boolean;
  onOtherToggle: () => void;
  otherText: string;
  onOtherText: (text: string) => void;
};

/** Tappable chips for each barrier, plus "Something else" with a text box. */
export function BarrierStep(props: BarrierStepProps) {
  const t = useTranslations("Onboarding");
  const otherId = useId();

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="sr-only">{t("barriersTitle")}</legend>
      <div className="flex flex-wrap gap-2">
        {BARRIER_KEYS.map((key) => (
          <Chip
            key={key}
            label={t(`barrier_${key}`)}
            checked={props.selected.includes(key)}
            onChange={() => props.onToggle(key)}
          />
        ))}
        <Chip label={t("barrier_other")} checked={props.otherOn} onChange={props.onOtherToggle} />
      </div>

      {props.otherOn && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={otherId} className="font-medium">
            {t("otherLabel")}
          </label>
          <textarea
            id={otherId}
            value={props.otherText}
            onChange={(e) => props.onOtherText(e.target.value)}
            maxLength={200}
            rows={3}
            className="w-full rounded-xl border-2 border-input bg-card p-3 text-base outline-none focus-visible:border-ring"
          />
        </div>
      )}
    </fieldset>
  );
}

function Chip({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 px-4 py-2 font-medium transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
        checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted",
      )}
    >
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      {checked && <Check aria-hidden className="size-4" />}
      {label}
    </label>
  );
}
