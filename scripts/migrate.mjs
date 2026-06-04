import "./load-env.mjs";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(
    "DATABASE_URL is required. Set it in .env.local (see .env.example).",
  );
  process.exit(1);
}

const connection = postgres(databaseUrl, { max: 1 });
const db = drizzle(connection);

console.log("Running migrations…");
await migrate(db, { migrationsFolder: "./drizzle" });
console.log("Migrations complete.");
await connection.end();
