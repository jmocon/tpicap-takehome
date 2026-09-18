import type { AuditLogger } from "../audit/audit-logger.js";
import { diffTrade } from "../audit/diff-trade.js";
import type { Broadcaster } from "../realtime/broadcaster.js";
import { ConflictError, NotFoundError } from "../shared/errors.js";
import type { TradeFilters, SortSpec, TradesRepository } from "./trades.repository.js";
import { rowToTrade, type AmendTradeInput, type CreateTradeInput, type Trade } from "./trades.types.js";

export class TradesService {
  constructor(
    private readonly repository: TradesRepository,
    private readonly broadcaster: Broadcaster,
    private readonly auditLogger: AuditLogger,
  ) {}

  list(filters: TradeFilters, sort?: SortSpec): Trade[] {
    return this.repository.list(filters, sort).map(rowToTrade);
  }

  get(id: string): Trade {
    const row = this.repository.findById(id);
    if (!row) throw new NotFoundError(`Trade ${id} not found`);
    return rowToTrade(row);
  }

  create(input: CreateTradeInput): Trade {
    const trade = rowToTrade(this.repository.create(input));
    this.broadcaster.publish({ type: "trade.created", trade });
    return trade;
  }

  amend(id: string, input: AmendTradeInput): Trade {
    const existing = this.get(id);
    if (existing.status === "CANCELLED") {
      throw new ConflictError(`Trade ${id} is cancelled and cannot be amended`);
    }

    const row = this.repository.amend(id, input);
    if (!row) throw new NotFoundError(`Trade ${id} not found`);

    const trade = rowToTrade(row);

    // A no-op PATCH (e.g. an empty body, or values identical to what's already
    // stored) shouldn't leave a misleading "something changed" entry behind.
    const changes = diffTrade(existing, trade);
    if (Object.keys(changes).length > 0) {
      this.auditLogger.record({ tradeId: id, action: "AMEND", changes });
    }

    this.broadcaster.publish({ type: "trade.amended", trade });
    return trade;
  }

  cancel(id: string): Trade {
    const existing = this.get(id);
    if (existing.status === "CANCELLED") {
      throw new ConflictError(`Trade ${id} is already cancelled`);
    }

    const row = this.repository.cancel(id);
    if (!row) throw new NotFoundError(`Trade ${id} not found`);

    const trade = rowToTrade(row);
    this.auditLogger.record({
      tradeId: id,
      action: "CANCEL",
      changes: { status: { old: "ACTIVE", new: "CANCELLED" } },
    });
    this.broadcaster.publish({ type: "trade.cancelled", trade });
    return trade;
  }
}
