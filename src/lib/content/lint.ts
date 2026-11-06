export type LintLocale = "en" | "es";
export type LintRule =
  | "dosing"
  | "shame"
  | "medication"
  | "reading_level"
  | "exclamation";
export type LintIssue = { rule: LintRule; match: string };

const maxGrade = 6;
/** Grade formulas give nonsense on labels like "Medication". */
const minWordsToScore = 5;
/** Below this, one miscounted syllable moves the grade by about 2. */
const minWordsForExactGrade = 8;
const shortTextTolerance = 3;

/** The sample medicines from BUILD_GUIDE.md 6.2, in both languages. */
export const sampleCatalog = [
  "tacrolimus",
  "mycophenolate",
  "micofenolato",
  "prednisone",
  "prednisona",
];

/**
 * Wording the hard rules fix word for word, which scores above grade 6. Only
 * the reading-level check is waived; every other check still applies.
 */
export const requiredDisclaimers = [
  "Sample education, reviewed by your care team. Not medical advice.",
];

const medicineNoun = "meds?|medicines?|medication|pills?|doses?|syrup";
const medicinaNoun = "medicinas?|medicamentos?|pastillas?|dosis|jarabe";

// Lookarounds stand in for \b, which ignores accented letters. Whole-word
// matching matters: the guide's plain /half/ would reject its own "halfway".
const words = (pattern: string) =>
  new RegExp(`(?<!\\p{L})(?:${pattern})(?!\\p{L})`, "iu");

const dosingPatterns: Record<LintLocale, RegExp> = {
  en: words(
    [
      "doubl(?:e|es|ed|ing)",
      "extra",
      "skip(?:s|ped|ping)?",
      "stop(?:s|ped|ping)? taking",
      "half(?![- ]?way)",
      "take more",
      "crush(?:es|ed|ing)?",
      "mix(?:es|ed|ing)?",
      "catch(?:es|ing)? up",
      "take (?:two|three|2|3|less)",
      "twice as much",
      `(?:drop|quit|pause|cut|split|break) (?:this|that|the|your|a) (?:${medicineNoun})`,
      `(?:don['’]t|do not|no longer) need (?:this|that|the|your) (?:${medicineNoun})`,
    ].join("|"),
  ),
  es: words(
    [
      "dobl(?:e|es|ar)",
      "extra",
      "salt(?:ar|arte|a|aste)",
      "omit(?:ir|e|iste)",
      "deja(?:r)? de tomar",
      "mitad de (?:la|tu|una)",
      "media (?:dosis|pastilla|tableta)",
      "toma(?:r)? más",
      "tritura(?:r)?",
      "machaca(?:r)?",
      "mezcla(?:r)?",
      "recupera(?:r)?",
      "compensar",
      "toma(?:r)? (?:dos|tres|2|3|menos)",
      `(?:dejar|cortar|partir) (?:esta|este|la|el|tu) (?:${medicinaNoun})`,
      `no necesitas (?:esta|este|la|el|tu|tus) (?:${medicinaNoun})`,
    ].join("|"),
  ),
};

const shamePatterns: Record<LintLocale, RegExp> = {
  en: words(
    [
      "fail(?:s|ed|ing|ure)?",
      "lazy",
      "should(?:n['’]t)? have",
      "should['’]ve",
      "why didn['’]t",
      "(?:lost|broke) your streak",
      "streak (?:is|was) (?:gone|over|lost|broken)",
      "let (?:\\p{L}+ ){1,3}down",
      "you forgot",
      "try harder",
      "(?<!not |n['’]t )your fault",
      "disappoint\\p{L}*",
    ].join("|"),
  ),
  es: words(
    [
      "fallaste",
      "fallado",
      "fracas\\p{L}*",
      "floj[oa]",
      "perezos[oa]",
      "deberías haber\\p{L}*",
      "por qué no (?:lo )?(?:tomaste|hiciste)",
      "perdiste tu racha",
      "olvidaste",
      "esfuérzate más",
      "(?<!no es )tu culpa",
      "decepcion\\p{L}*",
    ].join("|"),
  ),
};

/**
 * Common and transplant medicines, including brand names, which follow no
 * pattern. This can't be complete: it catches slips, it doesn't replace review.
 */
const knownMedications = new Set([
  "acetaminofén",
  "acetaminophen",
  "adderall",
  "advil",
  "aleve",
  "aspirin",
  "aspirina",
  "astagraf",
  "bactrim",
  "belatacept",
  "benadryl",
  "cellcept",
  "deltasone",
  "envarsus",
  "gengraf",
  "ibuprofen",
  "ibuprofeno",
  "imuran",
  "insulin",
  "insulina",
  "lexapro",
  "metformin",
  "metformina",
  "motrin",
  "myfortic",
  "naproxen",
  "naproxeno",
  "neoral",
  "nulojix",
  "paracetamol",
  "prograf",
  "prozac",
  "rapamune",
  "rayos",
  "ritalin",
  "sandimmune",
  "tylenol",
  "valcyte",
  "zoloft",
  "zortress",
]);

/** Drug-name endings, for names nobody thought to list. */
const medicationEnding =
  /(?:limus|sporin[ea]|mycin|micina|cillin|cilina|prazol|prazole|olol|sartan|statin|statina|ciclovir|thioprine|tioprina|solone|solona|imab|umab|[a-z]{3,}opril|[a-z]{3,}april|[a-z]{3,}ipril)$/;

function stripMarkup(text: string): string {
  let plain = text.normalize("NFC").replace(/<[^>]+>/g, " ");
  let previous;
  do {
    previous = plain;
    plain = plain.replace(/\{[^{}]*\}/g, " ");
  } while (plain !== previous);
  return plain;
}

const tokenize = (text: string) =>
  text.match(/[\p{L}\p{N}]+(?:['’]\p{L}+)?/gu) ?? [];

function englishSyllables(word: string): number {
  const letters = word.toLowerCase().replace(/[^a-z]/g, "");
  if (letters.length <= 3) return 1;
  const trimmed = letters
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "");
  return Math.max(1, trimmed.match(/[aeiouy]{1,2}/g)?.length ?? 1);
}

function spanishSyllables(word: string): number {
  const groups = word.toLowerCase().match(/[aeiouáéíóúü]+/g) ?? [];
  // Two strong vowels, or an accented weak one, are separate syllables.
  const hiatus = /[aeoáéó][aeoáéó]|[íú][aeiou]|[aeiou][íú]/;
  const count = groups.reduce(
    (total, group) => total + (hiatus.test(group) ? 2 : 1),
    0,
  );
  return Math.max(1, count);
}

/**
 * Estimated school grade: Flesch-Kincaid for English, Crawford for Spanish,
 * because English formulas overrate Spanish's longer words.
 */
export function readingGrade(text: string, locale: LintLocale): number {
  const tokens = tokenize(text);
  if (tokens.length === 0) return 0;

  const sentences = Math.max(
    1,
    // Arrows and colons end a step or heading, the way a full stop ends a sentence.
    text.split(/[.!?…:→]+/).filter((part) => tokenize(part).length > 0).length,
  );
  const syllableCount = locale === "es" ? spanishSyllables : englishSyllables;
  const syllables = tokens.reduce((sum, token) => sum + syllableCount(token), 0);

  if (locale === "es") {
    const sentencesPer100 = (sentences / tokens.length) * 100;
    const syllablesPer100 = (syllables / tokens.length) * 100;
    return -0.205 * sentencesPer100 + 0.049 * syllablesPer100 - 3.407;
  }
  return (
    0.39 * (tokens.length / sentences) +
    11.8 * (syllables / tokens.length) -
    15.59
  );
}

/**
 * Checks one teen-facing string and lists every problem. An empty list means
 * it passes. `catalog` is the allowed medicine names, from `medications`.
 */
export function lintCopy(
  text: string,
  options: { locale?: LintLocale; catalog?: readonly string[] } = {},
): LintIssue[] {
  const { locale = "en", catalog = sampleCatalog } = options;
  const plain = stripMarkup(text);
  const issues: LintIssue[] = [];

  const dosing = plain.match(dosingPatterns[locale]);
  if (dosing) issues.push({ rule: "dosing", match: dosing[0] });

  const shame = plain.match(shamePatterns[locale]);
  if (shame) issues.push({ rule: "shame", match: shame[0] });

  const allowed = new Set(
    catalog.flatMap((name) => tokenize(name.toLowerCase())),
  );
  for (const token of tokenize(plain.toLowerCase())) {
    const looksLikeMedicine =
      knownMedications.has(token) || medicationEnding.test(token);
    if (looksLikeMedicine && !allowed.has(token)) {
      issues.push({ rule: "medication", match: token });
    }
  }

  if ((plain.match(/!/g)?.length ?? 0) > 1) {
    issues.push({ rule: "exclamation", match: "!" });
  }

  // Medicine names are long but unavoidable, so they don't count against the
  // writer. Only approved names reach this point without an issue above.
  const scored = plain.replace(/[\p{L}\p{N}]+(?:['’]\p{L}+)?/gu, (token) =>
    allowed.has(token.toLowerCase()) ? "" : token,
  );
  const isRequired = requiredDisclaimers.includes(
    plain.replace(/\s+/g, " ").trim(),
  );
  const wordCount = tokenize(scored).length;
  if (!isRequired && wordCount >= minWordsToScore) {
    const grade = readingGrade(scored, locale);
    const limit =
      wordCount < minWordsForExactGrade
        ? maxGrade + shortTextTolerance
        : maxGrade;
    if (grade > limit) {
      issues.push({ rule: "reading_level", match: grade.toFixed(1) });
    }
  }

  return issues;
}
