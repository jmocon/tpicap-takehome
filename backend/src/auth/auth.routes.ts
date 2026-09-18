import { Router } from "express";
import type { AuthController } from "./auth.controller.js";

/** Mounted before `authMiddleware` in app.ts — login itself must stay public. */
export function authRoutes(controller: AuthController): Router {
  const router = Router();

  router.post("/login", controller.login);

  return router;
}
