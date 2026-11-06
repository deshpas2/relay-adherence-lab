import { describe, expect, it } from "vitest";
import { isSafe } from "@/components/experiments/designer";

describe("teen-written experiment ideas", () => {
  it("allow routine changes", () => {
    expect(isSafe("Pills next to my toothbrush", "en")).toBe(true);
    expect(isSafe("A friend texts me", "en")).toBe(true);
    expect(isSafe("Un amigo me manda un mensaje", "es")).toBe(true);
  });

  it("block changes to the dose or medicine", () => {
    expect(isSafe("Take half my pills", "en")).toBe(false);
    expect(isSafe("Skip the morning dose", "en")).toBe(false);
    expect(isSafe("Take a double dose at night", "en")).toBe(false);
    expect(isSafe("Switch to Prograf", "en")).toBe(false);
  });
});
