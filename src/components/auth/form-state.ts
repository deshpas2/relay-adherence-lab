/**
 * The shape the auth forms expect from an action. It matches Lane Backend's
 * ActionState (src/lib/actions/state.ts on lane-be), so their actions plug
 * straight into these forms, e.g. <SignInForm linkAction={sendMagicLink} />.
 */
export type FormState =
  | { status: "idle" }
  | { status: "sent" }
  | { status: "ok"; inviteCode?: string }
  /** `code` is a key under ActionErrors in src/messages. */
  | { status: "error"; code: string };

export type FormAction = (state: FormState, formData: FormData) => Promise<FormState>;

export const idle: FormState = { status: "idle" };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inviteAlphabet = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{10}$/;

/**
 * PREVIEW ONLY, used until the forms are given real actions. Checks the
 * fields the same way the server does, but signs nobody in.
 */
export const previewAction: FormAction = async (_state, formData) => {
  await new Promise((r) => setTimeout(r, 500));

  const email = formData.get("email");
  if (email !== null && !emailPattern.test(String(email).trim())) {
    return { status: "error", code: "invalid_email" };
  }
  const role = formData.get("role");
  if (formData.has("displayName") && role !== "teen" && role !== "parent") {
    return { status: "error", code: "invalid_role" };
  }
  const name = formData.get("displayName");
  if (name !== null && !String(name).trim()) {
    return { status: "error", code: "invalid_name" };
  }
  const password = formData.get("password");
  if (password && String(password).length < 8) {
    return { status: "error", code: "invalid_password" };
  }
  const code = formData.get("inviteCode");
  if (code !== null) {
    const clean = String(code).replace(/[\s-]/g, "").toUpperCase();
    return inviteAlphabet.test(clean)
      ? { status: "ok" }
      : { status: "error", code: "invalid_invite" };
  }
  return { status: "sent" };
};
