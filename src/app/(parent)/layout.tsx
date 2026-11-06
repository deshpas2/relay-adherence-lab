import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";

export default function Layout({ children }: { children: ReactNode }) {
  return <AppShell role="parent">{children}</AppShell>;
}
