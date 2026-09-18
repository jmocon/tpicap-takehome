import type { Request, Response } from "express";
import { ValidationError } from "../shared/errors.js";
import { ok } from "../shared/api-response.js";
import type { TradesService } from "./trades.service.js";
import { SORTABLE_FIELDS, type SortField, type SortSpec, type TradeFilters } from "./trades.repository.js";
import { amendTradeSchema, createTradeSchema } from "./trades.validation.js";

const SORTABLE_FIELD_SET = new Set<string>(SORTABLE_FIELDS);

function parseSort(query: Request["query"]): SortSpec | undefined {
  const field = query.sortBy;
  if (typeof field !== "string" || !SORTABLE_FIELD_SET.has(field)) {
    return undefined;
  }
  const direction = query.sortDir === "asc" ? "asc" : "desc";
  return { field: field as SortField, direction };
}

function parseFilters(query: Request["query"]): TradeFilters {
  const filters: TradeFilters = {};
  if (typeof query.symbol === "string") filters.symbol = query.symbol;
  if (typeof query.trader === "string") filters.trader = query.trader;
  if (query.side === "BUY" || query.side === "SELL") filters.side = query.side;
  if (query.status === "ACTIVE" || query.status === "CANCELLED") filters.status = query.status;
  return filters;
}

export class TradesController {
  constructor(private readonly service: TradesService) {}

  list = (req: Request, res: Response) => {
    const trades = this.service.list(parseFilters(req.query), parseSort(req.query));
    res.json(ok(trades));
  };

  get = (req: Request, res: Response) => {
    const trade = this.service.get(req.params.id!);
    res.json(ok(trade));
  };

  create = (req: Request, res: Response) => {
    const parsed = createTradeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid trade payload", parsed.error.flatten());
    }
    const trade = this.service.create(parsed.data);
    res.status(201).json(ok(trade));
  };

  amend = (req: Request, res: Response) => {
    const parsed = amendTradeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Invalid trade payload", parsed.error.flatten());
    }
    const trade = this.service.amend(req.params.id!, parsed.data);
    res.json(ok(trade));
  };

  cancel = (req: Request, res: Response) => {
    const trade = this.service.cancel(req.params.id!);
    res.json(ok(trade));
  };
}
