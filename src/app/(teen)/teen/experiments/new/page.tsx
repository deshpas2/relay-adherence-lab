import { ExperimentDesigner } from "@/components/experiments/designer";
import { ideaLibrary, sampleBarriers } from "@/lib/fixtures/experiments";

// TODO(lane-db/lane-be): ideas from the seeded library, the teen's barriers
// from teen_barriers, and pass start={startExperiment}.
// ?suggested=<idea key> comes from the care team's suggestion notification.
export default async function NewExperimentPage({ searchParams }: PageProps<"/teen/experiments/new">) {
  const { suggested } = await searchParams;
  const pick = ideaLibrary.find((i) => i.key === suggested) ?? null;
  const mine: readonly string[] = sampleBarriers;
  const forYou = ideaLibrary.filter((i) => mine.includes(i.barrier));
  const more = ideaLibrary.filter((i) => !mine.includes(i.barrier));
  return <ExperimentDesigner key={pick?.key ?? "none"} forYou={forYou} more={more} suggested={pick} />;
}
