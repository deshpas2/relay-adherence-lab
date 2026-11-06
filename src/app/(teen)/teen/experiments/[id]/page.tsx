import { notFound } from "next/navigation";
import { ExperimentRunView } from "@/components/experiments/experiment-view";
import { getSampleExperiment } from "@/lib/fixtures/resolve";

// TODO(lane-db/lane-be): load this experiment + its experiment_days for the
// signed-in teen, and pass actions={{ logDay, decide }}.
export default async function ExperimentPage({ params }: PageProps<"/teen/experiments/[id]">) {
  const { id } = await params;
  const experiment = await getSampleExperiment();
  if (id !== experiment.id) notFound();

  return <ExperimentRunView experiment={experiment} preview={process.env.NODE_ENV !== "production"} />;
}
