import { Router } from "express";
import type { PositionsController } from "./positions.controller.js";

export function positionsRoutes(controller: PositionsController): Router {
  const router = Router();

  router.get("/", controller.list);

  return router;
}
