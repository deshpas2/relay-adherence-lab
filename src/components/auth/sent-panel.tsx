"use client";

import { MailCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

/** "Check your email" — shown after a sign-in link is sent. */
export function SentPanel({ onReset }: { onReset: () => void }) {
  const t = useTranslations("Auth");
  return (
    <div role="status" className="flex flex-col items-center gap-4 text-center">
      <span className="grid size-20 place-items-center rounded-full bg-accent">
        <MailCheck aria-hidden className="size-10 text-primary" />
      </span>
      <h1 className="text-3xl">{t("sentTitle")}</h1>
      <p className="text-lg">{t("sentBody")}</p>
      <p className="text-muted-foreground">{t("sentTip")}</p>
      <Button variant="ghost" onClick={onReset}>
        {t("tryAgain")}
      </Button>
    </div>
  );
}
