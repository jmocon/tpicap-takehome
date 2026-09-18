import { Router } from "express";
import type { TradesController } from "./trades.controller.js";

export function tradesRoutes(controller: TradesController): Router {
  const router = Router();

  router.get("/", controller.list);
  router.get("/:id/audit", controller.listAudit);
  router.get("/:id", controller.get);
  router.post("/", controller.create);
  router.patch("/:id", controller.amend);
  router.post("/:id/cancel", controller.cancel);

  return router;
}
