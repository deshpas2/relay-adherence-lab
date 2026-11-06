// src/lib/types/database.ts must match the migrated schema exactly: same
// tables/views, same columns, same nullability, same enums. Catches a
// migration that wasn't followed by `npm run db:types`.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { Constants } from "@/lib/types/database";
import { createDb, type Db } from "./harness";

const source = readFileSync(join(__dirname, "..", "..", "src", "lib", "types", "database.ts"), "utf8");

/** { relation: { column: nullable } } parsed from each `Row: {…}` block. */
function rowsFromTypes(section: "Tables" | "Views"): Record<string, Record<string, boolean>> {
  // Only the `public` schema (the generator also emits graphql_public).
  const publicStart = source.indexOf("\n  public: {");
  const start = source.indexOf(`    ${section}: {`, publicStart);
  const end = source.indexOf(section === "Tables" ? "    Views: {" : "    Functions: {", publicStart);
  const body = source.slice(start, end);
  const out: Record<string, Record<string, boolean>> = {};
  for (const m of body.matchAll(/\n {6}(\w+): \{\n {8}Row: \{\n([\s\S]*?)\n {8}\}/g)) {
    out[m[1]] = Object.fromEntries(
      [...m[2].matchAll(/^\s+(\w+): (.+)$/gm)].map(([, col, type]) => [col, /\| null$|^unknown$/.test(type)]),
    );
  }
  return out;
}

let db: Db;
beforeAll(async () => {
  db = await createDb();
}, 60_000);

async function rowsFromDb(kind: "r" | "v") {
  const { rows } = await db.query<{ rel: string; col: string; nullable: boolean }>(
    `select c.relname as rel, a.attname as col, not a.attnotnull as nullable
     from pg_attribute a
     join pg_class c on c.oid = a.attrelid
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = $1 and a.attnum > 0 and not a.attisdropped`,
    [kind],
  );
  const out: Record<string, Record<string, boolean>> = {};
  for (const r of rows) (out[r.rel] ??= {})[r.col] = kind === "v" ? true : r.nullable;
  return out;
}

describe("database.ts matches the schema", () => {
  it("tables", async () => {
    expect(rowsFromTypes("Tables")).toEqual(await rowsFromDb("r"));
  });

  it("views", async () => {
    expect(rowsFromTypes("Views")).toEqual(await rowsFromDb("v"));
  });

  it("enums", async () => {
    const { rows } = await db.query<{ name: string; labels: string[] }>(
      `select t.typname as name, array_agg(e.enumlabel order by e.enumsortorder) as labels
       from pg_type t join pg_enum e on e.enumtypid = t.oid
       join pg_namespace n on n.oid = t.typnamespace
       where n.nspname = 'public' group by t.typname`,
    );
    expect(Constants.public.Enums).toEqual(Object.fromEntries(rows.map((r) => [r.name, r.labels])));
  });

  it("rpc functions", async () => {
    const { rows } = await db.query<{ proname: string }>(
      `select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' order by 1`,
    );
    for (const { proname } of rows) expect(source).toContain(`      ${proname}: {`);
    expect(rows.length).toBe(2);
  });
});
