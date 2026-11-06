import { describe, expect, it } from "vitest";
import { resolveLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import es from "@/messages/es.json";

function keys(value: object, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, child]) =>
    typeof child === "object" && child !== null
      ? keys(child, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe("messages", () => {
  it("has the same keys in every locale", () => {
    expect(keys(es).sort()).toEqual(keys(en).sort());
  });
});

describe("resolveLocale", () => {
  it("prefers the saved locale over the browser", () => {
    expect(resolveLocale("es", "en-US,en;q=0.9")).toBe("es");
  });

  it("ignores an unsupported saved locale", () => {
    expect(resolveLocale("fr", "es-MX")).toBe("es");
  });

  it("respects Accept-Language quality order", () => {
    expect(resolveLocale(undefined, "en;q=0.5,es;q=0.9")).toBe("es");
  });

  it("skips unsupported languages", () => {
    expect(resolveLocale(undefined, "fr-FR,es;q=0.8")).toBe("es");
  });

  it("falls back to English", () => {
    expect(resolveLocale(undefined, null)).toBe("en");
    expect(resolveLocale(undefined, "de")).toBe("en");
  });
});
