"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { localeCookie, locales, type Locale } from "@/i18n/config";
import { setClientCookie } from "@/lib/client-cookie";
import { cn } from "@/lib/utils";

// Each language is named in its own language, so anyone can find theirs.
const NAMES: Record<Locale, string> = { en: "English", es: "Español" };

export function LangSwitch({ label }: { label: string }) {
  const current = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(locale: Locale) {
    setClientCookie(localeCookie, locale);
    // Re-renders the page on the server with the new language.
    startTransition(() => router.refresh());
  }

  return (
    <fieldset className="flex flex-col gap-2" disabled={pending}>
      <legend className="mb-2 font-medium">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        {locales.map((locale) => {
          const active = locale === current;
          return (
            <button
              key={locale}
              type="button"
              lang={locale}
              aria-pressed={active}
              onClick={() => choose(locale)}
              className={cn(
                "h-11 rounded-xl border-2 font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted",
              )}
            >
              {NAMES[locale]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
