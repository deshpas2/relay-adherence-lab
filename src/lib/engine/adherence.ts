import type { DoseStatus } from "./types";

export type DoseRecord = { status: DoseStatus; verified: boolean };

export type AttentionReason = "stopped_logging" | "dropping" | "too_close";

const stoppedLoggingDays = 3;
const droppingThreshold = 0.15;
const dayMs = 24 * 60 * 60 * 1000;
/** Stops float error from hiding a drop of exactly the threshold. */
const floatTolerance = 1e-9;

const isTaken = (dose: DoseRecord) =>
  dose.status === "taken" || dose.status === "late";

/**
 * Rates are shares of all logged doses, or null with nothing to measure.
 * Verified is a parent's confirmation, so it is never merged with self-report.
 */
export function computeAdherence(doses: DoseRecord[]) {
  const total = doses.length;
  const rate = (count: number) => (total === 0 ? null : count / total);

  return {
    total,
    onTimeRate: rate(doses.filter((dose) => dose.status === "taken").length),
    selfReportedRate: rate(doses.filter(isTaken).length),
    verifiedRate: rate(
      doses.filter((dose) => isTaken(dose) && dose.verified).length,
    ),
  };
}

/** Why a teen might need a kind check-in from the care team. */
export function attentionReasons(input: {
  now: Date;
  lastLogAt: Date | null;
  recentOnTimeRate: number | null;
  previousOnTimeRate: number | null;
  tooCloseExperiments: number;
}): AttentionReason[] {
  const reasons: AttentionReason[] = [];

  const quietMs = input.lastLogAt
    ? input.now.getTime() - input.lastLogAt.getTime()
    : Infinity;
  if (quietMs >= stoppedLoggingDays * dayMs) reasons.push("stopped_logging");

  const { recentOnTimeRate: recent, previousOnTimeRate: previous } = input;
  if (
    recent !== null &&
    previous !== null &&
    previous - recent >= droppingThreshold - floatTolerance
  ) {
    reasons.push("dropping");
  }

  if (input.tooCloseExperiments > 0) reasons.push("too_close");

  return reasons;
}
