import { getTranslations } from "next-intl/server";
import type { ExperimentView, QuestView } from "@/components/experiments/types";
import { sampleExperiment, sampleQuests } from "./experiments";

/**
 * SAMPLE DATA ONLY: fills in the sample experiment and quests with text in the
 * teen's language. Real data will come from the experiments / quests tables.
 */
export async function getSampleExperiment(): Promise<ExperimentView> {
  const t = await getTranslations("ExperimentIdeas");
  const k = sampleExperiment.ideaKey;
  return {
    ...sampleExperiment,
    title: t(`${k}.title`),
    hypothesis: t(`${k}.hypothesis`),
    armA: t(`${k}.armA`),
    armB: t(`${k}.armB`),
  };
}

export async function getSampleQuests(): Promise<QuestView[]> {
  const t = await getTranslations("Quests");
  return sampleQuests.map((q) => ({
    ...q,
    title: t(`${q.key}.title`),
    description: t(`${q.key}.description`),
  }));
}
