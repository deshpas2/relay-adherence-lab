"use client";

import { Lightbulb } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Reason } from "@/lib/engine/personalize";

/** Plain-language reasons for the timing and wording of a message. */
export function ReasonsList({ reasons, name }: { reasons: Reason[]; name: string }) {
  const t = useTranslations("Personal");
  return (
    <ul className="flex flex-col gap-2">
      {reasons.map((r) => (
        <li key={r.code} className="flex items-start gap-2 text-sm">
          <Lightbulb aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            {t(`reason_${r.code}`, {
              name,
              ...r.params,
              ...(r.code === "tone" ? { toneLabel: t(`tone_${r.params?.tone}`) } : {}),
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}
