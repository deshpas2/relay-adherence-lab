import { createBrowserClient } from "@supabase/ssr";
import type { AppDatabase } from "@/lib/types/app-database";

export function createClient() {
  return createBrowserClient<AppDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
