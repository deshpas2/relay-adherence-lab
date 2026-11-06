import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { AppDatabase } from "@/lib/types/app-database";

/** Create a new client per request; never share one between requests. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<AppDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components can't write cookies. src/proxy.ts refreshes
            // the session on every request, so this is safe to ignore.
          }
        },
      },
    },
  );
}
