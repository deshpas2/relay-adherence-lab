// Demo accounts + a coherent demo story (BUILD_GUIDE.md Section 9).
//
//   npm run db:seed:demo
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
// and the migrations pushed. Safe to re-run: it deletes every user on the
// demo domain first (which cascades to all their data) and rebuilds.
// Only touches accounts ending in @demo.relay.test. All data is simulated.
//
// Story (relative to today):
//   Maya  — halfway through a 14-day timing experiment; B is ahead.
//   Leo   — finished a cue experiment, adopted it, on time since.
//   Sam   — stopped logging 5 days ago, on-time rate was dropping.
//   Ava   — onboarded yesterday; parent invite not yet redeemed.
//   Noah  — finished an experiment that was too close to call (rerun).
// Every teen is enrolled with Dr. Rivera and has a parent account.
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../src/lib/types/database.ts";

export const DEMO_DOMAIN = "demo.relay.test";
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "relay-demo-2026";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Deterministic randomness so every run tells the same story.
let seed = 20261105;
function rand(): number {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const DAY = 86_400_000;
const now = Date.now();
const today = new Date(now);
today.setUTCHours(0, 0, 0, 0);
const dayStart = (daysAgo: number) => new Date(today.getTime() - daysAgo * DAY);
const iso = (d: Date) => d.toISOString();
// Demo clock times are local to this UTC offset (default US Eastern, -5).
const TZ_OFFSET_H = Number(process.env.DEMO_TZ_OFFSET_HOURS ?? -5);
const at = (daysAgo: number, hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(dayStart(daysAgo).getTime() + ((h - TZ_OFFSET_H) * 60 + m) * 60_000);
};

/** Unwrap a Supabase response: throw on error, else return the success data. */
function check<R extends { data: unknown; error: { message: string } | null }>(
  label: string,
  response: R,
): Extract<R, { error: null }>["data"] {
  if (response.error) throw new Error(`${label}: ${response.error.message}`);
  return response.data;
}

// ---------------------------------------------------------------------------
// 1. Remove the previous demo users (cascades to all their rows).
// ---------------------------------------------------------------------------

async function deleteDemoUsers() {
  let page = 1;
  const ids: string[] = [];
  for (;;) {
    const { users } = check("listUsers", await admin.auth.admin.listUsers({ page, perPage: 1000 }));
    ids.push(...users.filter((u) => u.email?.endsWith(`@${DEMO_DOMAIN}`)).map((u) => u.id));
    if (users.length < 1000) break;
    page++;
  }
  for (const id of ids) check("deleteUser", await admin.auth.admin.deleteUser(id));
  return ids.length;
}

// ---------------------------------------------------------------------------
// 2. Accounts
// ---------------------------------------------------------------------------

type Person = { key: string; email: string; name: string; role: "teen" | "parent" | "clinician" };

async function createPerson(p: Omit<Person, "email">): Promise<string> {
  const email = `${p.key}@${DEMO_DOMAIN}`;
  const { user } = check(
    `createUser ${email}`,
    await admin.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { role: p.role === "clinician" ? undefined : p.role, display_name: p.name, locale: "en" },
      app_metadata: p.role === "clinician" ? { role: "clinician" } : {},
    }),
  );
  return user!.id;
}

// ---------------------------------------------------------------------------
// 3. Story builders
// ---------------------------------------------------------------------------

type Ids = { catalog: { meds: Record<string, string>; barriers: Record<string, string>; quests: Record<string, string>; achievements: Record<string, string> } };

async function loadCatalog(): Promise<Ids["catalog"]> {
  const byKey = <T extends { id: string }>(rows: T[], key: (r: T) => string) =>
    Object.fromEntries(rows.map((r) => [key(r), r.id]));
  const meds = check("medications", await admin.from("medications").select("id, slug"));
  const barriers = check("barriers", await admin.from("barriers").select("id, key"));
  const quests = check("quests", await admin.from("quests").select("id, key"));
  const achievements = check("achievements", await admin.from("achievements").select("id, key"));
  if (!meds?.length || !barriers?.length) {
    throw new Error("Catalog is empty. Push the migrations first: npm run db:push");
  }
  return {
    meds: byKey(meds, (r) => r.slug),
    barriers: byKey(barriers, (r) => r.key),
    quests: byKey(quests!, (r) => r.key),
    achievements: byKey(achievements!, (r) => r.key),
  };
}

type DoseRow = Database["public"]["Tables"]["dose_logs"]["Insert"] & { id: string };
/** Ids of morning doses (parents are around to confirm those). */
const morningDoseIds = new Set<string>();

/**
 * Dose history for one regimen. `onTime(daysAgo)` is the chance a dose is on
 * time that day; the rest are late, with a few missed.
 */
function doseHistory(opts: {
  teenId: string;
  pmId: string;
  times: string[];
  fromDaysAgo: number;
  toDaysAgo: number;
  onTime: (daysAgo: number) => number;
  experimentFor?: (daysAgo: number, time: string) => string | null;
}): DoseRow[] {
  const rows: DoseRow[] = [];
  for (let d = opts.fromDaysAgo; d >= opts.toDaysAgo; d--) {
    for (const time of opts.times) {
      const scheduled = at(d, time);
      if (scheduled.getTime() > now) continue;
      const r = rand();
      const p = opts.onTime(d);
      const status = r < p ? "taken" : r < p + (1 - p) * 0.75 ? "late" : "missed";
      const delayMin = status === "taken" ? Math.floor(rand() * 20) : status === "late" ? 90 + Math.floor(rand() * 90) : 240;
      const logged = new Date(Math.min(now, scheduled.getTime() + delayMin * 60_000));
      const id = crypto.randomUUID();
      if (time === "08:00") morningDoseIds.add(id);
      rows.push({
        id,
        teen_id: opts.teenId,
        patient_medication_id: opts.pmId,
        scheduled_at: iso(scheduled),
        status,
        logged_at: iso(logged),
        experiment_id: opts.experimentFor?.(d, time) ?? null,
      });
    }
  }
  return rows;
}

const level = (xp: number) => Math.floor(Math.sqrt(xp / 50)) + 1;

async function insert<T extends keyof Database["public"]["Tables"]>(
  table: T,
  rows: Database["public"]["Tables"][T]["Insert"][],
) {
  if (rows.length === 0) return;
  // Chunk to stay well under request size limits.
  for (let i = 0; i < rows.length; i += 500) {
    // The generic insert overloads can't narrow a table-name type parameter.
    const { error } = await admin.from(table).insert(rows.slice(i, i + 500) as never);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// 4. Main
// ---------------------------------------------------------------------------

async function main() {
  const removed = await deleteDemoUsers();
  console.log(`Removed ${removed} previous demo users.`);

  const cat = await loadCatalog();

  const clinician = await createPerson({ key: "dr.rivera", name: "Dr. Rivera", role: "clinician" });
  const teens = {
    maya: await createPerson({ key: "maya", name: "Maya", role: "teen" }),
    leo: await createPerson({ key: "leo", name: "Leo", role: "teen" }),
    sam: await createPerson({ key: "sam", name: "Sam", role: "teen" }),
    ava: await createPerson({ key: "ava", name: "Ava", role: "teen" }),
    noah: await createPerson({ key: "noah", name: "Noah", role: "teen" }),
  };
  const parents = {
    maya: await createPerson({ key: "maya.parent", name: "Maya's mom", role: "parent" }),
    leo: await createPerson({ key: "leo.parent", name: "Leo's dad", role: "parent" }),
    sam: await createPerson({ key: "sam.parent", name: "Sam's mom", role: "parent" }),
    ava: await createPerson({ key: "ava.parent", name: "Ava's dad", role: "parent" }),
    noah: await createPerson({ key: "noah.parent", name: "Noah's grandma", role: "parent" }),
  };

  // Profiles details.
  const ageBands: Record<keyof typeof teens, string> = { maya: "13-15", leo: "16-18", sam: "16-18", ava: "13-15", noah: "13-15" };
  for (const [k, id] of Object.entries(teens)) {
    check("profile", await admin.from("profiles").update({ age_band: ageBands[k as keyof typeof teens] }).eq("id", id));
  }
  check("profile", await admin.from("profiles").update({ locale: "es" }).eq("id", parents.noah));

  // Links.
  await insert("care_links", Object.values(teens).map((teen_id) => ({ teen_id, clinician_id: clinician, enrolled_at: iso(dayStart(45)) })));
  const share: Record<keyof typeof teens, string> = { maya: "full", leo: "adherence", sam: "confirm_only", ava: "confirm_only", noah: "full" };
  const inviteCodes: Record<keyof typeof teens, string> = {
    maya: "MAYA2345", leo: "LEQ23456", sam: "SAMX2345", ava: "AVA2PARX", noah: "NQAH2345",
  };
  await insert("guardian_links", (Object.keys(teens) as (keyof typeof teens)[]).map((k) => ({
    teen_id: teens[k],
    parent_id: k === "ava" ? null : parents[k],
    status: k === "ava" ? "pending" : "active",
    share_level: share[k],
    invite_code: inviteCodes[k],
  })));

  // Regimens: everyone takes the two anti-rejection meds; Leo and Noah also
  // take the blood-pressure med. Schedules are times only — never doses.
  const twiceDaily: Json = [{ time: "08:00", label: "morning" }, { time: "20:00", label: "evening" }];
  const onceDaily: Json = [{ time: "08:00", label: "morning" }];
  const pm: Record<string, { tac: string; myco: string; aml?: string }> = {};
  const pmRows: Database["public"]["Tables"]["patient_medications"]["Insert"][] = [];
  for (const [k, teenId] of Object.entries(teens)) {
    pm[k] = { tac: crypto.randomUUID(), myco: crypto.randomUUID() };
    pmRows.push(
      { id: pm[k].tac, teen_id: teenId, medication_id: cat.meds.tacrolimus, schedule: twiceDaily, created_at: iso(dayStart(k === "ava" ? 1 : 40)) },
      { id: pm[k].myco, teen_id: teenId, medication_id: cat.meds.mycophenolate, schedule: twiceDaily, created_at: iso(dayStart(k === "ava" ? 1 : 40)) },
    );
    if (k === "leo" || k === "noah") {
      pm[k].aml = crypto.randomUUID();
      pmRows.push({ id: pm[k].aml, teen_id: teenId, medication_id: cat.meds.amlodipine, schedule: onceDaily, is_controller: false, created_at: iso(dayStart(40)) });
    }
  }
  await insert("patient_medications", pmRows);

  // Barriers.
  await insert("teen_barriers", [
    { teen_id: teens.maya, barrier_id: cat.barriers.forget, is_primary: true },
    { teen_id: teens.maya, barrier_id: cat.barriers.busy_mornings },
    { teen_id: teens.leo, barrier_id: cat.barriers.away_from_home, is_primary: true },
    { teen_id: teens.leo, barrier_id: cat.barriers.forget },
    { teen_id: teens.sam, barrier_id: cat.barriers.tired_of_meds, is_primary: true },
    { teen_id: teens.sam, free_text: "Weekends are hard because my schedule changes." },
    { teen_id: teens.ava, barrier_id: cat.barriers.taste, is_primary: true },
    { teen_id: teens.ava, barrier_id: cat.barriers.embarrassed },
    { teen_id: teens.noah, barrier_id: cat.barriers.busy_mornings, is_primary: true },
  ]);

  // Experiments.
  type Exp = Database["public"]["Tables"]["experiments"]["Insert"] & { id: string };
  const exps: Record<"maya" | "leo" | "noah", Exp> = {
    maya: {
      id: crypto.randomUUID(), teen_id: teens.maya, barrier_id: cat.barriers.forget, factor: "timing",
      hypothesis: "If I take my morning meds with breakfast, I will forget less.",
      arm_a: "Take them when I remember", arm_b: "Take them with breakfast",
      status: "active", started_at: iso(at(6, "07:00")),
    },
    leo: {
      id: crypto.randomUUID(), teen_id: teens.leo, barrier_id: cat.barriers.away_from_home, factor: "cue",
      hypothesis: "If I keep a pill case in my backpack, I will be on time when I am out.",
      arm_a: "Meds stay at home", arm_b: "Pill case in my backpack",
      status: "done", decision: "adopted", started_at: iso(at(34, "07:00")),
    },
    noah: {
      id: crypto.randomUUID(), teen_id: teens.noah, barrier_id: cat.barriers.busy_mornings, factor: "place",
      hypothesis: "If my meds sit by the sink, my rushed mornings will go better.",
      arm_a: "Meds in the kitchen", arm_b: "Meds by the bathroom sink",
      status: "done", decision: "rerun", started_at: iso(at(18, "07:00")),
    },
  };
  await insert("experiments", Object.values(exps));

  const dayRows: Database["public"]["Tables"]["experiment_days"]["Insert"][] = [];
  // Fixed patterns so each story's verdict is guaranteed (no randomness).
  const addDays = (e: Exp, startDaysAgo: number, loggedDays: number, lateDays: number[]) => {
    for (let i = 1; i <= 14; i++) {
      const arm = i % 2 ? "A" : "B";
      const daysAgo = startDaysAgo - (i - 1);
      const logged = i <= loggedDays;
      dayRows.push({
        experiment_id: e.id,
        day_index: i,
        arm,
        status: logged ? (lateDays.includes(i) ? "late" : "taken") : null,
        ease: logged ? (arm === "B" ? 4 : 3) - (i % 5 === 0 ? 1 : 0) : null,
        logged_at: logged ? iso(at(daysAgo, "08:10")) : null,
      });
    }
  };
  // Odd days are arm A, even days arm B.
  addDays(exps.maya, 6, 7, [1, 5]); //      A 2/4, B 3/3 → B ahead (not final yet)
  addDays(exps.leo, 34, 14, [3, 7, 11]); // A 4/7, B 7/7 → lift +0.43, adopted
  addDays(exps.noah, 18, 14, [3, 4]); //    A 6/7, B 6/7 → too close to call
  await insert("experiment_days", dayRows);

  // Dose history.
  const morningOf = (e: Exp, startDaysAgo: number) => (d: number, time: string) =>
    time === "08:00" && d <= startDaysAgo && d > startDaysAgo - 14 ? e.id : null;
  const doses: DoseRow[] = [];
  const both = (k: string) => [pm[k].tac, pm[k].myco];
  for (const pmId of both("maya")) {
    doses.push(...doseHistory({ teenId: teens.maya, pmId, times: ["08:00", "20:00"], fromDaysAgo: 21, toDaysAgo: 0,
      onTime: (d) => (d <= 6 ? 0.85 : 0.65), experimentFor: morningOf(exps.maya, 6) }));
  }
  for (const pmId of both("leo")) {
    doses.push(...doseHistory({ teenId: teens.leo, pmId, times: ["08:00", "20:00"], fromDaysAgo: 40, toDaysAgo: 0,
      onTime: (d) => (d > 34 ? 0.55 : d > 20 ? 0.75 : 0.95), experimentFor: morningOf(exps.leo, 34) }));
  }
  doses.push(...doseHistory({ teenId: teens.leo, pmId: pm.leo.aml!, times: ["08:00"], fromDaysAgo: 40, toDaysAgo: 0,
    onTime: (d) => (d > 20 ? 0.7 : 0.95) }));
  for (const pmId of both("sam")) {
    doses.push(...doseHistory({ teenId: teens.sam, pmId, times: ["08:00", "20:00"], fromDaysAgo: 21, toDaysAgo: 5,
      onTime: (d) => (d > 12 ? 0.9 : 0.35) }));
  }
  for (const pmId of both("noah")) {
    doses.push(...doseHistory({ teenId: teens.noah, pmId, times: ["08:00", "20:00"], fromDaysAgo: 25, toDaysAgo: 0,
      onTime: () => 0.75, experimentFor: morningOf(exps.noah, 18) }));
  }
  doses.push(...doseHistory({ teenId: teens.noah, pmId: pm.noah.aml!, times: ["08:00"], fromDaysAgo: 25, toDaysAgo: 0,
    onTime: () => 0.8 }));
  await insert("dose_logs", doses);

  // Parent confirmations (the trigger marks each dose verified). Parents
  // confirm most morning doses they could have seen; the newest are left
  // unconfirmed so the parent demo has something to tap.
  const confirmations: Database["public"]["Tables"]["parent_confirmations"]["Insert"][] = [];
  for (const k of ["maya", "leo", "sam", "noah"] as const) {
    for (const d of doses) {
      if (d.teen_id !== teens[k] || (d.status !== "taken" && d.status !== "late")) continue;
      const age = now - new Date(d.scheduled_at).getTime();
      if (age < 18 * 3_600_000) continue;
      if (!morningDoseIds.has(d.id) || rand() > 0.7) continue;
      confirmations.push({ dose_log_id: d.id, parent_id: parents[k], confirmed: true, confirmed_at: d.logged_at });
    }
  }
  await insert("parent_confirmations", confirmations);

  // Game state (server-owned). level = floor(sqrt(xp / 50)) + 1.
  const xp: Record<keyof typeof teens, number> = { maya: 310, leo: 720, sam: 180, ava: 20, noah: 410 };
  for (const [k, id] of Object.entries(teens)) {
    const x = xp[k as keyof typeof teens];
    check("game_state", await admin.from("game_state").upsert({ teen_id: id, xp: x, level: level(x) }));
  }

  const q = cat.quests;
  const done = (teen: string, key: string, daysAgo: number) =>
    ({ teen_id: teen, quest_id: q[key], status: "complete" as const, progress: 1, completed_at: iso(dayStart(daysAgo)) });
  await insert("quest_progress", [
    done(teens.maya, "onboard", 21), done(teens.maya, "first_log", 21), done(teens.maya, "explore_meds", 20),
    done(teens.maya, "first_experiment", 6),
    { teen_id: teens.maya, quest_id: q.finish_experiment, status: "active", progress: 0.5 },
    { teen_id: teens.maya, quest_id: q.two_weeks_mornings, status: "active", progress: 0.6 },
    done(teens.leo, "onboard", 40), done(teens.leo, "first_log", 40), done(teens.leo, "explore_meds", 39),
    done(teens.leo, "first_experiment", 34), done(teens.leo, "finish_experiment", 20), done(teens.leo, "two_weeks_mornings", 26),
    done(teens.sam, "onboard", 21), done(teens.sam, "first_log", 21),
    { teen_id: teens.sam, quest_id: q.explore_meds, status: "active", progress: 0.5 },
    done(teens.ava, "onboard", 1),
    { teen_id: teens.ava, quest_id: q.first_log, status: "available", progress: 0 },
    { teen_id: teens.ava, quest_id: q.explore_meds, status: "available", progress: 0 },
    done(teens.noah, "onboard", 25), done(teens.noah, "first_log", 25), done(teens.noah, "explore_meds", 24),
    done(teens.noah, "first_experiment", 18), done(teens.noah, "finish_experiment", 4),
  ]);

  const a = cat.achievements;
  await insert("achievement_unlocks", [
    { teen_id: teens.maya, achievement_id: a.first_step, unlocked_at: iso(dayStart(21)) },
    { teen_id: teens.maya, achievement_id: a.explorer, unlocked_at: iso(dayStart(20)) },
    { teen_id: teens.maya, achievement_id: a.scientist, unlocked_at: iso(dayStart(6)) },
    { teen_id: teens.maya, achievement_id: a.team_player, unlocked_at: iso(dayStart(19)) },
    { teen_id: teens.leo, achievement_id: a.first_step, unlocked_at: iso(dayStart(40)) },
    { teen_id: teens.leo, achievement_id: a.explorer, unlocked_at: iso(dayStart(39)) },
    { teen_id: teens.leo, achievement_id: a.scientist, unlocked_at: iso(dayStart(34)) },
    { teen_id: teens.leo, achievement_id: a.two_week_finisher, unlocked_at: iso(dayStart(20)) },
    { teen_id: teens.sam, achievement_id: a.first_step, unlocked_at: iso(dayStart(21)) },
    { teen_id: teens.noah, achievement_id: a.first_step, unlocked_at: iso(dayStart(25)) },
    { teen_id: teens.noah, achievement_id: a.scientist, unlocked_at: iso(dayStart(18)) },
    { teen_id: teens.noah, achievement_id: a.two_week_finisher, unlocked_at: iso(dayStart(4)) },
  ]);

  // Notifications. The app owns final copy via i18n; these are demo rows.
  await insert("notifications", [
    { user_id: teens.maya, type: "halfway", title: "You are halfway there", body: "Morning meds with breakfast are going well so far.", data: { experiment_id: exps.maya.id }, created_at: iso(at(0, "08:15")) },
    { user_id: teens.leo, type: "complete", title: "Your 2-week test is done", body: "See what won.", data: { experiment_id: exps.leo.id }, read: true, created_at: iso(dayStart(20)) },
    { user_id: teens.noah, type: "complete", title: "Your 2-week test is done", body: "See what won.", data: { experiment_id: exps.noah.id }, created_at: iso(dayStart(4)) },
    { user_id: parents.maya, type: "confirm_request", title: "Maya logged a dose", body: "Did you see Maya take it?", data: {}, created_at: iso(at(0, "08:12")) },
  ]);

  console.log(`Seeded: 1 clinician, 5 teens, 5 parents, ${doses.length} doses, ${confirmations.length} confirmations, ${dayRows.length} experiment days.`);
  console.log(`Sign in as <name>@${DEMO_DOMAIN} with password "${DEMO_PASSWORD}":`);
  console.log(`  dr.rivera, maya, leo, sam, ava, noah, maya.parent, leo.parent, sam.parent, ava.parent, noah.parent`);
  console.log(`  Ava's parent can link with invite code ${inviteCodes.ava}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
