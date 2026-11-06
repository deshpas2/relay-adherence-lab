export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const localeCookie = "NEXT_LOCALE";

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Picks a locale: the saved choice first, then the browser's Accept-Language
 * order (quality values respected), then the default.
 */
export function resolveLocale(
  saved: string | undefined,
  acceptLanguage: string | null,
): Locale {
  if (saved && isLocale(saved)) return saved;

  const preferred = (acceptLanguage ?? "")
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      const quality = q ? Number(q.trim().slice(2)) : 1;
      return {
        language: tag.split("-")[0].toLowerCase(),
        quality: Number.isNaN(quality) ? 0 : quality,
      };
    })
    .filter((entry) => entry.language && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { language } of preferred) {
    if (isLocale(language)) return language;
  }
  return defaultLocale;
}
