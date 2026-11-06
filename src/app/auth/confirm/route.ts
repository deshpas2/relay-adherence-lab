import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { ensureProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const allowedTypes: readonly string[] = ["email", "magiclink", "signup"];

/**
 * Where email links land. It always ends at "/" and takes no return URL, so a
 * crafted link can't bounce someone to another site after sign-in.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type");

  const supabase = await createClient();

  const result = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type && allowedTypes.includes(type)
      ? await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as EmailOtpType,
        })
      : null;

  if (!result || result.error || !result.data.user) {
    redirect("/sign-in?error=link_expired");
  }

  await ensureProfile(result.data.user);
  redirect("/");
}
