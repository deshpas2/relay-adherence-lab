import Link from "next/link";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ExperimentCard } from "@/components/experiments/experiment-card";
import { QuestCard } from "@/components/experiments/quest-card";
import { buttonVariants } from "@/components/ui/button";
import { getSampleExperiment, getSampleQuests } from "@/lib/fixtures/resolve";

// TODO(lane-db/lane-be): load the teen's experiments and quest_progress.
export default async function QuestsPage() {
  const t = await getTranslations("Experiments");
  const [experiment, quests] = await Promise.all([getSampleExperiment(), getSampleQuests()]);
  const active = experiment.status === "active" ? experiment : null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl">{t("pageTitle")}</h1>

      <section aria-labelledby="active" className="flex flex-col gap-3">
        <h2 id="active" className="text-xl">{t("activeHeading")}</h2>
        {active ? (
          <ExperimentCard experiment={active} />
        ) : (
          <p className="rounded-2xl border border-dashed p-5 text-center text-muted-foreground">{t("noActive")}</p>
        )}
        <Link href="/teen/experiments/new" className={buttonVariants({ variant: active ? "outline" : "default", size: "lg", className: "w-full" })}>
          <Plus aria-hidden /> {t("newTest")}
        </Link>
      </section>

      <section aria-labelledby="quests" className="flex flex-col gap-3">
        <h2 id="quests" className="text-xl">{t("questsHeading")}</h2>
        <ul className="flex flex-col gap-3">
          {quests.map((q) => (
            <QuestCard key={q.key} quest={q} />
          ))}
        </ul>
      </section>

      <p className="text-center text-xs text-muted-foreground">{t("sampleData")}</p>
    </div>
  );
}
