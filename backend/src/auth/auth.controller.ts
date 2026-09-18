import type { Request, Response } from "express";
import { ok } from "../shared/api-response.js";
import { ValidationError } from "../shared/errors.js";
import type { AuthService } from "./auth.service.js";
import { loginSchema } from "./auth.validation.js";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  login = (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid login payload", parsed.error.flatten());
    }
    const result = this.service.login(parsed.data.username, parsed.data.password);
    res.json(ok(result));
  };
}
