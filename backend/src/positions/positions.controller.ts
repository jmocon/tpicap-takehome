import type { Request, Response } from "express";
import { ok } from "../shared/api-response.js";
import type { PositionsService } from "./positions.service.js";

export class PositionsController {
  constructor(private readonly service: PositionsService) {}

  list = (_req: Request, res: Response) => {
    const positions = this.service.list();
    res.json(ok(positions));
  };
}
