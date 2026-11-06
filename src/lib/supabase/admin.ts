import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { AppDatabase } from "@/lib/types/app-database";

/**
 * Bypasses Row-Level Security. Use only for a narrow step RLS can't express,
 * after checking the caller yourself, and never with user-chosen filters.
 */
export function createAdminClient() {
  return createClient<AppDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
