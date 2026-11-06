"use client";

import { create } from "zustand";
import { setClientCookie } from "@/lib/client-cookie";
import {
  defaultPrefs,
  prefsCookie,
  prefsToHtmlAttrs,
  serializePrefs,
  type Prefs,
} from "@/lib/prefs";

function applyToPage(prefs: Prefs) {
  const root = document.documentElement;
  for (const [attr, value] of Object.entries(prefsToHtmlAttrs(prefs))) {
    if (value) root.setAttribute(attr, value);
    else root.removeAttribute(attr);
  }
  setClientCookie(prefsCookie, serializePrefs(prefs));
}

type PrefsState = {
  prefs: Prefs;
  /** Called once by PrefsProvider with the server's copy. */
  hydrate: (prefs: Prefs) => void;
  update: (patch: Partial<Prefs>) => void;
};

export const usePrefs = create<PrefsState>((set, get) => ({
  prefs: defaultPrefs,
  hydrate: (prefs) => set({ prefs }),
  update: (patch) => {
    const prefs = { ...get().prefs, ...patch };
    applyToPage(prefs);
    set({ prefs });
  },
}));

/**
 * A short buzz for alerts, if the teen has haptics on and the phone supports
 * it. Silently does nothing otherwise (e.g. iPhones, desktops).
 */
export function buzz(pattern: number | number[] = 60) {
  if (!usePrefs.getState().prefs.haptics) return;
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}
