import "server-only";

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";

export { isDatabaseConfigured } from "@/lib/db/config";

export type Database = PostgresJsDatabase<typeof schema>;

let client: ReturnType<typeof postgres> | null = null;
let db: Database | null = null;

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
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

export function getPostgresSql(): ReturnType<typeof postgres> {
  if (!client) getDb();
  if (!client) {
    throw new Error("Postgres client is not initialized");
  }
  return client;
}

export function getDb(): Database {
  if (db) return db;
  const url = getDatabaseUrl();
  client = postgres(url, { max: 10, ssl: postgresSslOption(url) });
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
