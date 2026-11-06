import type { ReactNode } from "react";
import { A11yMenu } from "@/components/a11y/a11y-menu";
import { ThemeToggle } from "@/components/a11y/theme-toggle";
import { Logo } from "@/components/shell/logo";
import { ROLE_HOME } from "@/lib/routes";

/**
 * Full-screen frame for teen onboarding: no tab bar, so the teen can focus.
 * TODO(lane-be merge): call requireRole("teen") here, like the (teen) layout.
 */
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div data-app="teen" className="flex min-h-dvh flex-1 flex-col bg-background">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-3">
        <Logo href={ROLE_HOME.teen} />
        <div className="flex items-center gap-2"><ThemeToggle /><A11yMenu /></div>
      </header>
      <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-2 pb-8">
        {children}
      </main>
    </div>
  );
}
