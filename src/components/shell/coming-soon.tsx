import { useTranslations } from "next-intl";
import { Construction } from "lucide-react";
import { Card, CardDescription } from "@/components/ui/card";

/** Stand-in for a screen that a later step builds. */
export function ComingSoon({ titleKey }: { titleKey: string }) {
  const t = useTranslations("Nav");
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl">{t(titleKey)}</h1>
      <Card className="flex items-center gap-4">
        <Construction aria-hidden className="size-8 shrink-0 text-primary" />
        <CardDescription>{t("comingSoon")}</CardDescription>
      </Card>
    </div>
  );
}
