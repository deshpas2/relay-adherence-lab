"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { AuthError } from "@supabase/supabase-js";
import { ensureProfile } from "@/lib/auth/session";
import {
  parseDisplayName,
  parseEmail,
  parsePassword,
  parseSignupRole,
} from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";
import { actionError, type ActionState } from "./state";

async function confirmUrl() {
  // Supabase only honours redirect URLs on the project's allow list.
  const origin = (await headers()).get("origin");
  return `${origin}/auth/confirm`;
}

function fromAuthError(error: AuthError): ActionState {
  if (error.status === 429) return actionError("rate_limited");
  if (error.code === "weak_password") return actionError("weak_password");
  console.error("auth request failed:", error.code);
  return actionError("failed");
}

/** Magic link is the default; a password is optional. */
export async function signUp(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = parseEmail(formData.get("email"));
  const role = parseSignupRole(formData.get("role"));
  const displayName = parseDisplayName(formData.get("displayName"));
  const rawPassword = formData.get("password");
  const password = rawPassword ? parsePassword(rawPassword) : null;

  if (!email) return actionError("invalid_email");
  if (!role) return actionError("invalid_role");
  if (!displayName) return actionError("invalid_name");
  if (rawPassword && !password) return actionError("invalid_password");

  const supabase = await createClient();
  const options = {
    data: { role, display_name: displayName },
    emailRedirectTo: await confirmUrl(),
  };

  if (!password) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { ...options, shouldCreateUser: true },
    });
    return error ? fromAuthError(error) : { status: "sent" };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options,
  });
  if (error) return fromAuthError(error);

  // No session means Supabase is waiting for the user to confirm by email.
  if (!data.session || !data.user) return { status: "sent" };
  await ensureProfile(data.user);
  redirect("/");
}

export async function sendMagicLink(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = parseEmail(formData.get("email"));
  if (!email) return actionError("invalid_email");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: await confirmUrl() },
  });

  // An unknown email looks the same as a known one, so nobody can use this
  // form to find out whether a teen has an account.
  if (
    error &&
    error.code !== "otp_disabled" &&
    error.code !== "user_not_found"
  ) {
    return fromAuthError(error);
  }
  return { status: "sent" };
}

export async function signInWithPassword(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = parseEmail(formData.get("email"));
  const password = formData.get("password");
  if (!email) return actionError("invalid_email");
  if (typeof password !== "string" || !password) {
    return actionError("invalid_credentials");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    return error.status === 429
      ? actionError("rate_limited")
      : actionError("invalid_credentials");
  }

  await ensureProfile(data.user);
  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
