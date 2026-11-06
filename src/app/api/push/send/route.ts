import { getLocale, getTranslations } from "next-intl/server";
import { personalizeReminder, type Tone } from "@/lib/engine/personalize";
import { ideaLibrary, sampleExperiment } from "@/lib/fixtures/experiments";
import { getSampleProfile, QUIET_PRESETS, TONES } from "@/lib/fixtures/personal";
import { reminderText } from "@/lib/push/reminder-text";
import { sendToAll } from "@/lib/push/server";

const TYPES = ["reminder", "suggest", "complete", "checkin"] as const;
type PushType = (typeof TYPES)[number];

/**
 * Sends one of Relay's notifications to the demo phone(s).
 * The server writes every word from a known teen + type, so this endpoint can
 * never push arbitrary text. Each type opens the screen that acts on it.
 *
 * Body: { type, teen: "me" | patient id, idea?: library key, prefs?: {...} }
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    type?: string;
    teen?: string;
    idea?: string;
    prefs?: { tone?: string; discreet?: boolean; school?: boolean; sleep?: boolean };
  };
  const type: PushType = TYPES.includes(body.type as PushType) ? (body.type as PushType) : "reminder";
  const locale = await getLocale();
  const profile = getSampleProfile(typeof body.teen === "string" ? body.teen : "", locale);
  if (!profile) return Response.json({ ok: false }, { status: 404 });

  // The teen app sends its current (unsaved) preferences; only known values are used.
  if (body.teen === "me" && body.prefs) {
    if (TONES.includes(body.prefs.tone as Tone)) profile.tone = body.prefs.tone as Tone;
    if (typeof body.prefs.discreet === "boolean") profile.discreet = body.prefs.discreet;
    profile.quietHours = [
      ...(body.prefs.school ? [QUIET_PRESETS.school] : []),
      ...(body.prefs.sleep ? [QUIET_PRESETS.sleep] : []),
    ];
  }

  const [tPersonal, tPush, tIdea] = await Promise.all([
    getTranslations("Personal"),
    getTranslations("Push"),
    getTranslations("ExperimentIdeas"),
  ]);

  let payload: { title: string; body: string; url: string };
  if (type === "reminder") {
    payload = { ...reminderText(personalizeReminder(profile), tPersonal), url: "/teen/home?from=reminder" };
  } else if (type === "suggest") {
    const idea = ideaLibrary.find((i) => i.key === body.idea) ?? ideaLibrary[0];
    payload = profile.discreet
      ? { title: tPush("discreet_new_title"), body: tPush("discreet_body"), url: "" }
      : { title: tPush("suggest_title"), body: tPush("suggest_body", { idea: tIdea(`${idea.key}.title`) }), url: "" };
    payload.url = `/teen/experiments/new?suggested=${idea.key}`;
  } else if (type === "complete") {
    const idea = tIdea(`${sampleExperiment.ideaKey}.title`);
    payload = profile.discreet
      ? { title: tPush("discreet_new_title"), body: tPush("discreet_body"), url: "" }
      : { title: tPush("complete_title"), body: tPush("complete_body", { idea }), url: "" };
    payload.url = `/teen/experiments/${sampleExperiment.id}?done=1`;
  } else {
    payload = profile.discreet
      ? { title: tPush("discreet_checkin_title"), body: tPush("discreet_body"), url: "" }
      : { title: tPush("checkin_title", { name: profile.name }), body: tPush("checkin_body"), url: "" };
    payload.url = "/teen/checkin";
  }

  try {
    const result = await sendToAll({ ...payload, tag: `relay-${type}-${body.teen}` });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("push send failed:", error instanceof Error ? error.message : error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
