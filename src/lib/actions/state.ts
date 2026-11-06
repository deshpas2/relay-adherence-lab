/** Actions return codes, not text: the UI shows `ActionErrors.<code>` from messages. */
export const actionErrorCodes = [
  "invalid_email",
  "invalid_password",
  "invalid_name",
  "invalid_role",
  "invalid_credentials",
  "weak_password",
  "rate_limited",
  "invalid_invite",
  "invalid_share_level",
  "not_found",
  "link_expired",
  "no_profile",
  "failed",
] as const;

export type ActionErrorCode = (typeof actionErrorCodes)[number];

export type ActionState =
  | { status: "idle" }
  /** A sign-in email is on its way. */
  | { status: "sent" }
  | { status: "ok"; inviteCode?: string }
  | { status: "error"; code: ActionErrorCode };

export const idleState: ActionState = { status: "idle" };

export const actionError = (code: ActionErrorCode): ActionState => ({
  status: "error",
  code,
});
