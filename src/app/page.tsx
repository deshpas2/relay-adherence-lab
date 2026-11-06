import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("App");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-3xl font-semibold">{t("name")}</h1>
      <p className="text-muted-foreground">{t("tagline")}</p>
    </main>
  );
}
