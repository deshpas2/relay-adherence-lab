import { ExperimentDesigner } from "@/components/experiments/designer";
import { ideaLibrary, sampleBarriers } from "@/lib/fixtures/experiments";

// TODO(lane-db/lane-be): ideas from the seeded library, the teen's barriers
// from teen_barriers, and pass start={startExperiment}.
export default function NewExperimentPage() {
  const mine: readonly string[] = sampleBarriers;
  const forYou = ideaLibrary.filter((i) => mine.includes(i.barrier));
  const more = ideaLibrary.filter((i) => !mine.includes(i.barrier));
  return <ExperimentDesigner forYou={forYou} more={more} />;
}
