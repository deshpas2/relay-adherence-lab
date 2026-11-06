// Privacy tests: each role tries to read or write what it shouldn't.
import { beforeAll, describe, expect, it } from "vitest";
import { as, createDb, createUser, type Db } from "./harness";

let db: Db;
const id = {} as Record<
  "clinician" | "teen" | "otherTeen" | "parent" | "strangerParent" | "pm" | "otherPm" | "recentDose" | "oldDose" | "experiment",
  string
>;

async function one<T>(promise: Promise<{ rows: T[] }>): Promise<T> {
  return (await promise).rows[0];
}

beforeAll(async () => {
  db = await createDb();

  id.clinician = await createUser(db, { email: "dr@test", appRole: "clinician", displayName: "Dr. Test" });
  id.teen = await createUser(db, { email: "teen@test", role: "teen", displayName: "Teen" });
  id.otherTeen = await createUser(db, { email: "other@test", role: "teen", displayName: "Other" });
  id.parent = await createUser(db, { email: "parent@test", role: "parent", displayName: "Parent" });
  id.strangerParent = await createUser(db, { email: "stranger@test", role: "parent" });

  // Enrollment is staff/seed only.
  await db.query(`insert into care_links (teen_id, clinician_id) values ($1, $2)`, [id.teen, id.clinician]);

  // Link the parent the real way: teen invites, parent redeems.
  const code = await as(db, id.teen, async (tx) =>
    (await one<{ code: string }>(tx.query(`select create_guardian_invite() as code`))).code,
  );
  // as() rolls back, so persist an invite with a known code instead.
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
  await db.query(`insert into guardian_links (teen_id, invite_code) values ($1, 'ABCD2345')`, [id.teen]);
  await db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [id.parent]);
    await tx.exec(`set local role authenticated`);
    await tx.query(`select accept_guardian_invite(' abcd2345 ')`);
  });

  const { rows: meds } = await db.query<{ id: string }>(
    `insert into medications (slug, display_name, form) values ('testmed', 'Testmed', 'tablet') returning id`,
  );
  id.pm = (await one<{ id: string }>(db.query(
    `insert into patient_medications (teen_id, medication_id, schedule) values ($1, $2, '[]') returning id`,
    [id.teen, meds[0].id],
  ))).id;
  id.otherPm = (await one<{ id: string }>(db.query(
    `insert into patient_medications (teen_id, medication_id, schedule) values ($1, $2, '[]') returning id`,
    [id.otherTeen, meds[0].id],
  ))).id;
  id.recentDose = (await one<{ id: string }>(db.query(
    `insert into dose_logs (teen_id, patient_medication_id, scheduled_at, status)
     values ($1, $2, now() - interval '2 hours', 'taken') returning id`,
    [id.teen, id.pm],
  ))).id;
  id.oldDose = (await one<{ id: string }>(db.query(
    `insert into dose_logs (teen_id, patient_medication_id, scheduled_at, status)
     values ($1, $2, now() - interval '5 days', 'taken') returning id`,
    [id.teen, id.pm],
  ))).id;
  id.experiment = (await one<{ id: string }>(db.query(
    `insert into experiments (teen_id, factor, hypothesis, arm_a, arm_b)
     values ($1, 'timing', 'h', 'a', 'b') returning id`,
    [id.teen],
  ))).id;
}, 60_000);

const count = (tx: { query: Db["query"] }, sql: string, params: unknown[] = []) =>
  tx.query<{ n: number }>(`select count(*)::int as n from (${sql}) q`, params).then((r) => r.rows[0].n);

describe("sign-up and profiles", () => {
  it("creates profiles from sign-up metadata, and game_state for teens", async () => {
    const { rows } = await db.query<{ role: string; display_name: string }>(
      `select role, display_name from profiles where id = $1`, [id.clinician],
    );
    expect(rows[0]).toEqual({ role: "clinician", display_name: "Dr. Test" });
    expect(await count(db, `select 1 from game_state where teen_id = $1`, [id.teen])).toBe(1);
    expect(await count(db, `select 1 from game_state where teen_id = $1`, [id.parent])).toBe(0);
  });

  it("falls back to the email name when no display name is given", async () => {
    const { rows } = await db.query(`select display_name from profiles where id = $1`, [id.strangerParent]);
    expect(rows[0]).toEqual({ display_name: "stranger" });
  });

  it("does not let anyone sign themselves up as a clinician", async () => {
    const userId = (await one<{ id: string }>(db.query(
      `insert into auth.users (email, raw_user_meta_data) values ('fake@test', '{"role":"clinician"}') returning id`,
    ))).id;
    expect(await count(db, `select 1 from profiles where id = $1`, [userId])).toBe(0);
    await expect(as(db, userId, (tx) =>
      tx.query(`insert into profiles (id, role, display_name) values ($1, 'clinician', 'x')`, [userId]),
    )).rejects.toThrow(/row-level security/);
    // …but a teen/parent fallback insert works.
    await as(db, userId, (tx) =>
      tx.query(`insert into profiles (id, role, display_name) values ($1, 'parent', 'x')`, [userId]),
    );
  });

  it("does not let a user change their own role", async () => {
    await expect(as(db, id.teen, (tx) =>
      tx.query(`update profiles set role = 'clinician' where id = $1`, [id.teen]),
    )).rejects.toThrow(/permission denied/);
    await as(db, id.teen, (tx) =>
      tx.query(`update profiles set display_name = 'New', a11y = '{"largeText":true}' where id = $1`, [id.teen]),
    );
  });

  it("shows profiles only along active links", async () => {
    expect(await as(db, id.clinician, (tx) => count(tx, `select id from profiles`))).toBe(2); // self + teen
    expect(await as(db, id.parent, (tx) => count(tx, `select id from profiles`))).toBe(2); // self + teen
    expect(await as(db, id.teen, (tx) => count(tx, `select id from profiles`))).toBe(3); // self + parent + clinician
    expect(await as(db, id.otherTeen, (tx) => count(tx, `select id from profiles`))).toBe(1);
    expect(await as(db, id.strangerParent, (tx) => count(tx, `select id from profiles`))).toBe(1);
  });

  it("gives anon nothing", async () => {
    await expect(as(db, null, (tx) => tx.query(`select * from profiles`))).rejects.toThrow(/permission denied/);
    await expect(as(db, null, (tx) => tx.query(`select * from v_attention_list`))).rejects.toThrow(/permission denied/);
  });
});

describe("guardian linking", () => {
  it("activated the link through the invite code", async () => {
    const { rows } = await db.query(`select status, parent_id from guardian_links where invite_code = 'ABCD2345'`);
    expect(rows[0]).toEqual({ status: "active", parent_id: id.parent });
  });

  it("rejects bad codes, wrong roles and double links", async () => {
    await expect(as(db, id.strangerParent, (tx) => tx.query(`select accept_guardian_invite('NOPE9999')`)))
      .rejects.toThrow(/invite_not_found/);
    await expect(as(db, id.teen, (tx) => tx.query(`select accept_guardian_invite('ABCD2345')`)))
      .rejects.toThrow(/only_parents_can_accept/);
    await expect(as(db, id.parent, (tx) => tx.query(`select create_guardian_invite()`)))
      .rejects.toThrow(/only_teens_can_invite/);
    await expect(as(db, id.teen, (tx) => tx.query(`select create_guardian_invite('everything')`)))
      .rejects.toThrow(/invalid_share_level/);
    await expect(as(db, id.parent, async (tx) => {
      await tx.query(`insert into guardian_links (teen_id, invite_code) values ($1, 'ZZZZ2222')`, [id.teen]);
    })).rejects.toThrow(/row-level security/);
  });

  it("stops a linked parent from linking to the same teen twice", async () => {
    await db.query(`insert into guardian_links (teen_id, invite_code) values ($1, 'TWICE234')`, [id.teen]);
    await expect(as(db, id.parent, (tx) => tx.query(`select accept_guardian_invite('TWICE234')`)))
      .rejects.toThrow(/already_linked/);
    await db.query(`delete from guardian_links where invite_code = 'TWICE234'`);
  });

  it("lets only the teen change share_level, and not the parent_id", async () => {
    await as(db, id.parent, async (tx) => {
      const r = await tx.query(`update guardian_links set share_level = 'full' where teen_id = $1`, [id.teen]);
      expect(r.affectedRows).toBe(0);
    });
    await expect(as(db, id.teen, (tx) =>
      tx.query(`update guardian_links set parent_id = $1`, [id.strangerParent]),
    )).rejects.toThrow(/permission denied/);
  });
});

// The exact calls Lane Backend's code makes (src/lib/actions/linking.ts and
// src/lib/auth/session.ts on lane-be).
describe("Lane Backend's linking and profile calls", () => {
  it("createGuardianInvite: a teen inserts a pending invite directly", async () => {
    await as(db, id.otherTeen, async (tx) => {
      await tx.query(`insert into guardian_links (teen_id, invite_code) values ($1, 'DIRECT23')`, [id.otherTeen]);
      const { rows } = await tx.query(`select status, parent_id, share_level from guardian_links where invite_code = 'DIRECT23'`);
      expect(rows[0]).toEqual({ status: "pending", parent_id: null, share_level: "confirm_only" });
    });
  });

  it("a teen can't set parent_id or status on insert, or invite for someone else", async () => {
    await expect(as(db, id.otherTeen, (tx) => tx.query(
      `insert into guardian_links (teen_id, invite_code, parent_id) values ($1, 'DIRECT24', $2)`,
      [id.otherTeen, id.strangerParent],
    ))).rejects.toThrow(/permission denied/);
    await expect(as(db, id.otherTeen, (tx) => tx.query(
      `insert into guardian_links (teen_id, invite_code, status) values ($1, 'DIRECT25', 'active')`, [id.otherTeen],
    ))).rejects.toThrow(/permission denied/);
    await expect(as(db, id.otherTeen, (tx) => tx.query(
      `insert into guardian_links (teen_id, invite_code) values ($1, 'DIRECT26')`, [id.teen],
    ))).rejects.toThrow(/row-level security/);
  });

  it("a teen can't activate an unclaimed invite, but can revoke it or change share_level", async () => {
    await db.query(`insert into guardian_links (teen_id, invite_code) values ($1, 'PEND2345')`, [id.otherTeen]);
    await expect(as(db, id.otherTeen, (tx) =>
      tx.query(`update guardian_links set status = 'active' where invite_code = 'PEND2345'`),
    )).rejects.toThrow(/row-level security/);
    await as(db, id.otherTeen, async (tx) => {
      const r1 = await tx.query(`update guardian_links set share_level = 'full' where invite_code = 'PEND2345'`);
      const r2 = await tx.query(`update guardian_links set status = 'revoked' where invite_code = 'PEND2345'`);
      expect([r1.affectedRows, r2.affectedRows]).toEqual([1, 1]);
    });
  });

  it("redeemGuardianInvite: the service-role update links the parent", async () => {
    await as(db, null, async (tx) => {
      const { rows } = await tx.query(
        `update guardian_links set parent_id = $1, status = 'active'
         where invite_code = 'PEND2345' and status = 'pending' and parent_id is null returning id`,
        [id.strangerParent],
      );
      expect(rows.length).toBe(1);
    }, "service_role");
    await db.query(`delete from guardian_links where invite_code = 'PEND2345'`);
  });

  it("ensureProfile: upsert with ignoreDuplicates is a no-op when the trigger already made the row", async () => {
    await as(db, id.parent, async (tx) => {
      await tx.query(
        `insert into profiles (id, role, display_name, locale) values ($1, 'parent', 'Changed', 'es')
         on conflict (id) do nothing`, [id.parent],
      );
      const { rows } = await tx.query(`select display_name from profiles where id = $1`, [id.parent]);
      expect(rows[0]).toEqual({ display_name: "Parent" });
    });
  });

  it("ensureProfile: creates the row when sign-up metadata had no role", async () => {
    const userId = (await one<{ id: string }>(db.query(
      `insert into auth.users (email) values ('norole@test') returning id`,
    ))).id;
    await as(db, userId, async (tx) => {
      await tx.query(
        `insert into profiles (id, role, display_name, locale) values ($1, 'teen', 'New', 'en')
         on conflict (id) do nothing`, [userId],
      );
      expect(await count(tx, `select 1 from profiles where id = $1`, [userId])).toBe(1);
    });
  });
});

describe("doses and parent confirmation", () => {
  it("lets a teen log a dose but never mark it verified", async () => {
    await as(db, id.teen, (tx) => tx.query(
      `insert into dose_logs (teen_id, patient_medication_id, scheduled_at, status) values ($1, $2, now(), 'taken')`,
      [id.teen, id.pm],
    ));
    await expect(as(db, id.teen, (tx) => tx.query(
      `insert into dose_logs (teen_id, patient_medication_id, scheduled_at, status, verified)
       values ($1, $2, now(), 'taken', true)`, [id.teen, id.pm],
    ))).rejects.toThrow(/permission denied/);
    await expect(as(db, id.teen, (tx) =>
      tx.query(`update dose_logs set verified = true where id = $1`, [id.recentDose]),
    )).rejects.toThrow(/permission denied/);
  });

  it("stops logging against someone else's meds or for someone else", async () => {
    await expect(as(db, id.teen, (tx) => tx.query(
      `insert into dose_logs (teen_id, patient_medication_id, scheduled_at, status) values ($1, $2, now(), 'taken')`,
      [id.teen, id.otherPm],
    ))).rejects.toThrow(/row-level security/);
    await expect(as(db, id.otherTeen, (tx) => tx.query(
      `insert into dose_logs (teen_id, patient_medication_id, scheduled_at, status) values ($1, $2, now(), 'taken')`,
      [id.teen, id.pm],
    ))).rejects.toThrow(/row-level security/);
  });

  it("confirm_only parent sees only the last 48 hours", async () => {
    const seen = await as(db, id.parent, (tx) => tx.query<{ id: string }>(`select id from dose_logs`));
    expect(seen.rows.map((r) => r.id)).toEqual([id.recentDose]);
  });

  it("adherence share shows the parent the full history", async () => {
    await as(db, id.teen, async (tx) => {
      await tx.query(`update guardian_links set share_level = 'adherence' where teen_id = $1`, [id.teen]);
      await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [id.parent]);
      expect(await count(tx, `select 1 from dose_logs`)).toBe(2);
      expect(await count(tx, `select 1 from experiments`)).toBe(0); // needs 'full'
    });
  });

  it("parent confirmation marks the dose verified", async () => {
    await as(db, id.parent, async (tx) => {
      await tx.query(
        `insert into parent_confirmations (dose_log_id, parent_id, confirmed) values ($1, $2, true)`,
        [id.recentDose, id.parent],
      );
      await tx.exec(`reset role`);
      const { rows } = await tx.query(`select verified from dose_logs where id = $1`, [id.recentDose]);
      expect(rows[0]).toEqual({ verified: true });
      // Changing the status afterwards drops the verification.
      await tx.query(`update dose_logs set status = 'late' where id = $1`, [id.recentDose]);
      const after = await tx.query(`select verified from dose_logs where id = $1`, [id.recentDose]);
      expect(after.rows[0]).toEqual({ verified: false });
    });
  });

  it("blocks confirmations a parent shouldn't make", async () => {
    // Too old for a confirm_only parent.
    await expect(as(db, id.parent, (tx) => tx.query(
      `insert into parent_confirmations (dose_log_id, parent_id, confirmed) values ($1, $2, true)`,
      [id.oldDose, id.parent],
    ))).rejects.toThrow(/row-level security/);
    // Not linked.
    await expect(as(db, id.strangerParent, (tx) => tx.query(
      `insert into parent_confirmations (dose_log_id, parent_id, confirmed) values ($1, $2, true)`,
      [id.recentDose, id.strangerParent],
    ))).rejects.toThrow(/row-level security/);
    // Pretending to be another parent.
    await expect(as(db, id.strangerParent, (tx) => tx.query(
      `insert into parent_confirmations (dose_log_id, parent_id, confirmed) values ($1, $2, true)`,
      [id.recentDose, id.parent],
    ))).rejects.toThrow(/row-level security/);
  });

  it("shows clinicians enrolled patients only", async () => {
    expect(await as(db, id.clinician, (tx) => count(tx, `select 1 from dose_logs`))).toBe(2);
    expect(await as(db, id.clinician, (tx) => count(tx, `select 1 from experiments`))).toBe(1);
    expect(await as(db, id.otherTeen, (tx) => count(tx, `select 1 from dose_logs`))).toBe(0);
    expect(await as(db, id.strangerParent, (tx) => count(tx, `select 1 from dose_logs`))).toBe(0);
    expect(await as(db, id.strangerParent, (tx) => count(tx, `select 1 from patient_medications`))).toBe(0);
  });

  it("does not let clinicians write teen data", async () => {
    await expect(as(db, id.clinician, (tx) => tx.query(
      `insert into dose_logs (teen_id, patient_medication_id, scheduled_at, status) values ($1, $2, now(), 'taken')`,
      [id.teen, id.pm],
    ))).rejects.toThrow(/row-level security/);
    await expect(as(db, id.clinician, (tx) =>
      tx.query(`insert into care_links (teen_id, clinician_id) values ($1, $2)`, [id.otherTeen, id.clinician]),
    )).rejects.toThrow(/permission denied/);
  });
});

describe("experiments, game, notifications, catalogs", () => {
  it("lets the teen run an experiment and log its days", async () => {
    await as(db, id.teen, async (tx) => {
      await tx.query(
        `insert into experiment_days (experiment_id, day_index, arm, status, ease) values ($1, 1, 'A', 'taken', 4)`,
        [id.experiment],
      );
      expect(await count(tx, `select 1 from experiment_days`)).toBe(1);
    });
    await expect(as(db, id.otherTeen, (tx) => tx.query(
      `insert into experiment_days (experiment_id, day_index, arm) values ($1, 2, 'B')`, [id.experiment],
    ))).rejects.toThrow(/row-level security/);
  });

  it("makes XP read-only for clients", async () => {
    expect(await as(db, id.teen, (tx) => count(tx, `select 1 from game_state`))).toBe(1);
    await expect(as(db, id.teen, (tx) => tx.query(`update game_state set xp = 99999`)))
      .rejects.toThrow(/permission denied/);
    await expect(as(db, id.teen, (tx) => tx.query(
      `insert into achievement_unlocks (teen_id, achievement_id) values ($1, gen_random_uuid())`, [id.teen],
    ))).rejects.toThrow(/permission denied/);
  });

  it("allows only the notifications each role may send", async () => {
    const send = (from: string, to: string, type: string) => as(db, from, (tx) => tx.query(
      `insert into notifications (user_id, type, title, body) values ($1, $2, 't', 'b')`, [to, type],
    ));
    await send(id.teen, id.teen, "halfway");
    await send(id.teen, id.parent, "confirm_request");
    await send(id.clinician, id.teen, "suggestion");
    await expect(send(id.teen, id.strangerParent, "confirm_request")).rejects.toThrow(/row-level security/);
    await expect(send(id.teen, id.parent, "motivational")).rejects.toThrow(/row-level security/);
    await expect(send(id.clinician, id.otherTeen, "suggestion")).rejects.toThrow(/row-level security/);
  });

  it("lets a recipient mark a notification read but not rewrite it", async () => {
    await db.query(`insert into notifications (user_id, type, title, body) values ($1, 'halfway', 't', 'b')`, [id.teen]);
    await as(db, id.teen, (tx) => tx.query(`update notifications set read = true`));
    await expect(as(db, id.teen, (tx) => tx.query(`update notifications set title = 'x'`)))
      .rejects.toThrow(/permission denied/);
    expect(await as(db, id.parent, (tx) => count(tx, `select 1 from notifications`))).toBe(0);
  });

  it("makes catalogs readable but not writable", async () => {
    expect(await as(db, id.teen, (tx) => count(tx, `select 1 from medications`))).toBeGreaterThan(0);
    await expect(as(db, id.teen, (tx) =>
      tx.query(`insert into medications (slug, display_name, form) values ('x', 'X', 'pill')`),
    )).rejects.toThrow(/permission denied/);
  });
});

describe("views respect RLS", () => {
  it("scopes the attention list to the caller's patients", async () => {
    const r = await as(db, id.clinician, (tx) =>
      tx.query<{ teen_id: string }>(`select teen_id from v_attention_list`));
    expect(r.rows.map((x) => x.teen_id)).toEqual([id.teen]);
    expect(await as(db, id.otherTeen, (tx) => count(tx, `select 1 from v_attention_list`))).toBe(1);
    expect(await as(db, id.strangerParent, (tx) => count(tx, `select 1 from v_attention_list`))).toBe(0);
  });

  it("scopes the clinic overview to the caller's patients", async () => {
    const r = await as(db, id.clinician, (tx) => tx.query(`select teens, experiments_started from v_clinic_overview`));
    expect(r.rows[0]).toEqual({ teens: 1, experiments_started: 1 });
  });
});
