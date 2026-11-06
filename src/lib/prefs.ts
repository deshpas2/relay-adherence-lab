/**
 * Display + accessibility preferences (Section 5).
 *
 * Saved in a cookie so the server can put the right attributes on <html>
 * before the page paints (no flash of the wrong theme). The a11y fields
 * match the shape of profiles.a11y, so Lane Backend can also save them to
 * the profile once accounts exist.
 */

export const prefsCookie = "relay_prefs";

export type ThemeChoice = "system" | "light" | "dark";

export type Prefs = {
  theme: ThemeChoice;
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  haptics: boolean;
};

export const defaultPrefs: Prefs = {
  theme: "system",
  highContrast: false,
  largeText: false,
  reduceMotion: false,
  haptics: true,
};

/** Reads the cookie value. Anything missing or broken falls back to defaults. */
export function parsePrefs(raw: string | undefined): Prefs {
  if (!raw) return defaultPrefs;
  let data: unknown;
  try {
    data = JSON.parse(decodeURIComponent(raw));
  } catch {
    return defaultPrefs;
  }
  if (typeof data !== "object" || data === null) return defaultPrefs;
  const d = data as Record<string, unknown>;
  const bool = (key: keyof Prefs) =>
    typeof d[key] === "boolean" ? (d[key] as boolean) : defaultPrefs[key];

  return {
    theme:
      d.theme === "light" || d.theme === "dark" ? d.theme : defaultPrefs.theme,
    highContrast: bool("highContrast") as boolean,
    largeText: bool("largeText") as boolean,
    reduceMotion: bool("reduceMotion") as boolean,
    haptics: bool("haptics") as boolean,
  };
}

export function serializePrefs(prefs: Prefs): string {
  return encodeURIComponent(JSON.stringify(prefs));
}

/** The data-* attributes for <html>. Matches the selectors in tokens.css. */
export function prefsToHtmlAttrs(prefs: Prefs): Record<string, string | undefined> {
  return {
    "data-theme": prefs.theme === "system" ? undefined : prefs.theme,
    "data-contrast": prefs.highContrast ? "high" : undefined,
    "data-text": prefs.largeText ? "large" : undefined,
    "data-motion": prefs.reduceMotion ? "reduce" : undefined,
  };
}
