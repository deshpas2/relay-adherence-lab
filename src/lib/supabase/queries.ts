// Typed query helpers (Lane DB). Each takes a Supabase client, so they work
// with both the server client (Server Components / Actions) and the browser
// client. RLS decides what each caller sees; these helpers never widen it.
//
// They throw on database errors so callers can let error.tsx handle them.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Enums, Json, Tables } from "@/lib/types/database";

export type Client = SupabaseClient<Database>;
export type Locale = "en" | "es";
export type ShareLevel = "confirm_only" | "adherence" | "full";

/** One entry in medication_content.ingredients (an explorer hotspot). */
export type Ingredient = { name: string; role: string; plain: string };
/** One entry in medication_content.flow (a flow-chart step). */
export type FlowStep = { step: number; text: string };
/** One entry in patient_medications.schedule. */
export type ScheduleSlot = { time: string; label: string };

/**
 * Unwrap a Supabase response: throw on error, otherwise return the success
 * branch's data (lists are never null; maybeSingle() stays nullable).
 */
function must<R extends { data: unknown; error: { message: string } | null }>(
  response: R,
): Extract<R, { error: null }>["data"] {
  if (response.error) throw new Error(response.error.message);
  return response.data;
}

/**
 * Catalog text for `locale`, falling back to the English column.
 * Catalog rows keep English in their own columns and other locales in
 * `i18n` shaped {"es": {"<column>": "..."}}.
 */
export function localize<R extends { i18n: Json }, K extends keyof R & string>(
  row: R,
  field: K,
  locale: Locale,
): string {
  const i18n = row.i18n as Record<string, Record<string, string> | undefined> | null;
  return i18n?.[locale]?.[field] ?? String(row[field]);
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

/** The signed-in user's profile, or null if signed out / no profile yet. */
export async function getMyProfile(sb: Client): Promise<Tables<"profiles"> | null> {
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  return must(await sb.from("profiles").select("*").eq("id", auth.user.id).maybeSingle());
}

// ---------------------------------------------------------------------------
// Catalogs
// ---------------------------------------------------------------------------

export async function getBarriers(sb: Client, locale: Locale) {
  const rows = must(await sb.from("barriers").select("*").order("created_at").order("key"));
  return rows.map((b) => ({ id: b.id, key: b.key, label: localize(b, "label", locale) }));
}

export async function getQuests(sb: Client, locale: Locale) {
  const rows = must(await sb.from("quests").select("*").order("xp_reward"));
  return rows.map((q) => ({
    ...q,
    title: localize(q, "title", locale),
    description: localize(q, "description", locale),
  }));
}

export async function getAchievements(sb: Client, locale: Locale) {
  const rows = must(await sb.from("achievements").select("*").order("key"));
  return rows.map((a) => ({
    ...a,
    title: localize(a, "title", locale),
    description: localize(a, "description", locale),
  }));
}

// ---------------------------------------------------------------------------
// Medications
// ---------------------------------------------------------------------------

/** A teen's regimen with each medicine's localized name. */
export async function getTeenMedications(sb: Client, teenId: string, locale: Locale) {
  const rows = must(
    await sb
      .from("patient_medications")
      .select("id, schedule, is_controller, medications(id, slug, display_name, form, color, i18n)")
      .eq("teen_id", teenId)
      .order("created_at"),
  );
  return rows.map((pm) => ({
    id: pm.id,
    isController: pm.is_controller,
    schedule: pm.schedule as ScheduleSlot[],
    medication: {
      id: pm.medications.id,
      slug: pm.medications.slug,
      form: pm.medications.form,
      color: pm.medications.color,
      name: localize(pm.medications, "display_name", locale),
    },
  }));
}

/** Explorer content for one medicine in `locale`, falling back to English. */
export async function getMedicationContent(sb: Client, medicationId: string, locale: Locale) {
  const rows = must(
    await sb
      .from("medication_content")
      .select("*, medications(slug, display_name, form, color, i18n)")
      .eq("medication_id", medicationId)
      .in("locale", [locale, "en"]),
  );
  const row = rows.find((r) => r.locale === locale) ?? rows.find((r) => r.locale === "en");
  if (!row) return null;
  return {
    medicationId,
    locale: row.locale,
    name: localize(row.medications, "display_name", locale),
    form: row.medications.form,
    color: row.medications.color,
    whatItIs: row.what_it_is,
    whyItMatters: row.why_it_matters,
    ingredients: row.ingredients as Ingredient[],
    flow: row.flow as FlowStep[],
    reviewed: row.reviewed,
  };
}

// ---------------------------------------------------------------------------
// Doses & confirmation
// ---------------------------------------------------------------------------

export async function getRecentDoses(sb: Client, teenId: string, sinceDays = 14) {
  const since = new Date(Date.now() - sinceDays * 86_400_000).toISOString();
  return must(
    await sb
      .from("dose_logs")
      .select("*")
      .eq("teen_id", teenId)
      .gte("scheduled_at", since)
      .order("scheduled_at", { ascending: false }),
  );
}

/**
 * Parent view: doses from linked teens in the last 48 hours that are logged
 * taken/late and not yet verified — the "I saw them take it" list.
 */
export async function getDosesAwaitingConfirmation(sb: Client, locale: Locale) {
  const since = new Date(Date.now() - 48 * 3_600_000).toISOString();
  const rows = must(
    await sb
      .from("dose_logs")
      .select(
        "id, teen_id, scheduled_at, status, logged_at, " +
          "patient_medications(medications(display_name, form, color, i18n)), " +
          "profiles!dose_logs_teen_id_fkey(display_name)",
      )
      .in("status", ["taken", "late"])
      .eq("verified", false)
      .gte("scheduled_at", since)
      .order("scheduled_at", { ascending: false })
      .overrideTypes<
        Array<{
          id: string;
          teen_id: string;
          scheduled_at: string;
          status: Enums<"dose_status">;
          logged_at: string;
          patient_medications: {
            medications: Pick<Tables<"medications">, "display_name" | "form" | "color" | "i18n">;
          };
          profiles: { display_name: string };
        }>,
        { merge: false }
      >(),
  );
  return rows.map((d) => ({
    doseLogId: d.id,
    teenId: d.teen_id,
    teenName: d.profiles.display_name,
    scheduledAt: d.scheduled_at,
    status: d.status,
    loggedAt: d.logged_at,
    medicationName: localize(d.patient_medications.medications, "display_name", locale),
    form: d.patient_medications.medications.form,
    color: d.patient_medications.medications.color,
  }));
}

// ---------------------------------------------------------------------------
// Linking (RPCs from 0002_rls.sql)
// ---------------------------------------------------------------------------

/** Teen: create a parent invite. Returns the 8-character code. */
export async function createGuardianInvite(sb: Client, shareLevel: ShareLevel = "confirm_only") {
  return must(await sb.rpc("create_guardian_invite", { p_share_level: shareLevel }));
}

/**
 * Parent: redeem an invite code. Returns the teen's id. Errors carry one of
 * these messages: invite_not_found, already_linked, only_parents_can_accept.
 */
export async function acceptGuardianInvite(sb: Client, code: string) {
  return must(await sb.rpc("accept_guardian_invite", { p_code: code }));
}

export async function getGuardianLinks(sb: Client) {
  return must(await sb.from("guardian_links").select("*").order("created_at", { ascending: false }));
}

// ---------------------------------------------------------------------------
// Barriers, experiments, game
// ---------------------------------------------------------------------------

export async function getTeenBarriers(sb: Client, teenId: string, locale: Locale) {
  const rows = must(
    await sb
      .from("teen_barriers")
      .select("id, is_primary, free_text, barriers(id, key, label, i18n)")
      .eq("teen_id", teenId)
      .order("created_at"),
  );
  return rows.map((t) => ({
    id: t.id,
    isPrimary: t.is_primary,
    freeText: t.free_text,
    barrier: t.barriers
      ? { id: t.barriers.id, key: t.barriers.key, label: localize(t.barriers, "label", locale) }
      : null,
  }));
}

export async function getExperiments(sb: Client, teenId: string) {
  return must(
    await sb.from("experiments").select("*").eq("teen_id", teenId).order("started_at", { ascending: false }),
  );
}

/** One experiment with its days in order (input for the experiment engine). */
export async function getExperimentWithDays(sb: Client, experimentId: string) {
  const exp = must(
    await sb
      .from("experiments")
      .select("*, experiment_days(*)")
      .eq("id", experimentId)
      .order("day_index", { referencedTable: "experiment_days" })
      .maybeSingle(),
  );
  return exp;
}

/** Per-arm on-time / ease / lift computed in SQL (v_experiment_results). */
export async function getExperimentResults(sb: Client, teenId: string) {
  return must(await sb.from("v_experiment_results").select("*").eq("teen_id", teenId));
}

export async function getGameState(sb: Client, teenId: string) {
  return must(await sb.from("game_state").select("*").eq("teen_id", teenId).maybeSingle());
}

export async function getQuestProgress(sb: Client, teenId: string) {
  return must(await sb.from("quest_progress").select("*, quests(*)").eq("teen_id", teenId));
}

export async function getAchievementUnlocks(sb: Client, teenId: string) {
  return must(
    await sb.from("achievement_unlocks").select("*, achievements(*)").eq("teen_id", teenId),
  );
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function getNotifications(sb: Client, limit = 30) {
  return must(
    await sb.from("notifications").select("*").order("created_at", { ascending: false }).limit(limit),
  );
}

export async function markNotificationRead(sb: Client, id: string) {
  must(await sb.from("notifications").update({ read: true }).eq("id", id));
}

// ---------------------------------------------------------------------------
// Clinician dashboard (views from 0003_views.sql; scoped by RLS)
// ---------------------------------------------------------------------------

export async function getAttentionList(sb: Client) {
  return must(
    await sb
      .from("v_attention_list")
      .select("*")
      .order("needs_attention", { ascending: false })
      .order("last_log", { ascending: true, nullsFirst: true }),
  );
}

export async function getStrategyLeaderboard(sb: Client) {
  return must(
    await sb.from("v_strategy_leaderboard").select("*").order("pct_adopted", { ascending: false, nullsFirst: false }),
  );
}

export async function getClinicOverview(sb: Client) {
  return must(await sb.from("v_clinic_overview").select("*").single());
}

/** Daily verified vs self-reported adherence for the patient-detail chart. */
export async function getDailyAdherence(sb: Client, teenId: string, sinceDays = 30) {
  const since = new Date(Date.now() - sinceDays * 86_400_000).toISOString().slice(0, 10);
  return must(
    await sb
      .from("v_daily_adherence")
      .select("*")
      .eq("teen_id", teenId)
      .gte("day", since)
      .order("day"),
  );
}

/** Enrolled patients for the signed-in clinician. */
export async function getEnrolledPatients(sb: Client) {
  return must(
    await sb
      .from("care_links")
      .select("teen_id, enrolled_at, status, profiles!care_links_teen_id_fkey(display_name, age_band, locale)")
      .eq("status", "active")
      .order("enrolled_at"),
  );
}
