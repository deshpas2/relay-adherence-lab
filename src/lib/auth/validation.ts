import type { Role } from "./routing";

export type SignupRole = Exclude<Role, "clinician">;
export type ShareLevel = "confirm_only" | "adherence" | "full";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const shareLevels: readonly string[] = ["confirm_only", "adherence", "full"];

/** No 0/O or 1/I, so a code read aloud or copied by hand stays unambiguous. */
const inviteAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const inviteLength = 10;

/** Clinician accounts are provisioned, never self-selected. See docs/decisions.md. */
export function parseSignupRole(value: unknown): SignupRole | null {
  return value === "teen" || value === "parent" ? value : null;
}

export function parseEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return emailPattern.test(email) ? email : null;
}

export function parsePassword(value: unknown): string | null {
  return typeof value === "string" && value.length >= 8 ? value : null;
}

export function parseDisplayName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return name.length >= 1 && name.length <= 50 ? name : null;
}

export function parseShareLevel(value: unknown): ShareLevel | null {
  return typeof value === "string" && shareLevels.includes(value)
    ? (value as ShareLevel)
    : null;
}

export function generateInviteCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(inviteLength));
  // 256 is a multiple of the 32-letter alphabet, so this has no modulo bias.
  return Array.from(
    bytes,
    (byte) => inviteAlphabet[byte % inviteAlphabet.length],
  ).join("");
}

export function normalizeInviteCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.replace(/[\s-]/g, "").toUpperCase();
  const valid =
    code.length === inviteLength &&
    [...code].every((char) => inviteAlphabet.includes(char));
  return valid ? code : null;
}

/**
 * Builds the first profile row from sign-up metadata. Users can edit their own
 * metadata, so it is validated again here rather than trusted.
 */
export function buildProfileInsert(
  id: string,
  metadata: Record<string, unknown> | undefined,
  locale: string,
) {
  const role = parseSignupRole(metadata?.role);
  const displayName = parseDisplayName(metadata?.display_name);
  if (!role || !displayName) return null;
  return { id, role, display_name: displayName, locale };
}
