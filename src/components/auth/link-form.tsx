"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Link2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormError, PreviewNote, TextField } from "./fields";
import { idle, previewAction, type FormAction } from "./form-state";

/** Parent enters the teen's invite code. Lane Backend: pass `action={redeemGuardianInvite}`. */
export function LinkForm({ action, homeHref }: { action?: FormAction; homeHref: string }) {
  const t = useTranslations("Auth");
  const [state, formAction, pending] = useActionState(action ?? previewAction, idle);

  if (state.status === "ok") {
    return (
      <div role="status" className="flex flex-col items-center gap-4 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-accent">
          <Link2 aria-hidden className="size-10 text-primary" />
        </span>
        <h1 className="text-3xl">{t("linkedTitle")}</h1>
        <p className="text-lg">{t("linkedBody")}</p>
        <Link href={homeHref} className={buttonVariants({ size: "lg", className: "w-full" })}>
          {t("continue")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl">{t("linkTitle")}</h1>
        <p className="text-muted-foreground">{t("linkSubtitle")}</p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <TextField
          label={t("code")}
          name="inviteCode"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={14}
          placeholder="ABCDE-23456"
          required
          className="h-14 text-center font-mono text-2xl tracking-[0.2em] uppercase"
        />
        <FormError state={state} />
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? t("working") : t("linkButton")}
        </Button>
      </form>

      {!action && <PreviewNote />}
    </div>
  );
}
