import { describe, expect, it } from "vitest";
import {
  defaultPrefs,
  parsePrefs,
  prefsToHtmlAttrs,
  serializePrefs,
} from "@/lib/prefs";

describe("parsePrefs", () => {
  it("round-trips through the cookie format", () => {
    const prefs = { ...defaultPrefs, theme: "dark" as const, largeText: true };
    expect(parsePrefs(serializePrefs(prefs))).toEqual(prefs);
  });

  it("falls back to defaults for a missing or broken cookie", () => {
    expect(parsePrefs(undefined)).toEqual(defaultPrefs);
    expect(parsePrefs("not json")).toEqual(defaultPrefs);
    expect(parsePrefs(encodeURIComponent("null"))).toEqual(defaultPrefs);
  });

  it("ignores bad values field by field", () => {
    const raw = encodeURIComponent(
      JSON.stringify({ theme: "purple", highContrast: "yes", haptics: false }),
    );
    expect(parsePrefs(raw)).toEqual({ ...defaultPrefs, haptics: false });
  });
});

describe("prefsToHtmlAttrs", () => {
  it("sets nothing for the defaults", () => {
    expect(Object.values(prefsToHtmlAttrs(defaultPrefs)).filter(Boolean)).toEqual([]);
  });

  it("maps each setting to the attribute tokens.css expects", () => {
    expect(
      prefsToHtmlAttrs({
        theme: "light",
        highContrast: true,
        largeText: true,
        reduceMotion: true,
        haptics: true,
      }),
    ).toEqual({
      "data-theme": "light",
      "data-contrast": "high",
      "data-text": "large",
      "data-motion": "reduce",
    });
  });
});
