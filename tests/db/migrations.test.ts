import { beforeAll, describe, expect, it } from "vitest";
import { createDb, migrationFiles, type Db } from "./harness";

let db: Db;

beforeAll(async () => {
  db = await createDb();
}, 60_000);

describe("migrations", () => {
  it("are numbered in order without gaps", () => {
    const numbers = migrationFiles().map((f) => Number(f.slice(0, 4)));
    expect(numbers).toEqual(numbers.map((_, i) => i + 1));
  });

  it("enable RLS on every public table", async () => {
    const { rows } = await db.query<{ relname: string }>(
      `select c.relname from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`,
    );
    expect(rows.map((r) => r.relname)).toEqual([]);
  });

  it("make every view security_invoker", async () => {
    const { rows } = await db.query<{ relname: string }>(
      `select c.relname from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'v'
         and not coalesce('security_invoker=true' = any(c.reloptions), false)`,
    );
    expect(rows.map((r) => r.relname)).toEqual([]);
  });

  it("give anon no access to any table or view", async () => {
    const { rows } = await db.query<{ table_name: string }>(
      `select distinct table_name from information_schema.role_table_grants
       where grantee = 'anon' and table_schema = 'public'`,
    );
    expect(rows).toEqual([]);
  });

  it("publish the realtime tables", async () => {
    const { rows } = await db.query<{ tablename: string }>(
      `select tablename from pg_publication_tables
       where pubname = 'supabase_realtime' order by tablename`,
    );
    expect(rows.map((r) => r.tablename)).toEqual([
      "dose_logs",
      "notifications",
      "parent_confirmations",
    ]);
  });

  it("create all 18 guide tables", async () => {
    const { rows } = await db.query<{ n: number }>(
      `select count(*)::int as n from pg_tables where schemaname = 'public'`,
    );
    expect(rows[0].n).toBe(18);
  });
});
