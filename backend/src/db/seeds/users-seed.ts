import type { DatabaseSync } from "node:sqlite";
import { hashPassword } from "../../auth/password.js";
import { UsersRepository } from "../../auth/users.repository.js";

/**
 * Small, hand-curated, deterministic demo credentials — mirrors
 * `initial-seed.ts`'s guard-if-already-populated pattern. Plaintext here is
 * fine: these are throwaway demo accounts for a take-home, not real
 * credentials, and the point is reviewers can log in without asking anyone.
 */
const DEMO_USERS = [
  { username: "trader1", password: "trader1pass" },
  { username: "trader2", password: "trader2pass" },
] as const;

export function seedUsers(db: DatabaseSync): void {
  const repository = new UsersRepository(db);
  const count = repository.count();
  if (count > 0) {
    console.log(`Skipping user seed: users table already has ${count} row(s).`);
    return;
  }

  for (const { username, password } of DEMO_USERS) {
    repository.create(username, hashPassword(password));
  }

  console.log(`Inserted ${DEMO_USERS.length} demo users.`);
}
