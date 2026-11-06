"use client";

import { useState } from "react";
import { Check, Clock, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import { ErrorBox } from "@/components/auth/fields";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArmBadge } from "./arm-badge";
import { EasePicker } from "./ease-picker";
import type { Arm, DoseStatus } from "./types";

type LogDayCardProps = {
  arm: Arm;
  armText: string;
  busy: boolean;
  onSave: (status: DoseStatus, ease: number) => void;
};

const STATUSES = [
  { value: "taken" as const, icon: Check, key: "logOnTime" },
  { value: "late" as const, icon: Clock, key: "logLate" },
  { value: "missed" as const, icon: Minus, key: "logMissed" },
];

/** Today's check-in: how the meds went + how easy it was. */
export function LogDayCard({ arm, armText, busy, onSave }: LogDayCardProps) {
  const t = useTranslations("Experiments");
  const [status, setStatus] = useState<DoseStatus | null>(null);
  const [ease, setEase] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!status) return setError(t("pickStatus"));
    if (!ease) return setError(t("pickEase"));
    setError(null);
    onSave(status, ease);
  }

  return (
    <Card className="flex flex-col gap-5 border-2 border-primary/30 p-6">
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl">{t("logTitle")}</h2>
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <ArmBadge arm={arm} />
          <span className="flex flex-col">
            <span className="text-sm text-muted-foreground">{t("logArm", { arm })}</span>
            <span className="font-semibold">{armText}</span>
          </span>
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-medium">{t("logStatus")}</legend>
        <div className="grid grid-cols-3 gap-2">
          {STATUSES.map(({ value, icon: Icon, key }) => {
            const checked = status === value;
            return (
              <label
                key={value}
                className={cn(
                  "flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 p-2 text-sm font-medium transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                  checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted",
                )}
              >
                <input type="radio" name="status" checked={checked} onChange={() => setStatus(value)} className="sr-only" />
                <Icon aria-hidden className="size-5" />
                {t(key)}
              </label>
            );
          })}
        </div>
      </fieldset>

      <EasePicker value={ease} onChange={setEase} />

      {error && <ErrorBox message={error} />}

      <Button size="lg" className="w-full" onClick={save} disabled={busy}>
        {busy ? t("saving") : t("saveDay")}
      </Button>
    </Card>
  );
}
