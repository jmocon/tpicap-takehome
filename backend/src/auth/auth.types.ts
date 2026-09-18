export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
}

export function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
}

/** The narrow shape carried in a JWT and attached to `req.user` — never includes the password hash. */
export interface AuthenticatedUser {
  id: string;
  username: string;
}
