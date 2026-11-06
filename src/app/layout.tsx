import type { Metadata } from "next";
import { Fredoka, Inter } from "next/font/google";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { PrefsProvider } from "@/components/a11y/prefs-provider";
import { parsePrefs, prefsCookie, prefsToHtmlAttrs } from "@/lib/prefs";
import "./globals.css";

// Body text: Inter. Headings: Fredoka (rounded, friendly).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("App");

  return { title: t("name"), description: t("tagline") };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, cookieStore] = await Promise.all([getLocale(), cookies()]);
  // Applied on the server so the page never flashes the wrong theme.
  const prefs = parsePrefs(cookieStore.get(prefsCookie)?.value);

  return (
    <html
      lang={locale}
      {...prefsToHtmlAttrs(prefs)}
      className={`${inter.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <PrefsProvider initial={prefs}>{children}</PrefsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
