import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { getDb } from "./client.js";
import { loadEnv } from "../config/env.js";
import { logger } from "../shared/logger.js";

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "migrations");

export function runMigrations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);

  const applied = new Set(
    db
      .prepare("SELECT name FROM schema_migrations")
      .all()
      .map((row) => (row as { name: string }).name),
  );

  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    db.exec(sql);
    db.prepare("INSERT INTO schema_migrations (name) VALUES (?)").run(file);
    logger.info("Applied migration", { file });
  }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const env = loadEnv();
  runMigrations(getDb(env.databaseFile));
}
