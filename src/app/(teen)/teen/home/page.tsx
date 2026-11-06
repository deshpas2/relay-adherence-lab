import { getTranslations } from "next-intl/server";
import { HomeView } from "@/components/teen/home-view";
import { QuestTeaser } from "@/components/teen/quest-teaser";
import { WelcomeBack } from "@/components/reengage/welcome-back";
import { SAMPLE_NURSE } from "@/lib/fixtures/clinic";
import { sampleTeenHome } from "@/lib/fixtures/teen-home";

// TODO(lane-db/lane-be): load the signed-in teen's slots, XP and active
// experiment instead of sample data, and pass logSlot={...} to HomeView.
// Demo: /teen/home?quiet=15 shows what a teen sees coming back after 15 quiet days.
export default async function TeenHomePage({ searchParams }: PageProps<"/teen/home">) {
  const { quiet } = await searchParams;
  const daysQuiet = Number(typeof quiet === "string" ? quiet : 0) || 0;
  const t = await getTranslations("TeenHome");
  const data = sampleTeenHome;

  return (
    <div className="flex flex-col gap-6">
      {daysQuiet >= 3 && <WelcomeBack name={data.displayName} nurse={SAMPLE_NURSE} daysQuiet={daysQuiet} />}
      <HomeView data={data} />
      {data.quest && <QuestTeaser quest={data.quest} />}
      <p className="text-center text-xs text-muted-foreground">{t("sampleData")}</p>
    </div>
  );
}
