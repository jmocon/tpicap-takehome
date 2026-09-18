# TP ICAP Trade Blotter

A small real-time trade blotter: view, create, amend, and cancel equity trades, with changes pushed live to every connected browser over WebSockets.

Built for the TP ICAP Fusion Platform take-home exercise — see `.claude/docs/spec.md` for the full brief.

## Architecture

```
frontend/   React + TypeScript (Vite), talks to the backend over HTTP + WebSocket
backend/    Express + TypeScript, node:sqlite for persistence, ws for real-time
database/   Canonical schema + sample seed output, for reference outside the running app
nginx/      Reverse-proxy config used only by docker-compose (see "Running with Docker Compose")
```

- **Backend**: `routes -> controller -> service -> repository` layering (see `.claude/docs/folder-structure.md` for the full rationale). Business rules (e.g. "a cancelled trade can't be amended") live in the service layer; the service publishes domain events through a narrow `Broadcaster` interface rather than importing the WebSocket server directly, so it can be unit-tested without a real socket.
- **Database**: SQLite via Node's built-in `node:sqlite` module (stable as of Node 24) — chosen specifically over `better-sqlite3` because it needs zero native compilation, which matters for the brief's "must run on Windows/Linux/Mac" requirement. No native build toolchain (Python, node-gyp, MSVC) is required on any OS.
- **Real-time**: native WebSockets (the `ws` package server-side, the browser's built-in `WebSocket` client-side) rather than Socket.IO — the brief explicitly allows this and it avoids a dependency for a single-purpose broadcast (mutation happens -> publish an event -> every connected client re-renders). The WS server listens on a dedicated `/ws` path (not every upgrade request), so it can share an origin with the frontend without ambiguity.
- **Frontend**: a `pages/` (routed screens) + `features/` (capability-scoped building blocks: `trade-blotter`, `trade-form`) split, with tests colocated next to the file they cover rather than in a parallel `test/` tree.
- **Reverse proxy (Docker Compose only)**: an `nginx:alpine` container is the single thing exposed to the host, routing `/trades`, `/health`, and `/ws` to the backend and everything else to the frontend's own nginx. Backend and frontend containers publish no host ports at all in this mode — only reachable through the proxy. Running locally without Docker skips this entirely; the frontend just talks directly to the backend's own CORS-enabled port.

## Prerequisites

- Node.js **>= 24** (needed for `node:sqlite`) — check with `node -v`.
- Docker + Docker Compose, if you want to run via containers instead of locally.

## Running locally (without Docker)

Two terminals — backend first, frontend second.

```bash
# Terminal 1 — backend
cd backend
npm install
cp .env.example .env
npm run dev          # http://localhost:4000 — auto-seeds ~300 randomized trades on first run
```

```bash
# Terminal 2 — frontend
cd frontend
npm install
npm run dev           # http://localhost:5173
```

Open http://localhost:5173. The backend seeds itself automatically the first time it starts against an empty database (see "Seeding" below) — no manual step needed.

## Running with Docker Compose

```bash
docker compose up --build
```

Everything is served through a single nginx reverse proxy at **http://localhost:8080** — the frontend, `/trades` and `/health`, and the `/ws` WebSocket endpoint all share that one origin (`backend`/`frontend` publish no ports of their own in this mode; only `proxy` does). Trade data persists in a named Docker volume (`trades-data`) across restarts; run `docker compose down -v` to wipe it.

> **Note:** this compose setup (and the `nginx/default.conf` it uses) hasn't been run end-to-end yet — see `.claude/docs/action-items-for-you.md`. Verify with `docker compose up --build` before relying on it.

## Seeding

Two independent, non-interchangeable seed scripts (see `backend/src/db/seeds/`):

```bash
cd backend
npm run db:seed         # small, hand-curated, deterministic dataset (5 trades) — a clean baseline
npm run db:seed:mock    # large randomized dataset (300 trades by default) — for exercising sorting/filtering at volume
```

If the backend starts and finds an empty database, it automatically runs the **mock** seed (per the brief's optional "generate realistic randomized data on startup" requirement) — you only need to run these manually if you want to reset to a specific dataset.

## Running tests

```bash
cd backend && npm test     # vitest — 16 tests: service (business rules), repository (SQL), routes (HTTP), realtime (WS delivery)
cd frontend && npm test    # vitest + Testing Library — 18 tests: form validation, table rendering, data-fetching hook
```

## Other commands

```bash
# backend/
npm run build        # tsc -> dist/, plus copying the .sql migration files tsc doesn't emit
npm run lint          # eslint
npm run db:migrate    # apply pending migrations without seeding

# frontend/
npm run build         # tsc -b && vite build -> dist/
npm run lint           # oxlint
```

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | liveness check |
| GET | `/trades` | list trades — query params: `symbol`, `trader`, `side`, `status`, `sortBy`, `sortDir` |
| GET | `/trades/:id` | fetch one trade |
| POST | `/trades` | create a trade |
| PATCH | `/trades/:id` | amend a trade (rejected with 409 if already cancelled) |
| POST | `/trades/:id/cancel` | cancel a trade (rejected with 409 if already cancelled) |

Every create/amend/cancel broadcasts a `{ type: "trade.created" | "trade.amended" | "trade.cancelled", trade }` JSON message to all connected clients on the WebSocket endpoint at `/ws` (same host/port as the HTTP API).

## Assumptions

- The brief's minimum `Trade` interface (`id`, `tradeDate`) and its sample seed data (`tradeId`, `tradeTimestamp`, plus `book`/`counterparty`) use different field names for the same concepts — the persisted schema reconciles them: `id`/`tradeDate` are canonical (matching the required interface), `book`/`counterparty` are kept as optional extensions.
- "Cancel" is a one-way status transition (`ACTIVE -> CANCELLED`); a cancelled trade can no longer be amended or re-cancelled (returns 409), per the brief's "simple status transition is sufficient."
- Single-user, no authentication — the brief lists auth as an optional bonus, out of scope here.
- No pagination on `GET /trades` — acceptable at the brief's suggested 100-1,000 row scale; would need revisiting well past that.

## Trade-offs accepted

- **No shared types package.** `Trade` is defined once in `backend/src/trades/trades.types.ts` and once in `frontend/src/types/trade.ts`. A monorepo shared-package setup is overhead this exercise's scope doesn't justify; the trade-off is the two must be kept in sync by hand.
- **No virtualized grid** (AG Grid/TanStack Table) — a plain `<table>` is enough for the brief's 100-1,000 row scale and keeps the dependency surface small; would revisit if the dataset were materially larger.
- **No audit trail, position summary, P&L view, or authentication** — all listed as optional bonus ideas in the brief; skipped in favor of a solid core (view/create/amend/cancel + real-time) within the time budget.
- **Client-side validation duplicates server-side validation** (`trade-form-validation.ts` vs. `trades.validation.ts`'s zod schemas) rather than sharing one schema — intentional, since the two run in different runtimes (browser vs. Node) and a shared-schema package hits the same "no shared package" trade-off above; the server is the source of truth and re-validates independently.
