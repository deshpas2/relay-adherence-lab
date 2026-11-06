// Runs supabase/migrations/*.sql in an in-process Postgres (PGlite) with a
// minimal stand-in for the parts of Supabase the migrations rely on: the
// anon / authenticated / service_role roles, auth.users, auth.uid(), and the
// supabase_realtime publication. Lets us test schema + RLS without Docker or
// touching the shared hosted project.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite, type Transaction } from "@electric-sql/pglite";

const MIGRATIONS_DIR = join(__dirname, "..", "..", "supabase", "migrations");

const SUPABASE_SHIM = `
  create role anon nologin noinherit;
  create role authenticated nologin noinherit;
  create role service_role nologin noinherit bypassrls;

  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb not null default '{}',
    raw_app_meta_data jsonb not null default '{}'
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant execute on function auth.uid() to anon, authenticated, service_role;

  create publication supabase_realtime;
`;

export type Db = PGlite;

export function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

export async function createDb(): Promise<Db> {
  const db = new PGlite();
  await db.exec(SUPABASE_SHIM);
  for (const file of migrationFiles()) {
    try {
      await db.exec(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
    } catch (error) {
      throw new Error(`${file}: ${(error as Error).message}`);
    }
  }
  return db;
}

type Role = "anon" | "authenticated" | "service_role";

/**
 * Run `fn` as a Supabase API caller: `userId` becomes auth.uid(). Always
 * rolls back, so tests can't leak state into each other.
 */
export async function as<T>(
  db: Db,
  userId: string | null,
  fn: (tx: Transaction) => Promise<T>,
  role: Role = userId ? "authenticated" : "anon",
): Promise<T> {
  let result: T | undefined;
  const rollback = new Error("rollback");
  try {
    await db.transaction(async (tx) => {
      await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [userId ?? ""]);
      await tx.exec(`set local role ${role}`);
      result = await fn(tx);
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
  return result as T;
}

/** Create an auth user the way sign-up does; the trigger makes the profile. */
export async function createUser(
  db: Db,
  opts: {
    email: string;
    role?: "teen" | "parent";
    appRole?: "clinician";
    displayName?: string;
  },
): Promise<string> {
  const { rows } = await db.query<{ id: string }>(
    `insert into auth.users (email, raw_user_meta_data, raw_app_meta_data)
     values ($1, $2, $3) returning id`,
    [
      opts.email,
      JSON.stringify({ role: opts.role, display_name: opts.displayName }),
      JSON.stringify(opts.appRole ? { role: opts.appRole } : {}),
    ],
  );
  return rows[0].id;
}
