"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { HeartHandshake, Sparkles, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FormError, PreviewNote, TextField } from "./fields";
import { idle, previewAction, type FormAction } from "./form-state";
import { SentPanel } from "./sent-panel";

type Role = "teen" | "parent";

const ROLES: { value: Role; icon: LucideIcon; labelKey: string; hintKey: string }[] = [
  { value: "teen", icon: Sparkles, labelKey: "roleTeen", hintKey: "roleTeenHint" },
  { value: "parent", icon: HeartHandshake, labelKey: "roleParent", hintKey: "roleParentHint" },
];

/** Lane Backend: pass `action={signUp}`. Clinicians can't sign up here. */
export function SignUpForm({ action }: { action?: FormAction }) {
  const t = useTranslations("Auth");
  const [state, formAction, pending] = useActionState(action ?? previewAction, idle);
  const [role, setRole] = useState<Role | null>(null);
  const [showSent, setShowSent] = useState(true);

  if (state.status === "sent" && showSent) {
    return <SentPanel onReset={() => setShowSent(false)} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl">{t("signUpTitle")}</h1>
        <p className="text-muted-foreground">{t("signUpSubtitle")}</p>
      </div>

      <form
        action={(fd) => {
          setShowSent(true);
          return formAction(fd);
        }}
        className="flex flex-col gap-5"
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-medium">{t("whoAreYou")}</legend>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map(({ value, icon: Icon, labelKey, hintKey }) => {
              const checked = role === value;
              return (
                <label
                  key={value}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                    checked ? "border-primary bg-secondary" : "border-border bg-card hover:bg-muted",
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={checked}
                    onChange={() => setRole(value)}
                    required
                    className="sr-only"
                  />
                  <Icon aria-hidden className={cn("size-8", checked ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-lg font-semibold">{t(labelKey)}</span>
                  <span className="text-sm text-muted-foreground">{t(hintKey)}</span>
                </label>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground">{t("clinicianNote")}</p>
        </fieldset>

        <TextField label={t("name")} name="displayName" autoComplete="given-name" maxLength={50} required />
        <TextField
          label={t("email")}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={t("emailPlaceholder")}
          required
        />

        <details className="group rounded-xl border-2 border-dashed p-4 open:border-solid">
          <summary className="flex min-h-6 cursor-pointer list-none items-center justify-between font-medium">
            <span>
              {t("addPassword")} <span className="font-normal text-muted-foreground">({t("optional")})</span>
            </span>
            <span aria-hidden className="text-xl transition-transform group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4">
            <TextField
              label={t("password")}
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              hint={t("passwordHint")}
            />
          </div>
        </details>

        <FormError state={state} />

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? t("working") : t("createButton")}
        </Button>
      </form>

      <p className="text-center">
        {t("haveAccount")}{" "}
        <Link href="/sign-in" className="font-semibold text-primary underline-offset-4 hover:underline">
          {t("signIn")}
        </Link>
      </p>

      {!action && <PreviewNote />}
    </div>
  );
}
