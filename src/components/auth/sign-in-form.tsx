"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ErrorBox, FormError, PreviewNote, TextField } from "./fields";
import { idle, previewAction, type FormAction } from "./form-state";
import { SentPanel } from "./sent-panel";

type SignInFormProps = {
  /** Sends a magic link. Lane Backend: sendMagicLink */
  linkAction?: FormAction;
  /** Signs in with a password. Lane Backend: signInWithPassword */
  passwordAction?: FormAction;
  /** An error passed in the URL, e.g. ?error=link_expired */
  urlError?: string;
};

export function SignInForm({ linkAction, passwordAction, urlError }: SignInFormProps) {
  const t = useTranslations("Auth");
  const tErr = useTranslations("ActionErrors");
  const [mode, setMode] = useState<"link" | "password">("link");
  const [email, setEmail] = useState("");
  const [linkState, sendLink, linkPending] = useActionState(linkAction ?? previewAction, idle);
  const [pwState, signIn, pwPending] = useActionState(passwordAction ?? previewAction, idle);
  const [showSent, setShowSent] = useState(true);

  const state = mode === "link" ? linkState : pwState;
  const pending = mode === "link" ? linkPending : pwPending;
  const isPreview = !linkAction || !passwordAction;

  if (mode === "link" && linkState.status === "sent" && showSent) {
    return <SentPanel onReset={() => setShowSent(false)} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl">{t("signInTitle")}</h1>
        {mode === "link" && <p className="text-muted-foreground">{t("signInSubtitle")}</p>}
      </div>

      {urlError && state.status === "idle" && (
        <ErrorBox message={tErr.has(urlError) ? tErr(urlError) : tErr("failed")} />
      )}

      <form
        action={(fd) => {
          setShowSent(true);
          return mode === "link" ? sendLink(fd) : signIn(fd);
        }}
        className="flex flex-col gap-4"
      >
        <TextField
          label={t("email")}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={t("emailPlaceholder")}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {mode === "password" && (
          <TextField
            label={t("password")}
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        )}

        <FormError state={state} />

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? t("working") : mode === "link" ? t("sendLink") : t("signIn")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => setMode(mode === "link" ? "password" : "link")}
        >
          {mode === "link" ? t("usePassword") : t("useLink")}
        </Button>
      </form>

      <p className="text-center">
        {t("noAccount")}{" "}
        <Link href="/sign-up" className="font-semibold text-primary underline-offset-4 hover:underline">
          {t("createAccount")}
        </Link>
      </p>

      {isPreview && <PreviewNote />}
    </div>
  );
}
