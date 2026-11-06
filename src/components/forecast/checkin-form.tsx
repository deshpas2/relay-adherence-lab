"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { CalendarDays, HeartHandshake } from "lucide-react";
import { useTranslations } from "next-intl";
import { ErrorBox } from "@/components/auth/fields";
import { Button, buttonVariants } from "@/components/ui/button";
import { WEATHERS, weatherSignal, type Weather } from "@/lib/engine/forecast";
import { cn } from "@/lib/utils";
import { WEATHER_STYLE } from "./weather";

/**
 * The twice-a-week check-in: the teen picks their week's weather.
 * TODO(backend): save as a weekly check-in; stormy (and no reply) creates a
 * care-team task, like the re-engagement ladder.
 */
export function CheckinForm() {
  const t = useTranslations("Checkin");
  const [weather, setWeather] = useState<Weather | null>(null);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState<Weather | null>(null);
  const [error, setError] = useState(false);
  const noteId = useId();

  if (sent) {
    const { icon: Icon, color, soft } = WEATHER_STYLE[sent];
    const person = weatherSignal(sent) === "needs_person";
    return (
      <div role="status" className="flex flex-col items-center gap-4 py-6 text-center">
        <span className="grid size-24 place-items-center rounded-full" style={{ background: soft, color }}>
          <Icon aria-hidden className="size-12" />
        </span>
        <h1 className="text-3xl">{t("thanks_title")}</h1>
        <p className="max-w-[30ch] text-lg">{t(`thanks_${sent}`)}</p>
        {person && (
          <p className="flex items-start gap-2 rounded-2xl bg-accent p-3 text-left text-sm">
            <HeartHandshake aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            {t("careSees")}
          </p>
        )}
        <Link
          href={sent === "rainy" ? "/teen/experiments/new" : "/teen/home"}
          className={buttonVariants({ size: "lg", className: "w-full" })}
        >
          {sent === "rainy" ? t("openLab") : t("goHome")}
        </Link>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!weather) return setError(true);
        setSent(weather);
      }}
    >
      <div>
        <h1 className="text-3xl">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="sr-only">{t("title")}</legend>
        {WEATHERS.map((w) => {
          const { icon: Icon, color, soft } = WEATHER_STYLE[w];
          const on = weather === w;
          return (
            <label
              key={w}
              className={cn(
                "flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 p-4 text-center transition-all has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ring",
                on ? "scale-[1.02] border-primary bg-accent" : "border-border bg-card hover:bg-muted",
              )}
            >
              <input
                type="radio"
                name="weather"
                className="sr-only"
                checked={on}
                onChange={() => {
                  setWeather(w);
                  setError(false);
                }}
              />
              <span className="grid size-16 place-items-center rounded-full" style={{ background: soft, color }}>
                <Icon aria-hidden className="size-9" />
              </span>
              <span className="font-heading text-lg font-bold">{t(`weather_${w}`)}</span>
              <span className="text-sm text-muted-foreground">{t(`hint_${w}`)}</span>
            </label>
          );
        })}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={noteId} className="font-medium">
          {t("noteLabel")}
        </label>
        <textarea
          id={noteId}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={280}
          rows={3}
          className="w-full rounded-xl border-2 border-input bg-card p-3 text-base outline-none focus-visible:border-ring"
        />
      </div>

      {error && <ErrorBox message={t("pickOne")} />}
      <Button type="submit" size="lg" className="w-full">
        {t("send")}
      </Button>
      <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <CalendarDays aria-hidden className="size-4" /> {t("schedule")}
      </p>
    </form>
  );
}
