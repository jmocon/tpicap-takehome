import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { rowToUser, type User, type UserRow } from "./auth.types.js";

export function generateUserId(): string {
  return `USR-${randomUUID().split("-")[0]!.toUpperCase()}`;
}

export class UsersRepository {
  constructor(private readonly db: DatabaseSync) {}

  findByUsername(username: string): User | undefined {
    const row = this.db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    return row ? rowToUser(row as unknown as UserRow) : undefined;
  }

  create(username: string, passwordHash: string): User {
    const id = generateUserId();

    this.db
      .prepare(`INSERT INTO users (id, username, password_hash) VALUES (@id, @username, @passwordHash)`)
      .run({ id, username, passwordHash });

    return this.findByUsername(username)!;
  }

  count(): number {
    const { count } = this.db.prepare("SELECT COUNT(*) as count FROM users").get() as {
      count: number;
    };
    return count;
  }
}
