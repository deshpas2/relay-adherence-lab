import { describe, expect, it } from "vitest";
import { lintCopy, readingGrade, requiredDisclaimers } from "@/lib/content/lint";
import en from "@/messages/en.json";
import es from "@/messages/es.json";

const rules = (text: string, locale: "en" | "es" = "en") =>
  lintCopy(text, { locale }).map((issue) => issue.rule);

function strings(value: object): string[] {
  return Object.values(value).flatMap((child) =>
    typeof child === "object" && child !== null ? strings(child) : [String(child)],
  );
}

describe("dosing words", () => {
  it("rejects every word the guide lists", () => {
    for (const text of [
      "Try a double today.",
      "Take an extra one.",
      "You can skip this one.",
      "You can stop taking it.",
      "Take half now.",
      "You can take more.",
      "Crush it into food.",
      "Mix it with juice.",
      "Catch up later.",
    ]) {
      expect(rules(text), text).toContain("dosing");
    }
  });

  it("catches other forms of those words", () => {
    expect(rules("You skipped one.")).toContain("dosing");
    expect(rules("Doubling up is fine.")).toContain("dosing");
    expect(rules("It was mixed in.")).toContain("dosing");
  });

  it("doesn't trip on words that only contain them", () => {
    expect(rules("You're halfway! Keep going.")).toEqual([]);
    expect(rules("You are half-way there.")).toEqual([]);
    expect(rules("That was extraordinary work.")).toEqual([]);
  });

  it("allows the promise that we never change a dose", () => {
    expect(
      rules("We never change your dose or meds. Dose questions go to your care team."),
    ).toEqual([]);
  });

  it("works in Spanish", () => {
    expect(rules("Toma una doble hoy.", "es")).toContain("dosing");
    expect(rules("Puedes saltar esta.", "es")).toContain("dosing");
    expect(rules("Deja de tomar esto.", "es")).toContain("dosing");
    expect(rules("Toma media pastilla.", "es")).toContain("dosing");
    expect(rules("Toma más hoy.", "es")).toContain("dosing");
    expect(rules("¡Vas a la mitad! Sigue así.", "es")).toEqual([]);
  });
});

describe("shame words", () => {
  it("rejects every phrase the guide lists", () => {
    for (const text of [
      "You failed today.",
      "Don't be lazy.",
      "You should have done it.",
      "Why didn't you do it?",
      "Why didn’t you do it?",
    ]) {
      expect(rules(text), text).toContain("shame");
    }
  });

  it("rejects streak loss", () => {
    expect(rules("You lost your streak.")).toContain("shame");
  });

  it("works in Spanish", () => {
    expect(rules("Fallaste hoy.", "es")).toContain("shame");
    expect(rules("No seas perezoso.", "es")).toContain("shame");
    expect(rules("Deberías haberlo hecho.", "es")).toContain("shame");
    expect(rules("¿Por qué no lo tomaste?", "es")).toContain("shame");
  });
});

describe("medication names", () => {
  it("allows names in the catalog", () => {
    expect(rules("Tacrolimus helps your new kidney.")).toEqual([]);
    expect(rules("La prednisona ayuda a tu cuerpo.", "es")).toEqual([]);
  });

  it("rejects known names outside the catalog", () => {
    expect(rules("Ibuprofen can help you.")).toContain("medication");
    expect(rules("Ask about cyclosporine.")).toContain("medication");
  });

  it("rejects names it has never seen, by drug-name ending", () => {
    expect(rules("Ask about sirolimus today.")).toContain("medication");
    expect(rules("Ask about azithromycin today.")).toContain("medication");
    expect(rules("Ask about lisinopril today.")).toContain("medication");
  });

  it("uses the catalog it is given", () => {
    expect(
      lintCopy("Ask about sirolimus today.", { catalog: ["Sirolimus"] }),
    ).toEqual([]);
    expect(
      lintCopy("Tacrolimus helps you.", { catalog: [] }).map((i) => i.rule),
    ).toContain("medication");
  });

  it("doesn't mistake everyday words for medicines", () => {
    expect(rules("See you in April for some chocolate.")).toEqual([]);
    expect(rules("Una persona quiere vivir y servir.", "es")).toEqual([]);
  });
});

describe("exclamation marks", () => {
  it("allows one", () => {
    expect(rules("Nice work!")).toEqual([]);
  });

  it("rejects two or more", () => {
    expect(rules("Nice! Great work!")).toContain("exclamation");
    expect(rules("Nice work!!")).toContain("exclamation");
  });

  it("doesn't count the Spanish opening mark", () => {
    expect(rules("¡Muy bien!", "es")).toEqual([]);
  });
});

describe("reading level", () => {
  it("passes plain writing", () => {
    expect(
      rules("Your new kidney needs this. It helps your body stay calm each day."),
    ).toEqual([]);
  });

  it("rejects hard writing", () => {
    expect(
      rules("Immunosuppressive therapy necessitates consistent administration."),
    ).toContain("reading_level");
  });

  it("rejects hard Spanish", () => {
    expect(
      rules(
        "La administración consistente de terapias inmunosupresoras representa una responsabilidad extraordinariamente fundamental para conservar adecuadamente el funcionamiento renal.",
        "es",
      ),
    ).toContain("reading_level");
  });

  it("passes plain Spanish", () => {
    expect(
      rules("Tu riñón nuevo te ayuda mucho. Cuida tu cuerpo cada día.", "es"),
    ).toEqual([]);
  });

  it("skips labels too short to score", () => {
    expect(rules("Medication")).toEqual([]);
    expect(rules("Took it")).toEqual([]);
  });

  it("doesn't count catalog names against the writer", () => {
    expect(
      rules("Mycophenolate and tacrolimus help your body keep your kidney."),
    ).toEqual([]);
  });

  it("scores longer sentences higher", () => {
    const short = readingGrade("The cat sat. The dog ran.", "en");
    const long = readingGrade(
      "The considerable investigation demonstrated significant organizational complications.",
      "en",
    );
    expect(long).toBeGreaterThan(short);
  });
});

describe("message placeholders", () => {
  it("ignores placeholders and tags", () => {
    expect(rules("Nice work {name}, you earned {xp} points.")).toEqual([]);
    expect(rules("Tap <b>here</b> to see it.")).toEqual([]);
  });
});

describe("required disclaimers", () => {
  it("skip only the reading-level check", () => {
    for (const text of requiredDisclaimers) {
      expect(rules(text), text).toEqual([]);
    }
  });
});

describe("harmful copy worded to avoid the guide's list", () => {
  it("catches dose changes", () => {
    for (const text of [
      "Just take two tomorrow.",
      "Take twice as much next time.",
      "You can drop this pill for a while.",
      "You don't need this medicine anymore.",
      "You no longer need your meds.",
      "Cut the pill in two.",
      "You can take less today.",
    ]) {
      expect(rules(text), text).toContain("dosing");
    }
  });

  it("catches blame", () => {
    for (const text of [
      "You let your care team down today.",
      "You forgot again.",
      "Try harder.",
      "You should've taken it.",
      "This is your fault.",
      "Your streak is gone.",
      "We are disappointed.",
    ]) {
      expect(rules(text), text).toContain("shame");
    }
  });

  it("catches brand names", () => {
    for (const text of [
      "Prograf is your medicine.",
      "CellCept helps your kidney.",
      "Metformin helps you.",
      "Take Zoloft with this.",
    ]) {
      expect(rules(text), text).toContain("medication");
    }
  });

  it("catches the same things in Spanish", () => {
    expect(rules("Toma dos mañana para compensar.", "es")).toContain("dosing");
    expect(rules("Puedes dejar esta pastilla.", "es")).toContain("dosing");
    expect(rules("No necesitas tu medicina.", "es")).toContain("dosing");
    expect(rules("Es tu culpa.", "es")).toContain("shame");
    expect(rules("Olvidaste otra vez.", "es")).toContain("shame");
  });

  it("still allows kind wording", () => {
    expect(rules("It's not your fault.")).toEqual([]);
    expect(rules("No es tu culpa.", "es")).toEqual([]);
    expect(rules("Sometimes I forget in the morning.")).toEqual([]);
    expect(rules("You don't need to do this alone.")).toEqual([]);
  });
});

describe("the guide's own copy", () => {
  it("passes", () => {
    for (const text of [
      "You're halfway! Morning pills are working great so far.",
      "Your 2-week test is done. See what won →",
      "We never change your dose or meds — dose questions go to your care team",
      "your care team sees your experiment results; you choose what your parent sees",
      "your kidney needs this so your body doesn't reject it",
      "you take this → it calms your immune system → your body doesn't attack your new kidney → you stay healthy.",
      "too close to call — keep going",
      "Level 3: the Morning Routine Challenge",
    ]) {
      expect(rules(text), text).toEqual([]);
    }
  });
});

describe("the disclaimer exemption", () => {
  it("survives spacing changes", () => {
    expect(
      rules("Sample education, reviewed by your care team.  Not medical advice."),
    ).toEqual([]);
  });

  it("doesn't cover other text", () => {
    expect(
      rules("Sample education, reviewed by your care team. Not medical advice. Immunosuppressive administration."),
    ).toContain("reading_level");
  });
});

describe("every message in the app", () => {
  it("passes in English", () => {
    for (const text of strings(en)) expect(rules(text), text).toEqual([]);
  });

  it("passes in Spanish", () => {
    for (const text of strings(es)) expect(rules(text, "es"), text).toEqual([]);
  });
});
