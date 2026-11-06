import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { PrefsProvider } from "@/components/a11y/prefs-provider";
import { Toaster } from "@/components/ui/toast";
import { Bubbles } from "@/components/game/bubbles";
import { parsePrefs, prefsCookie, prefsToHtmlAttrs } from "@/lib/prefs";
import "./globals.css";

// Midnight Clinical type: Inter for the interface, Source Serif 4 for titles.
// Both are variable fonts, so one file each covers every weight we use.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
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
      className={`${inter.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <PrefsProvider initial={prefs}>
            {children}
            <Toaster />
            <Bubbles />
          </PrefsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
