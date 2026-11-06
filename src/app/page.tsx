import Link from "next/link";
import { ChevronRight, HeartHandshake, Sparkles, Stethoscope } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ThemeToggle } from "@/components/a11y/theme-toggle";
import { Logo } from "@/components/shell/logo";

// Demo start page: one way into each role. TODO(backend): once sign-in is
// connected, the proxy sends signed-in users straight to their own home.
const ROLES = [
  { key: "teen", href: "/teen/onboarding", icon: Sparkles },
  { key: "parent", href: "/parent/home", icon: HeartHandshake },
  { key: "clinic", href: "/clinic/home", icon: Stethoscope },
] as const;

export default async function StartPage() {
  const t = await getTranslations("Start");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-10 px-4 py-12">
      <div className="flex items-center justify-between">
        <Logo href="/" />
        <ThemeToggle />
      </div>
      <div className="flex flex-col gap-4">
        <span className="text-xs font-bold tracking-[0.14em] text-primary uppercase">{t("eyebrow")}</span>
        <h1 className="text-3xl leading-tight text-balance sm:text-4xl">{t("headline")}</h1>
        <p className="max-w-[58ch] text-lg text-muted-foreground">{t("body")}</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {ROLES.map(({ key, href, icon: Icon }) => (
          <li key={key}>
            <Link
              href={href}
              className="flex h-full flex-col gap-3 rounded-lg border bg-card p-5 transition-colors hover:border-cyan-strong"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-accent text-primary">
                <Icon aria-hidden className="size-5" />
              </span>
              <span className="text-lg font-bold">{t(`${key}Title`)}</span>
              <span className="flex-1 text-sm text-muted-foreground">{t(`${key}Body`)}</span>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-primary">
                {t("open")} <ChevronRight aria-hidden className="size-4" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">{t("note")}</p>
    </main>
  );
}
