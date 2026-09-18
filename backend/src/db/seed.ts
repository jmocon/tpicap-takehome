import { loadEnv } from "../config/env.js";
import { getDb } from "./client.js";
import { runMigrations } from "./migrate.js";
import { seedInitial } from "./seeds/initial-seed.js";
import { seedMock } from "./seeds/mock-seed.js";

const mode = process.argv[2] ?? "initial";
const env = loadEnv();
const db = getDb(env.databaseFile);
runMigrations(db);

if (mode === "mock") {
  seedMock(db);
} else if (mode === "initial") {
  seedInitial(db);
} else {
  console.error(`Unknown seed mode "${mode}". Use "initial" or "mock".`);
  process.exit(1);
}
