// The clinician views compute the right numbers.
import { beforeAll, describe, expect, it } from "vitest";
import { createDb, createUser, type Db } from "./harness";

let db: Db;
const teen: Record<"winner" | "close" | "quiet" | "dropping", string> = {} as never;

async function pm(teenId: string): Promise<string> {
  const { rows } = await db.query<{ id: string }>(
    `insert into patient_medications (teen_id, medication_id, schedule)
     select $1, id, '[]' from medications where slug = 'tacrolimus' returning id`, [teenId]);
  return rows[0].id;
}

/** 14 days, alternating A/B; `taken(arm, i)` decides each day's status. */
async function experiment(teenId: string, decision: string | null, taken: (arm: "A" | "B", i: number) => boolean) {
  const { rows } = await db.query<{ id: string }>(
    `insert into experiments (teen_id, factor, hypothesis, arm_a, arm_b, status, decision, started_at)
     values ($1, 'timing', 'h', 'a', 'b', 'done', $2, now() - interval '20 days') returning id`,
    [teenId, decision]);
  for (let i = 1; i <= 14; i++) {
    const arm = i % 2 ? "A" : "B";
    await db.query(
      `insert into experiment_days (experiment_id, day_index, arm, status, ease) values ($1, $2, $3, $4, $5)`,
      [rows[0].id, i, arm, taken(arm, i) ? "taken" : "late", arm === "A" ? 2 : 4]);
  }
}

async function doses(teenId: string, daysAgo: number[], status: (d: number) => string) {
  const pmId = await pm(teenId);
  for (const d of daysAgo) {
    await db.query(
      `insert into dose_logs (teen_id, patient_medication_id, scheduled_at, status, logged_at)
       values ($1, $2, now() - make_interval(days => $3), $4, now() - make_interval(days => $3))`,
      [teenId, pmId, d, status(d)]);
  }
}

beforeAll(async () => {
  db = await createDb();
  for (const k of Object.keys({ winner: 0, close: 0, quiet: 0, dropping: 0 }) as (keyof typeof teen)[]) {
    teen[k] = await createUser(db, { email: `${k}@test`, role: "teen", displayName: k });
  }

  // B on time every day, A on time 3 of 7 → lift 4/7 ≈ 0.571, adopted.
  await experiment(teen.winner, "adopted", (arm, i) => arm === "B" || i <= 5);
  await doses(teen.winner, [0, 1, 2], () => "taken");
  // Same in both arms → too close to call.
  await experiment(teen.close, "rerun", () => true);
  await doses(teen.close, [0, 1], () => "taken");
  // Last log 5 days ago.
  await doses(teen.quiet, [5, 6], () => "taken");
  // On time all of the week before, late all of this week.
  await doses(teen.dropping, [0, 1, 2, 3, 8, 9, 10, 11], (d) => (d >= 7 ? "taken" : "late"));
}, 60_000);

describe("v_experiment_results", () => {
  it("computes per-arm on-time, ease and lift", async () => {
    const { rows } = await db.query(
      `select a_days, b_days, a_on_time, b_on_time, a_ease, b_ease, lift
       from v_experiment_results where teen_id = $1`, [teen.winner]);
    expect(rows[0]).toEqual({
      a_days: 7, b_days: 7, a_on_time: "0.429", b_on_time: "1.000",
      a_ease: "2.00", b_ease: "4.00", lift: "0.571",
    });
  });
});

describe("v_strategy_leaderboard", () => {
  it("counts tries, adoption and improvement per strategy", async () => {
    const { rows } = await db.query(`select * from v_strategy_leaderboard`);
    expect(rows).toEqual([
      { strategy: "timing", teens_tried: 2, pct_adopted: "50", avg_improvement_pts: "57" },
    ]);
  });
});

describe("v_attention_list", () => {
  it("flags the right teens for the right reasons", async () => {
    const { rows } = await db.query<{ display_name: string; reasons: string[]; needs_attention: boolean }>(
      `select display_name, reasons, needs_attention from v_attention_list order by display_name`);
    expect(rows).toEqual([
      { display_name: "close", reasons: ["too_close"], needs_attention: true },
      { display_name: "dropping", reasons: ["dropping"], needs_attention: true },
      { display_name: "quiet", reasons: ["not_logging"], needs_attention: true },
      { display_name: "winner", reasons: [], needs_attention: false },
    ]);
  });
});

describe("v_daily_adherence", () => {
  it("separates self-reported from parent-verified doses", async () => {
    await db.query(`update dose_logs set verified = true
                    where teen_id = $1 and scheduled_at > now() - interval '12 hours'`, [teen.winner]);
    const { rows } = await db.query(
      `select sum(self_reported_taken)::int as self, sum(verified_taken)::int as verified
       from v_daily_adherence where teen_id = $1`, [teen.winner]);
    expect(rows[0]).toEqual({ self: 3, verified: 1 });
  });
});

describe("v_clinic_overview", () => {
  it("summarizes the clinic", async () => {
    const { rows } = await db.query(
      `select teens, experiments_started, experiments_finished, self_managing from v_clinic_overview`);
    expect(rows[0]).toEqual({ teens: 4, experiments_started: 2, experiments_finished: 2, self_managing: 1 });
  });
});
