import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import webpush, { type PushSubscription } from "web-push";

/**
 * DEMO push delivery. Subscriptions are kept in a local JSON file
 * (.data/, gitignored) so the laptop that runs the app can reach the phone.
 * TODO(backend): store subscriptions in a push_subscriptions table tied to
 * the signed-in teen, and send from the daily reminder job.
 */
const FILE = path.join(process.cwd(), ".data", "push-subscriptions.json");
const MAX_SUBSCRIPTIONS = 20;

function configure() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) throw new Error("Push keys are missing from .env.local");
  webpush.setVapidDetails(subject, pub, priv);
}

async function load(): Promise<PushSubscription[]> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as PushSubscription[];
  } catch {
    return [];
  }
}

async function save(subs: PushSubscription[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(subs, null, 2));
}

/** Basic shape check, so junk can't be stored. */
export function isSubscription(value: unknown): value is PushSubscription {
  const v = value as PushSubscription;
  return (
    typeof v?.endpoint === "string" &&
    v.endpoint.startsWith("https://") &&
    typeof v.keys?.p256dh === "string" &&
    typeof v.keys?.auth === "string"
  );
}

export async function addSubscription(sub: PushSubscription) {
  const subs = (await load()).filter((s) => s.endpoint !== sub.endpoint);
  subs.push({ endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } });
  await save(subs.slice(-MAX_SUBSCRIPTIONS));
}

export type PushPayload = { title: string; body: string; url: string; tag?: string };

/** Sends to every stored phone. Drops subscriptions the browser has revoked. */
export async function sendToAll(payload: PushPayload) {
  configure();
  const subs = await load();
  const results = await Promise.allSettled(
    subs.map((s) => webpush.sendNotification(s, JSON.stringify(payload), { TTL: 600, urgency: "high" })),
  );
  const gone = new Set<string>();
  results.forEach((r, i) => {
    const code = r.status === "rejected" ? (r.reason as { statusCode?: number }).statusCode : undefined;
    if (code === 404 || code === 410) gone.add(subs[i].endpoint);
  });
  if (gone.size) await save(subs.filter((s) => !gone.has(s.endpoint)));
  return { sent: results.filter((r) => r.status === "fulfilled").length, total: subs.length };
}
