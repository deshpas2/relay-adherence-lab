import { describe, expect, it } from "vitest";
import { lintCopy } from "@/lib/content/lint";
import { sampleMeds } from "@/lib/fixtures/meds";

// Medicine education must never give dose advice or shame. (Reading level is
// left to clinician review: words like "immune system" score high on formulas.)
describe("sample medicine content", () => {
  for (const med of sampleMeds) {
    for (const locale of ["en", "es"] as const) {
      it(`${med.slug} (${locale}) has no dosing or shame words`, () => {
        const c = med.content[locale];
        const strings = [c.nick, c.hook, ...c.journey.flatMap((j) => [j.title, j.text]), ...c.facts.flat()];
        const issues = strings.flatMap((s) =>
          lintCopy(s, { locale }).filter((i) => i.rule === "dosing" || i.rule === "shame" || i.rule === "medication"),
        );
        expect(issues).toEqual([]);
      });
    }
  }
});
