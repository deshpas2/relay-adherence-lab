import type { PersonalMessage } from "@/lib/engine/personalize";

type Translate = (key: string, params?: Record<string, string | number>) => string;

/** Turns the engine's keys into the notification's title and body. */
export function reminderText(msg: PersonalMessage, t: Translate) {
  return {
    title: t(msg.titleKey, msg.params),
    body: msg.bodyKeys.map((k) => t(k, msg.params)).join(" "),
  };
}
