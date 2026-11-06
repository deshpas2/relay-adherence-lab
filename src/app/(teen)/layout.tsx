import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { getTeenSharing } from "@/lib/sharing/state";

export default async function Layout({ children }: { children: ReactNode }) {
  // At 18+, the new terms come first, before any other screen.
  if ((await getTeenSharing()).mode === "adult_needs_consent") redirect("/teen/turning-18");
  return <AppShell role="teen">{children}</AppShell>;
}
