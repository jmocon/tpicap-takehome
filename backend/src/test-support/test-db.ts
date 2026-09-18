import { DatabaseSync } from "node:sqlite";
import { runMigrations } from "../db/migrate.js";

/** Spins up a fresh, isolated in-memory sqlite db with migrations applied. */
export function createTestDb(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  runMigrations(db);
  return db;
}
