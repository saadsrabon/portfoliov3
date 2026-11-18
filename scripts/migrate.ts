import { readFile } from "node:fs/promises";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set DATABASE_URL to the private PostgreSQL connection string before migrating.");

const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 10_000 });
try {
  const migration = await readFile(new URL("../drizzle/0001_initial.sql", import.meta.url), "utf8");
  await pool.query(migration);
  console.log("Portfolio database schema is ready.");
} finally {
  await pool.end();
}
