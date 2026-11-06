"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, HeartPulse, PartyPopper, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ErrorBox } from "@/components/auth/fields";
import { formatClock } from "@/lib/format-clock";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarrierStep } from "./barrier-step";
import { TourStep } from "./tour-step";
import type { BarrierKey, OnboardingAnswers, SaveOnboarding, ScheduleSlot } from "./types";

type Step = "intro" | "promise" | "privacy" | "tour" | "barriers" | "primary" | "reminders" | "done";

/** PREVIEW ONLY: pretends to save until Lane Backend's action is passed in. */
const previewSave: SaveOnboarding = async () => {
  await new Promise((r) => setTimeout(r, 400));
  return { status: "ok" };
};

type WizardProps = {
  schedule: ScheduleSlot[];
  homeHref: string;
  save?: SaveOnboarding;
};

/** Teen onboarding + barrier check-in (Section 6.1). */
export function OnboardingWizard({ schedule, homeHref, save = previewSave }: WizardProps) {
  const t = useTranslations("Onboarding");
  const tHome = useTranslations("TeenHome");
  const tErr = useTranslations("ActionErrors");
  const locale = useLocale();

  const [step, setStep] = useState<Step>("intro");
  const [barriers, setBarriers] = useState<BarrierKey[]>([]);
  const [otherOn, setOtherOn] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [primary, setPrimary] = useState<BarrierKey | "other" | null>(null);
  const [reminders, setReminders] = useState(() =>
    Object.fromEntries(schedule.map((s) => [s.id, s.time])),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  // Everything the teen picked, "other" included.
  const picked: (BarrierKey | "other")[] = [...barriers, ...(otherOn ? (["other"] as const) : [])];
  // "Which is biggest?" only makes sense with two or more.
  const steps: Step[] = [
    "intro",
    "promise",
    "privacy",
    "tour",
    "barriers",
    ...(picked.length > 1 ? (["primary"] as const) : []),
    "reminders",
    "done",
  ];
  const index = steps.indexOf(step);
  const total = steps.length - 1; // "done" isn't counted

  // Move focus to the new heading, so screen readers announce each step.
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), [step]);

  const go = (to: Step) => {
    setError(null);
    setStep(to);
  };
  const next = () => go(steps[index + 1]);
  const back = () => go(steps[index - 1]);

  function finish() {
    const answers: OnboardingAnswers = {
      barriers,
      primaryBarrier: picked.length === 1 ? picked[0] : primary,
      otherText: otherOn ? otherText.trim() : "",
      reminders: schedule.map((s) => ({ slotId: s.id, time: reminders[s.id] })),
    };
    startSaving(async () => {
      const result = await save(answers);
      if (result.status === "error") {
        setError(tErr.has(result.code) ? tErr(result.code) : tErr("failed"));
      } else {
        go("done");
      }
    });
  }

  const heading = (text: string) => (
    <h1 ref={headingRef} tabIndex={-1} className="text-3xl outline-none">
      {text}
    </h1>
  );

  return (
    <div className="flex flex-1 flex-col gap-6">
      {step !== "done" && (
        <div className="flex items-center gap-3">
          {index > 0 ? (
            <Button variant="ghost" size="icon" onClick={back} aria-label={t("back")}>
              <ArrowLeft aria-hidden />
            </Button>
          ) : (
            <span className="size-11" />
          )}
          <div
            role="progressbar"
            aria-label={t("stepOf", { n: index + 1, total })}
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={index + 1}
            className="flex flex-1 gap-1.5"
          >
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={cn("h-2 flex-1 rounded-full transition-colors", i <= index ? "bg-primary" : "bg-xp-track")}
              />
            ))}
          </div>
        </div>
      )}

      {step === "intro" && (
        <StepBody icon={<Sparkles className="size-10" />}>
          {heading(t("introTitle"))}
          <p className="text-lg">{t("introBody")}</p>
          <Button size="lg" className="mt-auto w-full" onClick={next}>
            {t("start")}
          </Button>
        </StepBody>
      )}

      {step === "promise" && (
        <StepBody icon={<ShieldCheck className="size-10" />}>
          {heading(t("promiseTitle"))}
          <p className="rounded-2xl border-2 border-primary bg-secondary p-5 font-heading text-xl font-semibold text-secondary-foreground">
            {t("promiseBody")}
          </p>
          <p className="text-lg">{t("promiseNote")}</p>
          <Button size="lg" className="mt-auto w-full" onClick={next}>
            {t("gotIt")}
          </Button>
        </StepBody>
      )}

      {step === "privacy" && (
        <StepBody icon={<Eye className="size-10" />}>
          {heading(t("privacyTitle"))}
          <ul className="flex flex-col gap-3">
            <InfoRow icon={<HeartPulse className="size-6" />} text={t("privacyCare")} />
            <InfoRow icon={<Users className="size-6" />} text={t("privacyParent")} />
          </ul>
          <Button size="lg" className="mt-auto w-full" onClick={next}>
            {t("next")}
          </Button>
        </StepBody>
      )}

      {step === "tour" && (
        <div className="flex flex-col gap-4">
          {heading(t("tourTitle"))}
          <TourStep onDone={next} />
        </div>
      )}

      {step === "barriers" && (
        <div className="flex flex-1 flex-col gap-4">
          {heading(t("barriersTitle"))}
          <p className="text-muted-foreground">{t("barriersBody")}</p>
          <BarrierStep
            selected={barriers}
            onToggle={(key) =>
              setBarriers((b) => (b.includes(key) ? b.filter((k) => k !== key) : [...b, key]))
            }
            otherOn={otherOn}
            onOtherToggle={() => setOtherOn((o) => !o)}
            otherText={otherText}
            onOtherText={setOtherText}
          />
          {error && <ErrorBox message={error} />}
          <Button
            size="lg"
            className="mt-auto w-full"
            onClick={() => (picked.length === 0 ? setError(t("pickOne")) : next())}
          >
            {t("next")}
          </Button>
        </div>
      )}

      {step === "primary" && (
        <div className="flex flex-1 flex-col gap-4">
          {heading(t("primaryTitle"))}
          <p className="text-muted-foreground">{t("primaryBody")}</p>
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">{t("primaryTitle")}</legend>
            {picked.map((key) => {
              const checked = primary === key;
              return (
                <label
                  key={key}
                  className={cn(
                    "flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 font-medium transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                    checked ? "border-primary bg-secondary" : "border-border bg-card hover:bg-muted",
                  )}
                >
                  <input
                    type="radio"
                    name="primary"
                    checked={checked}
                    onChange={() => setPrimary(key)}
                    className="size-5 accent-[var(--primary)]"
                  />
                  {key === "other" && otherText.trim() ? otherText.trim() : t(`barrier_${key}`)}
                </label>
              );
            })}
          </fieldset>
          {error && <ErrorBox message={error} />}
          <Button
            size="lg"
            className="mt-auto w-full"
            onClick={() => (primary && picked.includes(primary) ? next() : setError(t("pickBiggest")))}
          >
            {t("next")}
          </Button>
        </div>
      )}

      {step === "reminders" && (
        <div className="flex flex-1 flex-col gap-4">
          {heading(t("remindersTitle"))}
          <p className="text-muted-foreground">{t("remindersBody")}</p>
          <ul className="flex flex-col gap-3">
            {schedule.map((slot) => (
              <li key={slot.id} className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-4">
                <label htmlFor={`rem-${slot.id}`} className="flex flex-col">
                  <span className="font-heading text-lg font-semibold">{tHome(`slot_${slot.label}`)}</span>
                  <span className="text-sm text-muted-foreground">
                    {t("medTime", { time: formatClock(slot.time, locale) })}
                  </span>
                </label>
                <input
                  id={`rem-${slot.id}`}
                  type="time"
                  value={reminders[slot.id]}
                  onChange={(e) => setReminders((r) => ({ ...r, [slot.id]: e.target.value }))}
                  className="h-12 rounded-xl border-2 border-input bg-card px-3 text-base font-medium outline-none focus-visible:border-ring"
                />
              </li>
            ))}
          </ul>
          {error && <ErrorBox message={error} />}
          <Button size="lg" className="mt-auto w-full" onClick={finish} disabled={saving}>
            {saving ? t("saving") : t("finish")}
          </Button>
        </div>
      )}

      {step === "done" && (
        <StepBody icon={<PartyPopper className="size-12" />} center>
          {heading(t("doneTitle"))}
          <p className="text-lg">{t("doneBody")}</p>
          <span className="inline-flex items-center gap-2 self-center rounded-full bg-xp px-4 py-2 font-semibold text-xp-foreground">
            <Sparkles aria-hidden className="size-5" />
            {t("questComplete")}
          </span>
          <Link href={homeHref} className={buttonVariants({ size: "lg", className: "mt-auto w-full" })}>
            {t("goHome")}
          </Link>
        </StepBody>
      )}
    </div>
  );
}

function StepBody({ icon, center, children }: { icon: React.ReactNode; center?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-1 flex-col gap-5", center && "text-center")}>
      <span
        aria-hidden
        className={cn("grid size-20 place-items-center rounded-3xl bg-accent text-primary", center && "self-center")}
      >
        {icon}
      </span>
      {children}
    </div>
  );
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border bg-card p-4 text-lg">
      <span aria-hidden className="text-primary">
        {icon}
      </span>
      {text}
    </li>
  );
}
