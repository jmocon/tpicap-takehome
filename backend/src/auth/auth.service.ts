import { UnauthorizedError } from "../shared/errors.js";
import { signToken } from "./jwt.js";
import { verifyPassword } from "./password.js";
import type { UsersRepository } from "./users.repository.js";

export interface LoginResult {
  token: string;
  user: { id: string; username: string };
}

export class AuthService {
  constructor(
    private readonly usersRepository: Pick<UsersRepository, "findByUsername">,
    private readonly jwtSecret: string,
  ) {}

  login(username: string, password: string): LoginResult {
    const user = this.usersRepository.findByUsername(username);

    // Deliberately the same error (message and status) for "no such user" and
    // "wrong password" — distinguishing them would let a caller enumerate
    // valid usernames by observing which failure they get.
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedError("Invalid username or password");
    }

    const authenticatedUser = { id: user.id, username: user.username };
    const token = signToken(authenticatedUser, this.jwtSecret);
    return { token, user: authenticatedUser };
  }
}
