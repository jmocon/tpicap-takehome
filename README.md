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

- **Backend**: `routes -> controller -> service -> repository` layering (see `.claude/docs/folder-structure.md` for the full rationale), one folder per domain — `trades/`, plus `audit/`, `positions/`, and `auth/` added for the bonus features. Business rules (e.g. "a cancelled trade can't be amended") live in the service layer; the service publishes domain events through narrow `Broadcaster` and `AuditLogger` interfaces rather than importing the WebSocket server or a database writer directly, so it can be unit-tested without either. `positions/` is a pure read model over `trades` — no table of its own — with the FIFO P&L engine extracted as a standalone pure function (`fifo-pnl.ts`) so the trickiest logic in the app is testable without a database.
- **Database**: SQLite via Node's built-in `node:sqlite` module (stable as of Node 24) — chosen specifically over `better-sqlite3` because it needs zero native compilation, which matters for the brief's "must run on Windows/Linux/Mac" requirement. No native build toolchain (Python, node-gyp, MSVC) is required on any OS.
- **Real-time**: native WebSockets (the `ws` package server-side, the browser's built-in `WebSocket` client-side) rather than Socket.IO — the brief explicitly allows this and it avoids a dependency for a single-purpose broadcast (mutation happens -> publish an event -> every connected client re-renders). The WS server listens on a dedicated `/ws` path (not every upgrade request), so it can share an origin with the frontend without ambiguity.
- **Frontend**: a `pages/` (routed screens — blotter, per-symbol, positions, login) + `features/` (capability-scoped building blocks: `trade-blotter`, `trade-form`, `trade-analytics`, `symbol-detail`, `positions`, `auth`) split, with tests colocated next to the file they cover rather than in a parallel `test/` tree. Routing is `react-router-dom`; everything but `/login` sits behind a `RequireAuth` guard.
- **Reverse proxy (Docker Compose only)**: an `nginx:alpine` container is the single thing exposed to the host, routing `/api/*` and `/ws` to the backend and everything else to the frontend's own nginx. The whole API sits behind one reserved `/api` prefix (stripped by `proxy_pass http://backend:4000/` — the backend itself still serves `/trades`, `/positions`, `/auth/login`, `/health` unprefixed) so that the SPA owns the entire root namespace: `/positions` is both an API resource and a page route, and per-resource proxy rules made the page unreachable. Backend and frontend containers publish no host ports at all in this mode — only reachable through the proxy. Running locally without Docker skips this entirely: no proxy, no `/api` prefix, and the frontend talks directly to the backend's own CORS-enabled port.

## Prerequisites

- Node.js **>= 24** (needed for `node:sqlite`) — check with `node -v`.
- Docker + Docker Compose, if you want to run via containers instead of locally.

## Running locally (without Docker)

Two terminals — backend first, frontend second.

```bash
# Terminal 1 — backend
cd backend
npm install
cp .env.example .env   # optional — the defaults in src/config/env.ts match this file
npm run dev            # http://localhost:4000 — auto-seeds ~300 randomized trades on first run
```

```bash
# Terminal 2 — frontend
cd frontend
npm install
npm run dev           # http://localhost:5173
```

Open http://localhost:5173. The backend seeds itself automatically the first time it starts against an empty database (see "Seeding" below) — no manual step needed.

### Configuration

The backend's npm scripts load `backend/.env` through Node 24's built-in `--env-file-if-exists=.env` (no `dotenv` dependency). `-if-exists` matters: with no `.env` the app still starts on the defaults in `backend/src/config/env.ts`, which are deliberately identical to `backend/.env.example` — so copying the file is optional and only needed when you want to change something (a different `PORT`, a real `JWT_SECRET`). Real environment variables take precedence over anything in `.env`, so `PORT=4100 npm run dev` still wins.

The frontend reads `VITE_API_BASE_URL` / `VITE_WS_URL` at **build** time and falls back to `http://localhost:4000` / `ws://localhost:4000/ws` when unset — i.e. the local two-terminal flow above needs no frontend `.env` at all. `frontend/.env.example` documents both.

### Logging in

The app is behind a login gate. Two demo users are seeded automatically on first startup:

| Username | Password |
|---|---|
| `trader1` | `trader1pass` |
| `trader2` | `trader2pass` |

Either account works identically — this is authentication (proving who you are), not authorization (no per-user ownership rules), so both can view, create, amend, and cancel any trade. Passwords are stored as salted `scrypt` hashes, never plaintext; see `backend/src/db/seeds/users-seed.ts`.

## Running with Docker Compose

```bash
docker compose up --build
```

Everything is served through a single nginx reverse proxy at **http://localhost:8080** — the frontend, the API under `/api` (`/api/trades`, `/api/positions`, `/api/auth/login`, `/api/health`), and the `/ws` WebSocket endpoint all share that one origin (`backend`/`frontend` publish no ports of their own in this mode; only `proxy` does). Same login applies — see "Logging in" above. Trade data persists in a named Docker volume (`trades-data`) across restarts; run `docker compose down -v` to wipe it (which also re-seeds the demo users on next start).

Two details worth knowing about this mode:

- **The `/api` prefix exists only at the proxy.** nginx strips it (`location /api/ { proxy_pass http://backend:4000/; }`), so the backend serves the same unprefixed paths documented under "API" below, and the non-Docker flow (frontend :5173 → backend :4000, no proxy) uses no prefix at all. The prefix is what keeps the SPA's root-level routes — `/`, `/login`, `/positions`, `/symbols/:symbol` — from colliding with API resources of the same name.
- **The frontend image ships its own nginx config** (`frontend/nginx.conf`) whose only job is the history-API fallback `try_files $uri $uri/ /index.html`. Without it, deep links and hard refreshes on any client-side route 404.

`JWT_SECRET` defaults to a throwaway value so the stack runs unconfigured; override it (`JWT_SECRET=... docker compose up`) for anything resembling a real deployment.

> **Note:** this compose setup (and the two nginx configs it uses) has never been run end-to-end — Docker isn't installed on the machine it was written on, see `.claude/docs/action-items-for-you.md`. The configs have been reasoned through path-by-path but not executed. Verify with `docker compose up --build` before relying on it, including a deep link (http://localhost:8080/positions refreshed directly) and a live update across two tabs (exercises `/ws`).

## Seeding

Two independent, non-interchangeable seed scripts (see `backend/src/db/seeds/`):

```bash
cd backend
npm run db:seed         # small, hand-curated, deterministic dataset (5 trades) — a clean baseline
npm run db:seed:mock    # large randomized dataset (300 trades by default) — for exercising sorting/filtering at volume
```

If the backend starts and finds an empty database, it automatically runs the **mock** seed (per the brief's optional "generate realistic randomized data on startup" requirement) — you only need to run these manually if you want to reset to a specific dataset.

The two demo users are seeded the same way, independently of trades: on startup, if the `users` table is empty, `trader1`/`trader2` are created (see "Logging in" above).

## Running tests

```bash
cd backend && npm test     # vitest — 80 tests: service (business rules), repository (SQL, incl. substring search), routes (HTTP), realtime (WS delivery + auth), FIFO P&L, audit diffing, password hashing/JWT
cd frontend && npm test    # vitest + Testing Library — 76 tests: form validation, table rendering, data-fetching hook, trade/symbol/OHLC analytics aggregation, random-trade generator, auto-simulate hook, search suggestions, auth context/route guard/token storage
```

## Other commands

```bash
# backend/
npm run build        # tsc -> dist/, plus copying the .sql migration files tsc doesn't emit
npm run typecheck    # tsc --noEmit (type-check only, no output)
npm run lint          # eslint
npm run db:migrate    # apply pending migrations without seeding

# frontend/
npm run build         # tsc -b && vite build -> dist/
npm run typecheck     # tsc -b (type-check only; also runs as part of build)
npm run lint           # oxlint
```

## Continuous integration

GitHub Actions runs on every **push to `main`** and every **pull request targeting `main`** (`.github/workflows/ci.yml`).

`backend/` and `frontend/` are independent npm projects (no root `package.json`, no workspaces), so the workflow runs them as two **parallel matrix jobs** — a failure names the side that broke, and one side failing doesn't cancel the other. Each job does, in its own directory:

```bash
npm ci
npm test         # vitest
npm run typecheck # backend: tsc --noEmit | frontend: tsc -b
npm run lint      # backend: eslint | frontend: oxlint
npm run build
```

Notes:

- **Node is pinned to `24`**, not `latest` or a floating major. The backend persists through Node's built-in `node:sqlite` module, which doesn't exist on older Node — on an older runtime the backend tests fail in a way that doesn't obviously point at the Node version.
- npm dependency caching is keyed per package (`cache-dependency-path: <package>/package-lock.json`), since the lockfiles live in subdirectories rather than at the repo root.
- Lint failures fail the build. Both linters exit non-zero only on *error*-severity findings, so the one known frontend warning (`AuthContext.tsx` exports a component and a hook — a React Fast Refresh nit) doesn't block CI. Note the corollary: rules configured at warn severity in `frontend/.oxlintrc.json` won't fail CI either.
- CI covers the two npm packages only — the Docker Compose stack is not built or run there (see "Running with Docker Compose").

## API

Everything except `/health` and `/auth/login` requires an `Authorization: Bearer <token>` header; without one the API returns `401`.

Paths below are the ones the backend serves (`http://localhost:4000/trades` when running locally). Through the Docker proxy they're reachable at the same paths under `/api` (`http://localhost:8080/api/trades`) — the prefix is stripped before the request reaches the backend.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | — | liveness check |
| POST | `/auth/login` | — | exchange username/password for an 8-hour JWT |
| GET | `/trades` | ✔ | list trades — query params: `symbol`, `trader` (case-insensitive substring search), `side`, `status`, `sortBy`, `sortDir` |
| GET | `/trades/:id` | ✔ | fetch one trade |
| POST | `/trades` | ✔ | create a trade |
| PATCH | `/trades/:id` | ✔ | amend a trade (rejected with 409 if already cancelled) |
| POST | `/trades/:id/cancel` | ✔ | cancel a trade (rejected with 409 if already cancelled) |
| GET | `/trades/:id/audit` | ✔ | amendment/cancellation history for one trade, newest first |
| GET | `/positions` | ✔ | net position + realized/unrealized P&L per symbol |

Every create/amend/cancel broadcasts a `{ type: "trade.created" | "trade.amended" | "trade.cancelled", trade }` JSON message to all connected clients on the WebSocket endpoint at `/ws` (same host/port as the HTTP API). The WS connection is authenticated too — the client appends `?token=<jwt>` to the URL, and connections without a valid token are closed with code `4401`.

## Beyond the core requirements

All four of the brief's optional bonus ideas that made sense for this app are implemented (the fifth, virtualized grids, was deliberately skipped — see "Trade-offs accepted"):

- **Audit trail** (bonus) — every amendment and cancellation writes one row to an `audit_log` table with a JSON diff of exactly which fields changed (`{field: {old, new}}`). A no-op PATCH deliberately writes nothing, so the trail only ever contains real changes. Surfaced per-row in the blotter via a **History** button. The service publishes these through a narrow `AuditLogger` interface — the same seam pattern the `Broadcaster` already uses, so business logic stays testable without a real database writer.
- **Position summary + P&L** (bonus) — `/positions` page and endpoint showing net quantity, average open price, last price, and realized/unrealized P&L per symbol, computed server-side with FIFO lot-matching (see "Assumptions" for the methodology and its limits).
- **Authentication** (bonus) — username/password login gate over the whole app; JWT-based, `scrypt`-hashed passwords, protected HTTP routes and WebSocket. See "Logging in" above for demo credentials.
- **Trade analytics panel** — three charts (buy/sell volume, volume by symbol, trade activity over time) computed client-side from the already-loaded/filtered trade list, no new API surface. Built against the repo's `dataviz` skill conventions (sequential single hue for magnitude, categorical colors reused from the existing side-badge convention, no dual-axis, hover tooltips).
- **Per-symbol page** (`/symbols/:symbol`) — pick a symbol (or click a bar in "Volume by Symbol" on the main dashboard) to see an OHLC candlestick chart, buy/sell split, and activity over time scoped to that one symbol. Client-side routing via `react-router-dom`.
- **Search**: Symbol/Trader filters are debounced (~300ms) substring, case-insensitive search (backend `LIKE`, with literal `%`/`_` escaped) with a client-side suggestion dropdown drawn from already-loaded trades.
- **Per-row sparkline** — a small inline price-trend chart per row in the blotter table (one series computed per distinct symbol, shared across repeated rows, not recomputed per row).
- **"Simulate Trade" / "Auto Simulate" demo controls** — a button that submits one random BUY/SELL trade through the existing `POST /trades`, plus a toggle to fire one automatically on an adjustable interval (0.5s–10s). Useful for demoing the live-update behavior to a client without manually filling in the form repeatedly. Entirely frontend-side — no backend changes, since it reuses the same create endpoint and gets the WebSocket broadcast for free.
- **UX pass**: one primary (solid) action per view with outlined/borderless secondary and tertiary actions, bolded quantity/price over muted column labels (traders scan for numbers, not labels), context-aware field widths and progressive disclosure (optional Book/Counterparty tucked behind a details toggle) in the trade form, hover/focus states throughout.

## Assumptions

- The brief's minimum `Trade` interface (`id`, `tradeDate`) and its sample seed data (`tradeId`, `tradeTimestamp`, plus `book`/`counterparty`) use different field names for the same concepts — the persisted schema reconciles them: `id`/`tradeDate` are canonical (matching the required interface), `book`/`counterparty` are kept as optional extensions.
- "Cancel" is a one-way status transition (`ACTIVE -> CANCELLED`); a cancelled trade can no longer be amended or re-cancelled (returns 409), per the brief's "simple status transition is sufficient."
- **Authentication is a login gate, not authorization.** Every authenticated user can act on every trade — there's deliberately no "only the trader who booked it can amend it" rule, since the brief asks for "simple login capability" and per-user ownership rules weren't part of it.
- **P&L uses FIFO lot-matching**, and "last price" is a proxy. Realized P&L matches each closing trade against the oldest open lot first (chronologically, per symbol); a position flip (long → short) falls out of that naturally. Unrealized P&L marks open lots against **the symbol's most recent trade price**, because this app has no market-data feed — that's a documented stand-in for a real mark, not a real one.
- **Cancelled trades are excluded from all position/P&L/volume math** — a cancelled trade never represented real executed exposure. They're still included in the "trade activity over time" chart, which measures activity rather than exposure.
- No pagination on `GET /trades` — acceptable at the brief's suggested 100-1,000 row scale; would need revisiting well past that.

## Trade-offs accepted

- **No shared types package.** `Trade` is defined once in `backend/src/trades/trades.types.ts` and once in `frontend/src/types/trade.ts`. A monorepo shared-package setup is overhead this exercise's scope doesn't justify; the trade-off is the two must be kept in sync by hand.
- **No virtualized grid** (AG Grid/TanStack Table) — a plain `<table>` is enough for the brief's 100-1,000 row scale and keeps the dependency surface small; would revisit if the dataset were materially larger.
- **JWTs live in `localStorage`, and the WebSocket is authenticated via a query param.** Both are deliberate simplifications for a non-production exercise: `localStorage` is XSS-readable (an httpOnly cookie + CSRF protection would be the production answer), and a `?token=` on the WS upgrade URL can leak into proxy/access logs (a proper subprotocol handshake would be the production answer). Express middleware never sees WS upgrade requests, so the token is validated inside the connection handler instead.
- **No refresh tokens or logout-everywhere.** Tokens are 8-hour, stateless, and can't be revoked server-side before expiry — there's no session store to invalidate against.
- **Client-side validation duplicates server-side validation** (`trade-form-validation.ts` vs. `trades.validation.ts`'s zod schemas) rather than sharing one schema — intentional, since the two run in different runtimes (browser vs. Node) and a shared-schema package hits the same "no shared package" trade-off above; the server is the source of truth and re-validates independently.
