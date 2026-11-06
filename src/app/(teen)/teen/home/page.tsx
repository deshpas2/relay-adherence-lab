import { useTranslations } from "next-intl";
import { HomeView } from "@/components/teen/home-view";
import { QuestTeaser } from "@/components/teen/quest-teaser";
import { sampleTeenHome } from "@/lib/fixtures/teen-home";

// TODO(lane-db/lane-be): load the signed-in teen's slots, XP and active
// experiment instead of sample data, and pass logSlot={...} to HomeView.
export default function TeenHomePage() {
  const t = useTranslations("TeenHome");
  const data = sampleTeenHome;

  return (
    <div className="flex flex-col gap-6">
      <HomeView data={data} />
      {data.quest && <QuestTeaser quest={data.quest} />}
      <p className="text-center text-xs text-muted-foreground">{t("sampleData")}</p>
    </div>
  );
}
