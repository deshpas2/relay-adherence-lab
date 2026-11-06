// Seeded copy must pass the copy-lint rules in BUILD_GUIDE.md Section 6.4.
//
// These rules are restated here so the seed is checked today. Once Lane
// Backend lands src/lib/content/lint.ts, swap `lintEnglish` for it.
import { beforeAll, describe, expect, it } from "vitest";
import { createDb, type Db } from "./harness";

const DOSING = /(double|extra|skip|stop taking|half|take more|crush|mix|catch up)/i;
const SHAME = /(failed|lazy|should have|why didn't)/i;
// Words that look like drug names; each must be in the catalog.
const DRUG_LIKE = /\b\w+(imus|olate|olato|isone|isona|ipine|ipino|pril|statin|cillin|azole|mab)\b/gi;

let db: Db;
let catalogNames: Set<string>;

type Copy = { where: string; locale: string; text: string };
let copy: Copy[];

function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "").match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups?.length ?? 1);
}

/** Flesch–Kincaid grade, ignoring catalog medicine names (unavoidable proper nouns). */
function grade(text: string): number {
  const sentences = Math.max(1, text.split(/[.!?]+/).filter((s) => s.trim()).length);
  const words = text.split(/\s+/).filter((w) => /[a-z]/i.test(w));
  const counted = words.filter((w) => !catalogNames.has(w.toLowerCase().replace(/[^a-z]/g, "")));
  const syl = counted.reduce((n, w) => n + syllables(w), 0);
  return 0.39 * (words.length / sentences) + 11.8 * (syl / Math.max(1, counted.length)) - 15.59;
}

function lintCommon(c: Copy): string[] {
  const problems: string[] = [];
  if ((c.text.match(/!/g) ?? []).length > 1) problems.push("more than one !");
  for (const m of c.text.matchAll(DRUG_LIKE)) {
    if (!catalogNames.has(m[0].toLowerCase())) problems.push(`unknown med name "${m[0]}"`);
  }
  return problems;
}

function lintEnglish(c: Copy): string[] {
  const problems = lintCommon(c);
  if (DOSING.test(c.text)) problems.push(`dosing word: ${c.text.match(DOSING)![0]}`);
  if (SHAME.test(c.text)) problems.push(`shame word: ${c.text.match(SHAME)![0]}`);
  // Reading-level formulas are noise on 1–3 word labels; grade sentences.
  if (c.text.split(/\s+/).length >= 8) {
    const g = grade(c.text);
    if (g > 6) problems.push(`grade ${g.toFixed(1)} > 6`);
  }
  return problems;
}

beforeAll(async () => {
  db = await createDb();

  const meds = await db.query<{ display_name: string; i18n: { es?: { display_name?: string } } }>(
    `select display_name, i18n from medications`,
  );
  catalogNames = new Set(
    meds.rows.flatMap((m) => [m.display_name, m.i18n.es?.display_name ?? ""]).map((n) => n.toLowerCase()).filter(Boolean),
  );

  copy = [];
  const add = (where: string, locale: string, text: unknown) => {
    if (typeof text === "string") copy.push({ where, locale, text });
  };

  for (const b of (await db.query<{ key: string; label: string; i18n: Record<string, { label: string }> }>(
    `select key, label, i18n from barriers`)).rows) {
    add(`barrier ${b.key}`, "en", b.label);
    add(`barrier ${b.key}`, "es", b.i18n.es?.label);
  }
  for (const table of ["quests", "achievements"]) {
    for (const q of (await db.query<{ key: string; title: string; description: string; i18n: Record<string, Record<string, string>> }>(
      `select key, title, description, i18n from ${table}`)).rows) {
      add(`${table} ${q.key}`, "en", q.title);
      add(`${table} ${q.key}`, "en", q.description);
      add(`${table} ${q.key}`, "es", q.i18n.es?.title);
      add(`${table} ${q.key}`, "es", q.i18n.es?.description);
    }
  }
  for (const c of (await db.query<{
    slug: string; locale: string; what_it_is: string; why_it_matters: string;
    ingredients: { name: string; role: string; plain: string }[]; flow: { step: number; text: string }[];
  }>(`select m.slug, c.* from medication_content c join medications m on m.id = c.medication_id`)).rows) {
    const where = `med ${c.slug}`;
    add(where, c.locale, c.what_it_is);
    add(where, c.locale, c.why_it_matters);
    for (const i of c.ingredients) {
      add(where, c.locale, i.role);
      add(where, c.locale, i.plain);
    }
    for (const f of c.flow) add(where, c.locale, f.text);
  }
}, 60_000);

describe("seed catalog", () => {
  it("has the expected rows", async () => {
    const { rows } = await db.query(`select
      (select count(*)::int from barriers) as barriers,
      (select count(*)::int from quests) as quests,
      (select count(*)::int from achievements) as achievements,
      (select count(*)::int from medications) as medications,
      (select count(*)::int from medication_content) as content`);
    expect(rows[0]).toEqual({ barriers: 8, quests: 6, achievements: 5, medications: 4, content: 8 });
  });

  it("covers every quest kind the game engine uses", async () => {
    const { rows } = await db.query<{ kind: string }>(`select distinct kind from quests order by kind`);
    expect(rows.map((r) => r.kind)).toEqual(["experiment", "explore", "onboard", "streak"]);
  });

  it("has English and Spanish content with matching shape for every med", async () => {
    const { rows } = await db.query<{ slug: string; locales: string[]; ingredient_counts: number[]; flow_counts: number[] }>(
      `select m.slug,
              array_agg(c.locale order by c.locale) as locales,
              array_agg(jsonb_array_length(c.ingredients) order by c.locale) as ingredient_counts,
              array_agg(jsonb_array_length(c.flow) order by c.locale) as flow_counts
       from medications m left join medication_content c on c.medication_id = m.id
       group by m.slug`,
    );
    for (const r of rows) {
      expect(r.locales, r.slug).toEqual(["en", "es"]);
      expect(r.ingredient_counts[0], r.slug).toBe(r.ingredient_counts[1]);
      expect(r.flow_counts[0], r.slug).toBe(r.flow_counts[1]);
    }
  });

  it("marks all medicine content as not yet clinically reviewed", async () => {
    const { rows } = await db.query(`select count(*)::int as n from medication_content where reviewed`);
    expect(rows[0]).toEqual({ n: 0 });
  });

  it("translates every string", () => {
    const en = copy.filter((c) => c.locale === "en").length;
    const es = copy.filter((c) => c.locale === "es").length;
    expect(en).toBeGreaterThan(50);
    expect(es).toBe(en);
  });
});

describe("seed copy lint", () => {
  it("passes the English rules: no dosing or shame words, grade ≤ 6, ≤ 1 '!', catalog names only", () => {
    const failures = copy
      .filter((c) => c.locale === "en")
      .flatMap((c) => lintEnglish(c).map((p) => `${c.where}: ${p} — "${c.text}"`));
    expect(failures).toEqual([]);
  });

  it("keeps each medicine's whole English explanation at grade ≤ 6", () => {
    const byMed = new Map<string, string[]>();
    for (const c of copy.filter((x) => x.locale === "en" && x.where.startsWith("med "))) {
      byMed.set(c.where, [...(byMed.get(c.where) ?? []), c.text]);
    }
    expect(byMed.size).toBe(4);
    const grades = [...byMed].map(([where, texts]) => [where, Number(grade(texts.join(" ")).toFixed(1))]);
    expect(grades.filter(([, g]) => (g as number) > 6)).toEqual([]);
  });

  it("passes the language-independent rules in Spanish", () => {
    const failures = copy
      .filter((c) => c.locale === "es")
      .flatMap((c) => lintCommon(c).map((p) => `${c.where}: ${p} — "${c.text}"`));
    expect(failures).toEqual([]);
  });

  it("flags bad copy (self-check of the rules above)", () => {
    const bad = (text: string) => lintEnglish({ where: "t", locale: "en", text });
    expect(bad("You can double up if you miss one.")).not.toEqual([]);
    expect(bad("You failed again.")).not.toEqual([]);
    expect(bad("Wow! Great! Nice!")).not.toEqual([]);
    expect(bad("Sirolimus helps too.")).not.toEqual([]);
    expect(bad("Immunosuppressive pharmacotherapy necessitates consistent administration to prevent allograft rejection.")).not.toEqual([]);
    expect(bad("Tacrolimus helps keep your kidney safe.")).toEqual([]);
  });
});
