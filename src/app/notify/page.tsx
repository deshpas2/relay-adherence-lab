import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { NotifyLab } from "@/components/personal/notify-lab";
import { BirthdayDemo } from "@/components/sharing/birthday-demo";
import { getTeenSharing } from "@/lib/sharing/state";

// Demo remote for live notifications. Sends to phones that turned them on in
// the teen app's Me tab. Not linked from the teen or clinic apps.
export default async function NotifyPage() {
  const [t, sharing] = await Promise.all([getTranslations("NotifyLab"), getTeenSharing()]);
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <Link href="/" className="inline-flex min-h-11 items-center gap-2 self-start font-semibold text-primary">
        <ArrowLeft aria-hidden className="size-4" /> Relay
      </Link>
      <div>
        <h1 className="text-3xl">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        <p className="mt-3 rounded-xl bg-muted p-3 text-sm">{t("setup")}</p>
      </div>
      <NotifyLab />
      <BirthdayDemo age={sharing.age} mode={sharing.mode} />
    </main>
  );
}
