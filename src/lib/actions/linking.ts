"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import {
  generateInviteCode,
  normalizeInviteCode,
  parseShareLevel,
} from "@/lib/auth/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { actionError, type ActionState } from "./state";

/** Teen: makes a code to give a parent. The link stays pending until redeemed. */
export async function createGuardianInvite(): Promise<ActionState> {
  const { user } = await requireRole("teen");
  const inviteCode = generateInviteCode();

  const supabase = await createClient();
  const { error } = await supabase
    .from("guardian_links")
    .insert({ teen_id: user.id, invite_code: inviteCode });

  if (error) {
    console.error("createGuardianInvite failed:", error.code);
    return actionError("failed");
  }
  revalidatePath("/teen", "layout");
  return { status: "ok", inviteCode };
}

/**
 * Parent: redeems a code. The service role is needed because the parent isn't
 * on the row yet, so RLS rightly hides it from them. The update is safe because
 * it matches only the exact code on a still-unclaimed invite, in one statement,
 * so a code can't be used twice and no other link can be read or changed.
 */
export async function redeemGuardianInvite(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireRole("parent");

  const inviteCode = normalizeInviteCode(formData.get("inviteCode"));
  if (!inviteCode) return actionError("invalid_invite");

  const { data, error } = await createAdminClient()
    .from("guardian_links")
    .update({ parent_id: user.id, status: "active" })
    .eq("invite_code", inviteCode)
    .eq("status", "pending")
    .is("parent_id", null)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("redeemGuardianInvite failed:", error.code);
    return actionError("failed");
  }
  if (!data) return actionError("invalid_invite");

  revalidatePath("/parent", "layout");
  return { status: "ok" };
}

/** Teen: chooses how much a linked parent can see. */
export async function updateShareLevel(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireRole("teen");

  const shareLevel = parseShareLevel(formData.get("shareLevel"));
  if (!shareLevel) return actionError("invalid_share_level");

  return updateOwnLink(user.id, formData.get("linkId"), {
    share_level: shareLevel,
  });
}

/** Teen: ends a parent's access. Works on pending invites too. */
export async function revokeGuardianLink(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireRole("teen");
  return updateOwnLink(user.id, formData.get("linkId"), { status: "revoked" });
}

async function updateOwnLink(
  teenId: string,
  linkId: FormDataEntryValue | null,
  changes: { share_level: string } | { status: "revoked" },
): Promise<ActionState> {
  if (typeof linkId !== "string" || !linkId) return actionError("not_found");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guardian_links")
    .update(changes)
    .eq("id", linkId)
    .eq("teen_id", teenId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("updateOwnLink failed:", error.code);
    return actionError("failed");
  }
  if (!data) return actionError("not_found");

  revalidatePath("/teen", "layout");
  return { status: "ok" };
}
