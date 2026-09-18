import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

let db: DatabaseSync | undefined;

export function getDb(databaseFile: string): DatabaseSync {
  if (db) return db;
  if (databaseFile !== ":memory:") {
    mkdirSync(dirname(databaseFile), { recursive: true });
  }
  db = new DatabaseSync(databaseFile);
  db.exec("PRAGMA foreign_keys = ON;");
  return db;
}

export function resetDbForTests(): void {
  db = undefined;
}
