"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Users } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { ErrorBox, TextField } from "@/components/auth/fields";
import { Button, buttonVariants } from "@/components/ui/button";
import { ADULT_AGE, adultMonth, ageInYears, isEnrollableAge } from "@/lib/engine/consent";

/** Pseudo-random 10-character code from the same alphabet as real invite codes. */
function demoCode(seed: string) {
  const abc = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  let out = "";
  for (let i = 0; i < 10; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    out += abc[(h >>> 0) % abc.length];
  }
  return `${out.slice(0, 5)}-${out.slice(5)}`;
}

/**
 * Clinician enrolls a patient. Month + year of birth (not the full date) gives
 * the age and the month they turn 18, which decides caregiver sharing.
 * TODO(backend): an enrollPatient action creates the patient, care_link and
 * guardian invite; this demo only shows the result.
 */
export function EnrollForm() {
  const t = useTranslations("Enroll");
  const format = useFormatter();
  const [first, setFirst] = useState("");
  const [initial, setInitial] = useState("");
  const [birth, setBirth] = useState("");
  const [caregiver, setCaregiver] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const age = useMemo(() => (birth ? ageInYears(birth, new Date()) : null), [birth]);
  const name = `${first.trim()} ${initial.trim().slice(0, 1).toUpperCase()}${initial.trim() ? "." : ""}`.trim();
  const turns = birth ? adultMonth(birth) : null;
  const turnsLabel = turns
    ? format.dateTime(new Date(Number(turns.slice(0, 4)), Number(turns.slice(5)) - 1, 1), { month: "long", year: "numeric" })
    : "";

  if (done && age !== null) {
    return (
      <div role="status" className="flex flex-col gap-5 rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <CheckCircle2 aria-hidden className="size-8 text-[#1f9d57]" />
          <h2 className="text-2xl">{t("doneTitle", { name })}</h2>
        </div>
        <p>{t("doneBody", { name: first.trim() })}</p>
        <p className="self-start rounded-lg border bg-muted px-4 py-3 font-heading text-2xl font-bold tracking-[0.14em]">
          {demoCode(`${name}${birth}`)}
        </p>
        <Rule age={age} turnsLabel={turnsLabel} caregiver={caregiver.trim()} />
        <p className="text-xs text-muted-foreground">{t("demoNote")}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setDone(false);
              setFirst("");
              setInitial("");
              setBirth("");
              setCaregiver("");
              setContact("");
            }}
          >
            {t("again")}
          </Button>
          <Link href="/clinic/home" className={buttonVariants()}>
            {t("back")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-5 rounded-xl border bg-card p-6 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        if (!first.trim() || !birth) return setError(t("missing"));
        if (!isEnrollableAge(age)) return setError(t("ageOutOfRange"));
        if (age < ADULT_AGE && !caregiver.trim()) return setError(t("needCaregiver"));
        setError(null);
        setDone(true);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <TextField label={t("firstName")} value={first} onChange={(e) => setFirst(e.target.value)} maxLength={40} required />
        <TextField label={t("lastInitial")} value={initial} onChange={(e) => setInitial(e.target.value)} maxLength={1} />
      </div>

      <div className="flex flex-col gap-2">
        <TextField
          label={t("birthLabel")}
          hint={t("birthHint")}
          type="month"
          value={birth}
          onChange={(e) => setBirth(e.target.value)}
          placeholder="2010-04"
          pattern="\d{4}-\d{2}"
          required
        />
        {age !== null && isEnrollableAge(age) && (
          <div aria-live="polite" className="flex flex-col gap-2">
            <p className="font-heading text-xl font-bold">{t("ageShown", { age })}</p>
            <Rule age={age} turnsLabel={turnsLabel} caregiver={caregiver.trim()} />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={age !== null && age >= ADULT_AGE ? t("caregiverOptional") : t("caregiverName")}
          value={caregiver}
          onChange={(e) => setCaregiver(e.target.value)}
          maxLength={60}
        />
        <TextField label={t("caregiverContact")} value={contact} onChange={(e) => setContact(e.target.value)} maxLength={80} />
      </div>

      {error && <ErrorBox message={error} />}
      <Button type="submit" size="lg" className="self-start">
        {t("submit")}
      </Button>
    </form>
  );
}

/** The sharing rule that will apply, in words the clinician can repeat to the family. */
function Rule({ age, turnsLabel, caregiver }: { age: number; turnsLabel: string; caregiver: string }) {
  const t = useTranslations("Enroll");
  const who = caregiver || t("theCaregiver");
  return age < ADULT_AGE ? (
    <div className="flex items-start gap-3 rounded-lg bg-[#e5eefb] p-3 text-sm text-[#163a5f]">
      <Users aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>
        <span className="block font-semibold">{t("ruleMinor", { who })}</span>
        {t("ruleTurns", { month: turnsLabel })}
      </span>
    </div>
  ) : (
    <div className="flex items-start gap-3 rounded-lg bg-[#e2f5e9] p-3 text-sm text-[#1b5e37]">
      <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span className="font-semibold">{t("ruleAdult", { who })}</span>
    </div>
  );
}
