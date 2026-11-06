import { EyeOff, Hourglass } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SharingMode } from "@/lib/engine/consent";

/** What a caregiver sees when the (adult) patient isn't sharing. No data at all. */
export function ParentPrivate({ name, mode }: { name: string; mode: SharingMode }) {
  const t = useTranslations("Adult");
  const waiting = mode === "adult_needs_consent";
  const Icon = waiting ? Hourglass : EyeOff;
  return (
    <section role="status" className="flex flex-col items-center gap-3 rounded-3xl border bg-card px-6 py-10 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon aria-hidden className="size-8" />
      </span>
      <h1 className="text-2xl">{waiting ? t("waitingTitle", { name }) : t("privateTitle", { name })}</h1>
      <p className="max-w-[38ch] text-muted-foreground">{waiting ? t("waitingBody", { name }) : t("privateBody", { name })}</p>
      {!waiting && <p className="max-w-[38ch] text-sm text-muted-foreground">{t("privateNote", { name })}</p>}
    </section>
  );
}
