"use client";

import { useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, HeartPulse, KeyRound, RefreshCw, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { acceptAdultTerms } from "@/lib/sharing/actions";
import { cn } from "@/lib/utils";

const POINTS: { icon: LucideIcon; key: string }[] = [
  { icon: KeyRound, key: "point1" },
  { icon: Eye, key: "point2" },
  { icon: HeartPulse, key: "point3" },
  { icon: RefreshCw, key: "point4" },
];

/** Shown the first time a patient opens Relay at 18 or older. */
export function AdultConsentForm({ name, caregiver }: { name: string; caregiver: string }) {
  const t = useTranslations("Adult");
  const [share, setShare] = useState(false);
  const [agree, setAgree] = useState(false);
  const shareId = useId();
  const agreeId = useId();

  return (
    <form action={acceptAdultTerms} className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold tracking-[0.14em] text-primary uppercase">{t("eyebrow")}</span>
        <h1 className="text-3xl leading-tight">{t("title", { name })}</h1>
        <p className="text-lg text-muted-foreground">{t("intro")}</p>
      </div>

      <ul className="flex flex-col gap-3">
        {POINTS.map(({ icon: Icon, key }) => (
          <li key={key} className="flex items-start gap-3 rounded-lg border bg-card p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">
              <Icon aria-hidden className="size-5" />
            </span>
            <span>
              <span className="block font-bold">{t(`${key}_title`)}</span>
              <span className="text-sm text-muted-foreground">{t(`${key}_body`, { caregiver })}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className={cn("flex items-center gap-4 rounded-lg border-2 p-4", share ? "border-primary bg-accent" : "bg-card")}>
        <label htmlFor={shareId} className="flex flex-1 cursor-pointer flex-col">
          <span className="font-semibold">{t("shareLabel", { caregiver })}</span>
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {share ? t("shareOn", { caregiver }) : t("shareOff", { caregiver })}
          </span>
        </label>
        <Switch id={shareId} checked={share} onCheckedChange={setShare} />
        {/* The switch isn't a native input, so the form value goes here. */}
        {share && <input type="hidden" name="share" value="on" />}
      </div>

      <details className="rounded-lg border bg-card p-4">
        <summary className="cursor-pointer font-semibold text-primary">{t("termsLink")}</summary>
        <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm">
          {[1, 2, 3, 4].map((n) => (
            <li key={n}>{t(`terms_${n}`, { caregiver })}</li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-muted-foreground">{t("terms_sample")}</p>
      </details>

      <div className="mt-auto flex flex-col gap-3">
        <label htmlFor={agreeId} className="flex min-h-11 cursor-pointer items-center gap-3 font-medium">
          <input
            id={agreeId}
            type="checkbox"
            name="agree"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="size-6 shrink-0 accent-[var(--primary)]"
          />
          {t("agree")}
        </label>
        <Submit disabled={!agree} label={t("go")} />
        {!agree && <p className="text-center text-sm text-muted-foreground">{t("needAgree")}</p>}
      </div>
    </form>
  );
}

function Submit({ disabled, label }: { disabled: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={disabled || pending}>
      {label}
    </Button>
  );
}
