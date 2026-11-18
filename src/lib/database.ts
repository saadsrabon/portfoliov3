import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import * as schema from "../db/schema";

type AnyDb = ReturnType<typeof drizzlePg>;
type DatabaseState = { db: AnyDb; close?: () => Promise<void> };
const globalDatabase = globalThis as typeof globalThis & { __portfolioDatabase?: Promise<DatabaseState> };

async function openDatabase(): Promise<DatabaseState> {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    const pool = new Pool({ connectionString, max: process.env.VERCEL ? 2 : 5, idleTimeoutMillis: 10_000 });
    const db = drizzlePg(pool, { schema });
    if (process.env.NODE_ENV !== "production" || process.env.DATABASE_AUTO_MIGRATE === "true") {
      const migration = readFileSync(join(process.cwd(), "drizzle", "0001_initial.sql"), "utf8");
      await pool.query(migration);
    }
    return { db, close: () => pool.end() };
  }

  if (process.env.NODE_ENV === "production" && process.env.PORTFOLIO_ALLOW_LOCAL_DB !== "true") {
    throw new Error("DATABASE_URL is required for the production admin backend.");
  }

  const directory = process.env.PORTFOLIO_DATABASE_DIR ?? join(process.cwd(), ".local", "portfolio-db");
  mkdirSync(join(directory, ".."), { recursive: true });
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
  const client = new PGlite(directory);
  await client.waitReady;
  const db = drizzlePglite(client, { schema }) as unknown as AnyDb;
  const migration = readFileSync(join(process.cwd(), "drizzle", "0001_initial.sql"), "utf8");
  await client.exec(migration);
  return { db, close: () => client.close() };
}

export async function getDatabase(): Promise<AnyDb> {
  globalDatabase.__portfolioDatabase ??= openDatabase();
  return (await globalDatabase.__portfolioDatabase).db;
}

export async function closeDatabaseForTests() {
  if (!globalDatabase.__portfolioDatabase) return;
  const state = await globalDatabase.__portfolioDatabase;
  await state.close?.();
  delete globalDatabase.__portfolioDatabase;
}

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL) || process.env.NODE_ENV !== "production" || process.env.PORTFOLIO_ALLOW_LOCAL_DB === "true";
}
