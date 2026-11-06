import type { ReactNode } from "react";
import { A11yMenu } from "@/components/a11y/a11y-menu";
import { Logo } from "@/components/shell/logo";

/** Frame for sign-in, sign-up and link: one centered card, phone-first. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-background">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-3">
        <Logo href="/sign-in" />
        <A11yMenu />
      </header>
      <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-12">
        <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">{children}</div>
      </main>
    </div>
  );
}
