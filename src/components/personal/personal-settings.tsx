"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { BellRing, Clock, Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ErrorBox } from "@/components/auth/fields";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { personalizeReminder, type PersonalProfile, type Tone } from "@/lib/engine/personalize";
import { QUIET_PRESETS, TONES } from "@/lib/fixtures/personal";
import { formatClock } from "@/lib/format-clock";
import { enablePush, pushStatus, sendReminder, type PushStatus } from "@/lib/push/client";
import { reminderText } from "@/lib/push/reminder-text";
import { cn } from "@/lib/utils";
import { NotificationPreview } from "./notification-preview";
import { ReasonsList } from "./reasons-list";

/**
 * The teen's reminder preferences, a live preview of their next reminder with
 * the reasons behind it, and turning on notifications for this phone.
 * TODO(backend): save preferences to the teen's profile.
 */
export function PersonalSettings({ profile }: { profile: PersonalProfile }) {
  const t = useTranslations("Personal");
  const locale = useLocale();
  const [tone, setTone] = useState<Tone>(profile.tone);
  const [discreet, setDiscreet] = useState(profile.discreet);
  const [school, setSchool] = useState(profile.quietHours.some((w) => w.start === QUIET_PRESETS.school.start));
  const [sleep, setSleep] = useState(profile.quietHours.some((w) => w.start === QUIET_PRESETS.sleep.start));
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const discreetId = useId();

  useEffect(() => {
    pushStatus().then(setStatus);
  }, []);

  const current: PersonalProfile = {
    ...profile,
    tone,
    discreet,
    quietHours: [...(school ? [QUIET_PRESETS.school] : []), ...(sleep ? [QUIET_PRESETS.sleep] : [])],
  };
  const msg = personalizeReminder(current);
  const text = reminderText(msg, t);

  function turnOn() {
    setError(null);
    startTransition(async () => {
      try {
        setStatus(await enablePush());
      } catch {
        setError(t("pushFailed"));
      }
    });
  }

  function sendNow() {
    setError(null);
    startTransition(async () => {
      try {
        const { sent } = await sendReminder({ teen: "me", prefs: { tone, discreet, school, sleep } });
        if (sent > 0) toast(t("testSent"));
        else setError(t("pushFailed"));
      } catch {
        setError(t("pushFailed"));
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl">{t("meTitle")}</h1>

      {/* Preview first: it changes live as the teen edits below. */}
      <section aria-labelledby="preview" className="flex flex-col gap-3 rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 id="preview" className="text-xl">{t("previewHeading")}</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-semibold">
            <Clock aria-hidden className="size-4" /> {t("arrivesAt", { time: formatClock(msg.sendAt, locale) })}
          </span>
        </div>
        <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{t("lockScreen")}</p>
        <NotificationPreview title={text.title} body={text.body} time={formatClock(msg.sendAt, locale)} />
        <h3 className="mt-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">{t("whyHeading")}</h3>
        <ReasonsList reasons={msg.reasons} name={profile.name} />
        <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
          {t("doseFixed", { time: formatClock(profile.doseTime, locale) })}
        </p>
      </section>

      <section aria-labelledby="push" className="flex flex-col gap-3">
        <h2 id="push" className="text-xl">{t("pushHeading")}</h2>
        {status === "on" ? (
          <p className="flex items-center gap-2 rounded-lg bg-accent p-3 font-semibold">
            <BellRing aria-hidden className="size-5 text-primary" /> {t("pushEnabled")}
          </p>
        ) : status === "blocked" ? (
          <ErrorBox message={t("pushBlocked")} />
        ) : status === "unsupported" ? (
          <ErrorBox message={t("pushUnsupported")} />
        ) : status === "insecure" ? (
          <ErrorBox message={t("pushNeedsHttps")} />
        ) : (
          <Button size="lg" className="w-full" onClick={turnOn} disabled={busy || status === null}>
            <BellRing aria-hidden /> {t("pushOn")}
          </Button>
        )}
        {status === "on" && (
          <Button size="lg" className="w-full" onClick={sendNow} disabled={busy}>
            <Send aria-hidden /> {busy ? t("sending") : t("sendTest")}
          </Button>
        )}
        {error && <ErrorBox message={error} />}
      </section>

      <section aria-labelledby="prefs" className="flex flex-col gap-5">
        <h2 id="prefs" className="text-xl">{t("msgHeading")}</h2>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-medium">{t("toneLabel")}</legend>
          <div className="grid grid-cols-3 gap-2">
            {TONES.map((v) => {
              const on = tone === v;
              return (
                <label
                  key={v}
                  className={cn(
                    "flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 p-2 text-center transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ring",
                    on ? "border-primary bg-accent" : "border-border bg-card hover:bg-muted",
                  )}
                >
                  <input type="radio" name="tone" className="sr-only" checked={on} onChange={() => setTone(v)} />
                  <span className="text-sm font-bold">{t(`tone_${v}`)}</span>
                  <span className="text-xs text-muted-foreground">{t(`toneHint_${v}`)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
          <label htmlFor={discreetId} className="flex flex-1 cursor-pointer flex-col">
            <span className="font-medium">{t("discreetLabel")}</span>
            <span className="text-sm text-muted-foreground">{t("discreetHint")}</span>
          </label>
          <Switch id={discreetId} checked={discreet} onCheckedChange={setDiscreet} />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="font-medium">{t("quietLabel")}</legend>
          <p className="mb-1 text-sm text-muted-foreground">{t("quietHint")}</p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["school", school, setSchool],
                ["sleep", sleep, setSleep],
              ] as const
            ).map(([key, on, set]) => (
              <label
                key={key}
                className={cn(
                  "flex min-h-14 cursor-pointer flex-col justify-center rounded-lg border-2 px-4 py-2 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ring",
                  on ? "border-primary bg-accent" : "border-border bg-card hover:bg-muted",
                )}
              >
                <input type="checkbox" className="sr-only" checked={on} onChange={() => set(!on)} />
                <span className="font-semibold">{t(`quiet_${key}`)}</span>
                <span className="text-xs text-muted-foreground">
                  {formatClock(QUIET_PRESETS[key].start, locale)} – {formatClock(QUIET_PRESETS[key].end, locale)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>
    </div>
  );
}
