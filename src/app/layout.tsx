import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { PrefsProvider } from "@/components/a11y/prefs-provider";
import { Toaster } from "@/components/ui/toast";
import { parsePrefs, prefsCookie, prefsToHtmlAttrs } from "@/lib/prefs";
import "./globals.css";

// Body text: Manrope. Headings: Sora. Same pairing as the demo prototype.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
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
      className={`${manrope.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <PrefsProvider initial={prefs}>
            {children}
            <Toaster />
          </PrefsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
