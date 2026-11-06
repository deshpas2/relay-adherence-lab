import { getLocale, getTranslations } from "next-intl/server";
import { personalizeReminder, type Tone } from "@/lib/engine/personalize";
import { getSampleProfile, QUIET_PRESETS, TONES } from "@/lib/fixtures/personal";
import { reminderText } from "@/lib/push/reminder-text";
import { sendToAll } from "@/lib/push/server";

/**
 * Sends a teen's personalized reminder to the demo phone(s).
 * The server builds the text from the teen's profile, so this endpoint can
 * never be used to send arbitrary words to a phone.
 * Body: { teen: "me" | patient id, prefs?: { tone, discreet, school, sleep } }
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    teen?: string;
    prefs?: { tone?: string; discreet?: boolean; school?: boolean; sleep?: boolean };
  };
  const [t, locale] = await Promise.all([getTranslations("Personal"), getLocale()]);
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

  const { title, body: text } = reminderText(personalizeReminder(profile), t);
  try {
    const result = await sendToAll({ title, body: text, url: "/teen/home", tag: `relay-${body.teen}` });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("push send failed:", error instanceof Error ? error.message : error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
