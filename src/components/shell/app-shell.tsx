import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { A11yMenu } from "@/components/a11y/a11y-menu";
import { ROLE_HOME, type AppRole } from "@/lib/routes";
import { HtmlAppAttr } from "./html-app-attr";
import { Logo } from "./logo";
import { NAV_ITEMS } from "./nav-items";
import { ShellNavLinks } from "./nav-link";

const APP_ATTR: Record<AppRole, string> = {
  teen: "teen",
  parent: "parent",
  clinician: "clinic",
};

/**
 * The frame around every signed-in page (Section 5).
 * Teen + parent: phone-first, top bar + bottom tab bar.
 * Clinician: desktop-first, side bar (top tabs on small screens).
 */
export function AppShell({ role, children }: { role: AppRole; children: ReactNode }) {
  const t = useTranslations("Nav");
  const items = NAV_ITEMS[role];
  const labels = Object.fromEntries(items.map((i) => [i.labelKey, t(i.labelKey)]));
  const home = ROLE_HOME[role];
  const app = APP_ATTR[role];

  const skipLink = (
    <a
      href="#main"
      className="sr-only z-50 rounded-xl bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      {t("skip")}
    </a>
  );

  if (role === "clinician") {
    return (
      <div data-app={app} className="flex min-h-dvh flex-1 bg-background text-foreground">
        <HtmlAppAttr app={app} />
        {skipLink}

        {/* Side bar on bigger screens */}
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r bg-card p-4 md:flex">
          <Logo href={home} />
          <nav aria-label={t("label")} className="flex flex-1 flex-col gap-1">
            <ShellNavLinks role={role} labels={labels} variant="row" />
          </nav>
          <A11yMenu />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar on small screens */}
          <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 flex flex-col gap-2 border-b bg-card/95 px-4 py-2 backdrop-blur md:hidden">
            <div className="flex items-center justify-between">
              <Logo href={home} />
              <A11yMenu />
            </div>
            <nav aria-label={t("label")} className="-mx-1 flex gap-1 overflow-x-auto">
              <ShellNavLinks role={role} labels={labels} variant="row" />
            </nav>
          </header>

          <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div data-app={app} className="flex min-h-dvh flex-1 flex-col bg-background text-foreground">
      <HtmlAppAttr app={app} />
      {skipLink}

      <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between px-4 py-2">
          <Logo href={home} />
          <A11yMenu />
        </div>
      </header>

      {/* Bottom padding keeps content clear of the tab bar. */}
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-lg flex-1 px-4 pt-5 pb-32">
        {children}
      </main>

      <nav
        aria-label={t("label")}
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur"
      >
        <div
          className="mx-auto grid w-full max-w-lg px-2 py-1"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          <ShellNavLinks role={role} labels={labels} variant="tab" />
        </div>
      </nav>
    </div>
  );
}
