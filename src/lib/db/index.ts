import "server-only";

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { resolveDbConnection } from "@/lib/db/connection";
import * as schema from "@/lib/db/schema";

export { isDatabaseConfigured } from "@/lib/db/config";

export type Database = PostgresJsDatabase<typeof schema>;

let client: ReturnType<typeof postgres> | null = null;
let db: Database | null = null;

export function getDatabaseUrl(): string {
  return resolveDbConnection().url;
}

function postgresSslOption(url: string): false | "require" {
  if (process.env.DATABASE_SSL === "false") return false;
  if (process.env.DATABASE_SSL === "require") return "require";
  if (process.env.NODE_ENV !== "production") return false;

  try {
    const parsed = new URL(url.replace(/^postgresql:/, "http:"));
    const host = parsed.hostname.toLowerCase();
    const local =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "postgres" ||
      host.endsWith(".internal");
    return local ? false : "require";
  } catch {
    return "require";
  }
}

function createPostgresClient(url: string, viaHyperdrive: boolean) {
  const timeouts = viaHyperdrive
    ? { connect_timeout: 10, idle_timeout: 20 }
    : {};

  if (viaHyperdrive) {
    return postgres(url, {
      max: 5,
      fetch_types: false,
      prepare: false,
      ssl: postgresSslOption(url),
      ...timeouts,
    });
  }
  return postgres(url, { max: 10, ssl: postgresSslOption(url), ...timeouts });
}

export function getPostgresSql(): ReturnType<typeof postgres> {
  if (!client) getDb();
  if (!client) {
    throw new Error("Postgres client is not initialized");
  }
  return client;
}

export function getDb(): Database {
  if (db) return db;
  const { url, viaHyperdrive } = resolveDbConnection();
  client = createPostgresClient(url, viaHyperdrive);
  db = drizzle(client, { schema });
  return db;
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.end();
    client = null;
    db = null;
  }
}

export { schema };
