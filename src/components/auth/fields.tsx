"use client";

import { useId, type ComponentProps } from "react";
import { CircleAlert, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { FormState } from "./form-state";

type TextFieldProps = ComponentProps<"input"> & {
  label: string;
  hint?: string;
};

/** A labelled text input, 48px tall. */
export function TextField({ label, hint, className, ...props }: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={hint ? hintId : undefined}
        className={cn(
          "h-12 w-full rounded-xl border-2 border-input bg-card px-4 text-base outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring",
          className,
        )}
        {...props}
      />
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Shows the error for a failed action, read out by screen readers. */
export function FormError({ state }: { state: FormState }) {
  const t = useTranslations("ActionErrors");
  if (state.status !== "error") return null;
  const message = t.has(state.code) ? t(state.code) : t("failed");
  return <ErrorBox message={message} />;
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-xl border-2 border-destructive/40 bg-destructive/5 p-3 text-sm font-medium"
    >
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-destructive" />
      {message}
    </p>
  );
}

/** Small note shown while a form isn't connected to the real sign-in yet. */
export function PreviewNote() {
  const t = useTranslations("Auth");
  return (
    <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
      <Info aria-hidden className="size-3.5" />
      {t("preview")}
    </p>
  );
}
