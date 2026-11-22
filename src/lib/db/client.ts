import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { env } from "@/lib/env";
import { singleton } from "@/lib/singleton";
import * as schema from "./schema";

export type Database = LibSQLDatabase<typeof schema>;

const MIGRATIONS_FOLDER = path.join(process.cwd(), "drizzle");

function ensureLocalDirectory(url: string): void {
  if (!url.startsWith("file:")) return;
  mkdirSync(path.dirname(path.resolve(url.slice("file:".length))), { recursive: true });
}

function schemaVersion(): number {
  const journal = JSON.parse(readFileSync(path.join(MIGRATIONS_FOLDER, "meta", "_journal.json"), "utf8")) as {
    entries: unknown[];
  };
  return journal.entries.length;
}

async function connect(): Promise<Database> {
  ensureLocalDirectory(env.DATABASE_URL);
  const client = createClient({ url: env.DATABASE_URL, authToken: env.DATABASE_AUTH_TOKEN });
  const database = drizzle(client, { schema });
  await migrate(database, { migrationsFolder: MIGRATIONS_FOLDER });
  return database;
}

export function getDb(): Promise<Database> {
  return singleton(`database:v${schemaVersion()}`, connect);
}
