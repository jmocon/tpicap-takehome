# Take-Home Spec Detail

Full extraction of `Take Home Assessment - AI Task - TP ICAP Fusion Platform.pdf`. CLAUDE.md links here for detail; keep this file in sync if the brief changes.

## Business context

Simplified trade blotter for a broker: a real-time view of equity trades executed by traders/sales throughout the day. Users must be able to view, create, amend, and cancel trades, with updates reflected in real time across all connected clients.

## Technology requirements

- **Frontend:** React + TypeScript (required).
- **Backend:** TypeScript (required). Acceptable frameworks: Node.js+Express, NestJS, Fastify, Hono. May be deployed remotely (AWS/Azure/Heroku/etc.) instead of run locally.
- **Database:** any appropriate technology (PostgreSQL, SQLite, MongoDB, MySQL, etc.) — not prescribed.
- **Real-time transport:** WebSockets, Socket.IO, or Server-Sent Events — pick one.

## Trade model

Minimum required shape:

```ts
interface Trade {
  id: string;
  symbol: string;
  quantity: number;
  price: number;
  side: "BUY" | "SELL";
  trader: string;
  tradeDate: string;
  status: "ACTIVE" | "CANCELLED";
}
```

The model may be extended (e.g. with `book`, `counterparty`).

## Sample seed data shape

The brief's example records use a richer shape than the minimum model — reconcile the two when designing the persisted schema:

```json
{
  "tradeId": "TRD-100001",
  "symbol": "AAPL",
  "side": "BUY",
  "quantity": 5000,
  "price": 227.45,
  "trader": "JSMITH",
  "book": "EQUITIES_UK",
  "counterparty": "Goldman Sachs",
  "tradeTimestamp": "2026-08-18T09:15:23Z",
  "status": "ACTIVE"
}
```

Fields suggested for randomization: `tradeId`, `symbol`, `side`, `quantity`, `price`, `trader`, `book`, `counterparty`, `tradeTimestamp`, `status`.

Seed with ~100-1,000 trades. Optional: on startup, if the store is empty, auto-generate this randomized dataset.

## Functional requirements

- **Trade blotter:** table/grid of all trades supporting sorting, basic filtering, and a manual refresh-from-API action.
- **Create trade:** form with appropriate validation.
- **Amend trade:** update an existing trade's fields.
- **Cancel trade:** simple status transition to `CANCELLED` — no multi-step regulatory workflow needed.
- **Live updates:** a change made by one client must propagate to all connected clients without a page refresh, over the chosen real-time transport.

## Non-functional expectations

Clean code, unit tests, sensible architecture, appropriate/idiomatic TypeScript (not `any`-everywhere), reasonable error handling, automated testing where it adds value, thoughtful UX. Explicitly **not** expected to be production-hardened.

## Bonus ideas (optional, not required for a complete submission)

- Audit trail of trade amendments.
- Position summary: net position per symbol.
- P&L view: aggregate P&L per symbol.
- Simple user authentication/login.
- Trade validation rules (quantity > 0, price > 0, trader required, etc.).
- Virtualized grid (AG Grid, TanStack Table, or similar) for the blotter.
- Docker support.
- Cloud deployment (alternative to a locally-runnable repo).

Do not attempt all bonus items — pick ones that pay off given remaining time, and say so in the README trade-offs section.
