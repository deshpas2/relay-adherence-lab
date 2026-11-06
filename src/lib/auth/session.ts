import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { localeCookie, resolveLocale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "./routing";
import { buildProfileInsert } from "./validation";

export type Session = { user: User; role: Role };

/** The verified user and their role, or null. Memoized per request. */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return profile ? { user, role: profile.role } : null;
});

/**
 * Call at the top of every server action and role layout. The proxy is only a
 * first filter: server actions can be reached without passing through it.
 */
export async function requireRole(role: Role): Promise<Session> {
  const session = await getSession();
  if (session?.role !== role) redirect("/");
  return session;
}

/**
 * Creates the profile on first sign-in. Does nothing if one already exists, so
 * it stays correct if Lane DB adds a database trigger that does the same job.
 */
export async function ensureProfile(user: User): Promise<void> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const locale = resolveLocale(
    cookieStore.get(localeCookie)?.value,
    headerStore.get("accept-language"),
  );

  const profile = buildProfileInsert(user.id, user.user_metadata, locale);
  if (!profile) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .upsert(profile, { onConflict: "id", ignoreDuplicates: true });

  // The user lands on /sign-in?error=no_profile; this is what explains why.
  if (error) console.error("ensureProfile failed:", error.code);
}
