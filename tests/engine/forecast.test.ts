import { describe, expect, it } from "vitest";
import { daysUntilCheckin, needsPerson, weatherSignal } from "@/lib/engine/forecast";

describe("weatherSignal", () => {
  it("maps each weather to a care signal", () => {
    expect(weatherSignal("sunny")).toBe("doing_well");
    expect(weatherSignal("cloudy")).toBe("watch");
    expect(weatherSignal("rainy")).toBe("check_soon");
    expect(weatherSignal("stormy")).toBe("needs_person");
  });

  it("treats no reply as fog", () => {
    expect(weatherSignal(null)).toBe("fog");
  });

  it("asks a person to step in for storms and fog only", () => {
    expect(needsPerson("needs_person")).toBe(true);
    expect(needsPerson("fog")).toBe(true);
    expect(needsPerson("check_soon")).toBe(false);
    expect(needsPerson("doing_well")).toBe(false);
  });
});

describe("daysUntilCheckin (Mondays and Thursdays)", () => {
  it("is 0 on a check-in day", () => {
    expect(daysUntilCheckin(1)).toBe(0);
    expect(daysUntilCheckin(4)).toBe(0);
  });

  it("counts to the next one, across the weekend", () => {
    expect(daysUntilCheckin(2)).toBe(2); // Tue -> Thu
    expect(daysUntilCheckin(5)).toBe(3); // Fri -> Mon
    expect(daysUntilCheckin(0)).toBe(1); // Sun -> Mon
  });
});
