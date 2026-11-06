import { describe, expect, it } from "vitest";
import { actionErrorCodes } from "@/lib/actions/state";
import en from "@/messages/en.json";
import es from "@/messages/es.json";

describe("action error codes", () => {
  it("each have a message in every locale", () => {
    for (const code of actionErrorCodes) {
      expect(en.ActionErrors[code], code).toBeTruthy();
      expect(es.ActionErrors[code], code).toBeTruthy();
    }
  });
});
