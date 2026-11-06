import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EnrollForm } from "@/components/clinic/enroll-form";

export default async function EnrollPage() {
  const t = await getTranslations("Enroll");
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <Link href="/clinic/home" className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-bold text-blue">
        <ArrowLeft aria-hidden className="size-4" /> {t("back")}
      </Link>
      <header>
        <h1 className="text-2xl">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      <EnrollForm />
    </div>
  );
}
