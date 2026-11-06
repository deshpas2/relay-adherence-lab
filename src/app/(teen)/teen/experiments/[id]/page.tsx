import { notFound } from "next/navigation";
import { ExperimentRunView } from "@/components/experiments/experiment-view";
import { getSampleExperiment } from "@/lib/fixtures/resolve";

// TODO(lane-db/lane-be): load this experiment + its experiment_days for the
// signed-in teen, and pass actions={{ logDay, decide }}.
// SAMPLE: the rest of the 14 days, so ?done=1 (from the "test is done"
// notification) shows a finished test. Option B wins clearly.
const FINISH = [
  { status: "taken", ease: 3 }, { status: "taken", ease: 4 }, { status: "missed", ease: 2 }, { status: "taken", ease: 5 },
  { status: "late", ease: 3 }, { status: "taken", ease: 4 }, { status: "taken", ease: 3 }, { status: "taken", ease: 5 },
] as const;

export default async function ExperimentPage({ params, searchParams }: PageProps<"/teen/experiments/[id]">) {
  const [{ id }, { done }] = await Promise.all([params, searchParams]);
  const experiment = await getSampleExperiment();
  if (id !== experiment.id) notFound();

  const finished = done === "1";
  if (finished) {
    let k = 0;
    experiment.days = experiment.days.map((d) => (d.status === null ? { ...d, ...FINISH[k++ % FINISH.length] } : d));
    experiment.today = experiment.days.length;
  }

  return (
    <ExperimentRunView
      key={finished ? "done" : "running"}
      experiment={experiment}
      preview={process.env.NODE_ENV !== "production"}
      celebrate={finished}
    />
  );
}
