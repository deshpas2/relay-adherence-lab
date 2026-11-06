import { addSubscription, isSubscription } from "@/lib/push/server";

/** Saves this phone's push subscription (DEMO: see src/lib/push/server.ts). */
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!isSubscription(body)) return Response.json({ ok: false }, { status: 400 });
  await addSubscription(body);
  return Response.json({ ok: true });
}
