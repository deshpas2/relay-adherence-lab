"use client";

import { useEffect, type ReactNode } from "react";
import type { Prefs } from "@/lib/prefs";
import { usePrefs } from "./prefs-store";

/** Hands the server's saved preferences to the client store. */
export function PrefsProvider({
  initial,
  children,
}: {
  initial: Prefs;
  children: ReactNode;
}) {
  const hydrate = usePrefs((s) => s.hydrate);
  useEffect(() => hydrate(initial), [hydrate, initial]);
  return children;
}
