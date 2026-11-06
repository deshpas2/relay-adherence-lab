import type { ExperimentDay } from "@/lib/engine/experiment";
import type { Arm, DoseStatus } from "@/lib/engine/types";
import type { BarrierKey } from "@/components/onboarding/types";

/** experiments.factor. Timing is left out on purpose: dose times are the care team's. */
export type Factor = "place" | "cue" | "who" | "style";

export type ExperimentStatus = "active" | "done" | "abandoned";
export type ExperimentDecision = "adopted" | "rerun" | "dropped";

export type ExperimentDayRow = ExperimentDay & {
  /** experiment_days.day_index, 1..days */
  dayIndex: number;
};

/** One experiment, ready to draw. Text is already in the teen's language. */
export type ExperimentView = {
  id: string;
  title: string;
  factor: Factor;
  hypothesis: string;
  armA: string;
  armB: string;
  status: ExperimentStatus;
  decision: ExperimentDecision | null;
  /** Which day is today, 1..days. */
  today: number;
  days: ExperimentDayRow[];
};

/** A ready-made idea from the library, tied to a barrier. */
export type IdeaTemplate = {
  /** Text lives under ExperimentIdeas.<key> in the messages files. */
  key: string;
  barrier: BarrierKey;
  factor: Factor;
};

export type QuestView = {
  key: string;
  title: string;
  description: string;
  xpReward: number;
  /** 0..1 */
  progress: number;
  status: "available" | "active" | "complete";
};

export type { Arm, DoseStatus };
