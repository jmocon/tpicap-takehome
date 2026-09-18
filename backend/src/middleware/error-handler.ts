import type { NextFunction, Request, Response } from "express";
import { AppError } from "../shared/errors.js";
import { fail } from "../shared/api-response.js";
import { logger } from "../shared/logger.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(fail(err.message, err.details));
    return;
  }

  logger.error("Unhandled error", { message: err instanceof Error ? err.message : String(err) });
  res.status(500).json(fail("Internal server error"));
}
