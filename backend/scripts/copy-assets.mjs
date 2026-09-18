// tsc only compiles .ts files — the migration .sql files are read at runtime
// (see src/db/migrate.ts) and need to be copied into dist/ alongside it.
// Plain Node + fs.cpSync keeps this cross-platform (no shell-specific `cp`).
import { cpSync } from "node:fs";

cpSync("src/db/migrations", "dist/db/migrations", { recursive: true });
