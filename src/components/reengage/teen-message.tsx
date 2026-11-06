"use client";

import { useState } from "react";
import { Bell, MessageSquare, Phone, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReengageChannel } from "@/lib/engine/reengage";

/**
 * What the teen receives at each step. Wording is kind and never mentions
 * health or medicine, because notifications and texts show on lock screens.
 */
export function TeenMessage({ channel, name, nurse }: { channel: ReengageChannel; name: string; nurse: string }) {
  const t = useTranslations("Reengage");
  const [showWords, setShowWords] = useState(false);

  if (channel === "app") {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-[#1b2a35] p-3.5 text-[#edf4f8] shadow-md">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#34c56a] text-[#042b12]">
          <Bell aria-hidden className="size-4" />
        </span>
        <span className="flex flex-col">
          <span className="text-xs font-semibold opacity-70">Relay · {t("now")}</span>
          <span className="font-bold">{t("app_title")}</span>
          <span className="text-sm opacity-90">{t("app_body")}</span>
        </span>
      </div>
    );
  }

  if (channel === "sms") {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <MessageSquare aria-hidden className="size-3.5" /> {t("sms_from")}
        </span>
        <p className="max-w-[85%] rounded-2xl rounded-bl-md bg-[#e9ecef] px-4 py-2.5 text-sm text-[#17202a]">
          {t("sms_body", { name })}
        </p>
      </div>
    );
  }

  if (channel === "nurse_voice") {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border bg-card p-3.5">
        <span className="text-xs font-semibold text-muted-foreground">{t("voice_from", { nurse })}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={t("play")}
            onClick={() => setShowWords((s) => !s)}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
          >
            <Play aria-hidden className="size-5" />
          </button>
          {/* A still waveform: decorative. */}
          <span aria-hidden className="flex h-8 flex-1 items-center gap-[3px]">
            {[4, 9, 14, 7, 18, 11, 22, 13, 8, 16, 20, 10, 6, 15, 9, 12, 5, 8].map((h, i) => (
              <span key={i} className="w-1 rounded-full bg-primary/60" style={{ height: h + 4 }} />
            ))}
          </span>
          <span className="text-xs font-semibold text-muted-foreground tabular-nums">0:24</span>
        </div>
        <button
          type="button"
          onClick={() => setShowWords((s) => !s)}
          aria-expanded={showWords}
          className="self-start text-sm font-semibold text-primary"
        >
          {t("showWords")}
        </button>
        {showWords && <p className="rounded-xl bg-muted p-3 text-sm">{t("voice_body", { name, nurse })}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-3.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-primary">
        <Phone aria-hidden className="size-5" />
      </span>
      <span className="flex flex-col">
        <span className="font-bold">{t("call_title")}</span>
        <span className="text-sm text-muted-foreground">{t("call_body", { name })}</span>
      </span>
    </div>
  );
}
