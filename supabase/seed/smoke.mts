// Live smoke test against the hosted project, after `npm run db:push` and
// `npm run db:seed:demo`:
//
//   npm run db:smoke
//
// Signs in as demo users with the public anon key (exactly like the app) and
// checks what each role can and cannot see/do through src/lib/supabase/queries.ts.
// Anything it changes is undone with the service-role key at the end.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/types/database";

type Queries = typeof import("../../src/lib/supabase/queries");
const q = (await import(new URL("../../src/lib/supabase/queries.ts", import.meta.url).href)) as Queries;

const DOMAIN = "demo.relay.test";
const PASSWORD = process.env.DEMO_PASSWORD ?? "relay-demo-2026";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !anonKey || !serviceKey) {
  console.error("Set the three Supabase keys in .env.local");
  process.exit(1);
}

const opts = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient<Database>(url, serviceKey, opts);

async function signIn(name: string): Promise<SupabaseClient<Database>> {
  const sb = createClient<Database>(url, anonKey, opts);
  const { error } = await sb.auth.signInWithPassword({ email: `${name}@${DOMAIN}`, password: PASSWORD });
  if (error) throw new Error(`sign in ${name}: ${error.message} (run npm run db:seed:demo first)`);
  return sb;
}

let failures = 0;
function expect(label: string, ok: boolean, detail?: unknown) {
  console.log(`${ok ? "  ok  " : "  FAIL"} ${label}${ok || detail === undefined ? "" : ` — got ${JSON.stringify(detail)}`}`);
  if (!ok) failures++;
}

const cleanup: (() => Promise<unknown>)[] = [];

try {
  const ids = Object.fromEntries(
    (await admin.from("profiles").select("id, display_name")).data!.map((p) => [p.display_name, p.id]),
  ) as Record<string, string>;

  console.log("anon (signed out)");
  {
    const sb = createClient<Database>(url, anonKey, opts);
    const { data, error } = await sb.from("profiles").select("id");
    expect("cannot read profiles", !!error || data?.length === 0, data?.length);
    const meds = await sb.from("medications").select("id");
    expect("cannot read the catalog", !!meds.error || meds.data?.length === 0, meds.data?.length);
  }

  console.log("clinician (dr.rivera)");
  {
    const sb = await signIn("dr.rivera");
    const me = await q.getMyProfile(sb);
    expect("profile role is clinician", me?.role === "clinician", me?.role);
    const patients = await q.getEnrolledPatients(sb);
    expect("sees 5 enrolled patients", patients.length === 5, patients.length);
    const attention = await q.getAttentionList(sb);
    const byName = Object.fromEntries(attention.map((a) => [a.display_name, a.reasons]));
    expect("attention list has the 5 teens", attention.length === 5, attention.length);
    expect("Sam flagged not_logging", !!byName.Sam?.includes("not_logging"), byName.Sam);
    expect("Noah flagged too_close", !!byName.Noah?.includes("too_close"), byName.Noah);
    expect("Ava (new) not flagged", byName.Ava?.length === 0, byName.Ava);
    const board = await q.getStrategyLeaderboard(sb);
    expect("leaderboard has cue + place", board.length >= 2, board);
    const overview = await q.getClinicOverview(sb);
    expect("overview: 5 teens, 3 experiments, 2 finished",
      overview.teens === 5 && overview.experiments_started === 3 && overview.experiments_finished === 2, overview);
    const daily = await q.getDailyAdherence(sb, ids.Maya);
    expect("Maya has verified and self-reported days",
      daily.length > 10 && daily.some((d) => (d.verified_taken ?? 0) > 0), daily.length);
    const write = await sb.from("dose_logs").update({ status: "missed" }).eq("teen_id", ids.Maya).select("id");
    expect("cannot change a patient's doses", (write.data?.length ?? 0) === 0, write.data?.length);
  }

  console.log("teen (maya)");
  {
    const sb = await signIn("maya");
    const meds = await q.getTeenMedications(sb, ids.Maya, "es");
    expect("has 2 meds, named in Spanish", meds.length === 2 && meds.some((m) => m.medication.name === "Micofenolato"),
      meds.map((m) => m.medication.name));
    const content = await q.getMedicationContent(sb, meds[0].medication.id, "es");
    expect("explorer content in Spanish", content?.locale === "es" && (content?.flow.length ?? 0) > 0, content?.locale);
    const game = await q.getGameState(sb, ids.Maya);
    expect("game state xp 310, level 3", game?.xp === 310 && game?.level === 3, game);
    const cheat = await sb.from("game_state").update({ xp: 99999 }).eq("teen_id", ids.Maya).select("xp");
    expect("cannot give herself XP", !!cheat.error, cheat.data);
    const profiles = (await sb.from("profiles").select("display_name")).data ?? [];
    expect("sees self, parent and clinician only", profiles.length === 3, profiles.map((p) => p.display_name));
    const other = (await sb.from("dose_logs").select("id").eq("teen_id", ids.Leo)).data ?? [];
    expect("cannot see Leo's doses", other.length === 0, other.length);
    const role = await sb.from("profiles").update({ role: "clinician" }).eq("id", ids.Maya).select("role");
    expect("cannot change her role", !!role.error, role.data);
    const barriers = await q.getTeenBarriers(sb, ids.Maya, "en");
    expect("has her barriers", barriers.length === 2, barriers.length);
  }

  console.log("parent with full share (maya.parent)");
  {
    const sb = await signIn("maya.parent");
    const pending = await q.getDosesAwaitingConfirmation(sb, "en");
    expect("has recent doses to confirm", pending.length > 0, pending.length);
    expect("pending doses all belong to Maya", pending.every((p) => p.teenName === "Maya"), pending.map((p) => p.teenName));
    if (pending[0]) {
      const target = pending[0].doseLogId;
      const { error } = await sb.from("parent_confirmations")
        .insert({ dose_log_id: target, parent_id: ids["Maya's mom"], confirmed: true });
      expect("can confirm a dose", !error, error?.message);
      const { data } = await admin.from("dose_logs").select("verified").eq("id", target).single();
      expect("confirmation marks it verified", data?.verified === true, data);
      cleanup.push(async () => {
        await admin.from("parent_confirmations").delete().eq("dose_log_id", target);
        await admin.from("dose_logs").update({ verified: false }).eq("id", target);
      });
    }
    const exps = (await sb.from("experiments").select("id")).data ?? [];
    expect("full share sees Maya's experiment", exps.length === 1, exps.length);
  }

  console.log("parent with adherence share (leo.parent)");
  {
    const sb = await signIn("leo.parent");
    const doses = (await sb.from("dose_logs").select("id")).data ?? [];
    expect("sees Leo's full dose history", doses.length > 100, doses.length);
    const exps = (await sb.from("experiments").select("id")).data ?? [];
    expect("cannot see experiments", exps.length === 0, exps.length);
  }

  console.log("parent with confirm_only share (sam.parent)");
  {
    const sb = await signIn("sam.parent");
    const doses = (await sb.from("dose_logs").select("id")).data ?? [];
    expect("sees no history (Sam's last log is 5 days old)", doses.length === 0, doses.length);
    const profiles = (await sb.from("profiles").select("display_name")).data ?? [];
    expect("still sees Sam's name", profiles.some((p) => p.display_name === "Sam"), profiles);
  }

  console.log("unlinked parent (ava.parent)");
  {
    const sb = await signIn("ava.parent");
    const before = (await sb.from("profiles").select("id")).data ?? [];
    expect("sees only self before linking", before.length === 1, before.length);
    const bad = await sb.rpc("accept_guardian_invite", { p_code: "NOPE2345" });
    expect("bad invite code is rejected", bad.error?.message === "invite_not_found", bad.error?.message);
    const teenId = await q.acceptGuardianInvite(sb, "ava2parx");
    expect("invite code links to Ava", teenId === ids.Ava, teenId);
    cleanup.push(async () => {
      await admin.from("guardian_links").update({ parent_id: null, status: "pending" }).eq("invite_code", "AVA2PARX");
    });
    const after = (await sb.from("profiles").select("display_name")).data ?? [];
    expect("now sees Ava", after.some((p) => p.display_name === "Ava"), after);
  }

  console.log("teen (ava) creates an invite");
  {
    const sb = await signIn("ava");
    const code = await q.createGuardianInvite(sb, "adherence");
    expect("gets an 8-character code", /^[A-HJ-NP-Z2-9]{8}$/.test(code), code);
    cleanup.push(async () => {
      await admin.from("guardian_links").delete().eq("invite_code", code);
    });
  }
} finally {
  for (const undo of cleanup.reverse()) await undo();
}

console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll live checks passed.");
process.exit(failures ? 1 : 0);
