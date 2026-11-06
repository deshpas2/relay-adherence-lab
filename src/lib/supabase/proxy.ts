import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { decideRoute } from "@/lib/auth/routing";
import type { AppDatabase } from "@/lib/types/app-database";

/** Refreshes the auth session cookie, then applies role routing. */
export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Lets the app boot locally before a Supabase project exists. Production
    // must never run without auth, so it fails loudly instead.
    if (process.env.NODE_ENV === "production") {
      throw new Error("Supabase env vars are missing");
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  let sessionHeaders: Record<string, string> = {};

  const supabase = createServerClient<AppDatabase>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        // Stops CDNs caching a response that carries a session token.
        sessionHeaders = headers ?? {};
        Object.entries(sessionHeaders).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  // Must run straight after creating the client: it triggers the refresh.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A failed lookup leaves role null, which denies access rather than grants it.
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const decision = decideRoute({
    pathname: request.nextUrl.pathname,
    signedIn: Boolean(user),
    role: profile?.role ?? null,
  });

  if (decision.type === "allow") return response;

  // A refreshed session must survive the redirect, or the user gets signed out.
  const redirect = NextResponse.redirect(new URL(decision.to, request.url));
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  Object.entries(sessionHeaders).forEach(([key, value]) =>
    redirect.headers.set(key, value),
  );
  return redirect;
}
