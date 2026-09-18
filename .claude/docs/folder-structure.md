# Folder Structure

Status: **scaffolded and implemented** — this now reflects the actual repo, not just a plan. Stack: **Express + TypeScript** backend, **`node:sqlite`** (Node's built-in module — zero native dependencies, chosen over `better-sqlite3` specifically for the brief's cross-OS requirement) for persistence, **native WebSockets** (`ws` server-side, browser `WebSocket` client-side) for real-time, **Vite + React + TypeScript** on the frontend.

Trees below show folders only, each with a short description of its purpose — a generic skeleton, not a file-by-file inventory. Design rationale that spans folders follows underneath each tree.

## backend/

```
backend/
  src/
    config/                # env var parsing/validation — nothing else reads process.env directly
    db/                    # sqlite client + migration runner
      migrations/          # ordered, plain .sql files
      seeds/                # initial (clean, deterministic) and mock (large, randomized) seed scripts
    trades/                 # the Trade domain: routes, controller, service, repository, types, validation
    realtime/               # WebSocket server + the broadcaster the service layer publishes through
    middleware/             # cross-cutting Express concerns: CORS, request logging, error handling
    shared/                 # domain-agnostic building blocks: typed errors, logger, response envelope
    test-support/           # shared test scaffolding (e.g. spins up an ephemeral sqlite db) — no tests of its own
```

- **`config/`** — env var parsing/validation. Nothing else reads `process.env` directly.
- **`db/`** — the sqlite connection client and the migration runner live directly here; `migrations/` holds ordered, plain `.sql` files, `seeds/` holds two independent scripts: an `initial` seed (small, hand-curated, deterministic — good for demoing the golden path and for integration tests to assert against) and a `mock` seed (large randomized generator, 100-1,000 trades per `spec.md`, meant to exercise the grid at realistic volume). The migration runner is the only code allowed to create/alter schema; it's called both on every boot and before seeding.
- **`trades/`** — the whole Trade domain in one place: HTTP routes, controller (request/response mapping only), service (business rules — create/amend/cancel, status transitions), repository (DB access), domain types, request validation, **and their tests**, e.g. `trades.service.ts` sits next to `trades.service.test.ts`. Layering is one-way: `routes -> controller -> service -> repository`, so business rules can be unit-tested without HTTP or a real DB.
- **`realtime/`** — the WebSocket server plus a narrow `broadcaster` that's the *only* thing `trades/`'s service depends on to publish events, tests included. The service never imports the WS server directly — that seam is what lets the service be unit-tested without standing up a socket, and would let WS be swapped for SSE later without touching business logic.
- **`middleware/`** — cross-cutting Express concerns: CORS (frontend origin), request logging, and the error-handler that maps typed errors to HTTP responses (mounted last).
- **`shared/`** — domain-agnostic building blocks used by both `middleware/` and `trades/`: typed error classes, a single logger instance, and a common API response envelope. Dependency direction is one-way — `shared/` depends on nothing else in `src/`.
- **`test-support/`** — the *only* test-related folder that isn't colocated, because it holds infrastructure shared across many test files (e.g. spinning up/tearing down an isolated sqlite file per test run) rather than a test itself.

Colocation rule: a unit test lives directly beside the file it tests (`trades.service.ts` / `trades.service.test.ts`), not in a parallel `test/` tree — moving or renaming a module is then a one-folder change, and it's obvious at a glance which files have no test yet.

Root of `backend/` also holds the usual project files: `package.json`, `tsconfig.json`, lint/format config, `.env.example`, `Dockerfile`/`.dockerignore`.

## frontend/

```
frontend/
  src/
    api/                    # the one place that talks to the backend: HTTP client + WS client
    pages/                   # top-level routed screens — start here to see what the user navigates to
    features/                 # feature-specific building blocks (used by pages/), not grouped by file type
      trade-blotter/          # table, sort/filter controls, refresh, live-update subscription
      trade-form/              # one mode-agnostic TradeForm (create vs. amend is just "is a trade passed in?") + its validation
    components/                # shared, presentation-only UI primitives
    types/                      # frontend's copy of the Trade domain type
    hooks/                       # cross-feature hooks only
```

- **`api/`** — the one place that talks to the backend: a small HTTP client wrapper, typed calls for the trades endpoints, and the WebSocket client/subscription helper.
- **`pages/`** — the actual routed screens (e.g. `TradeBlotterPage.tsx`), each of which is what your router (or `App.tsx`, if there's only ever one screen) points to. This is the folder that answers "where do I look to see what the user sees" — it composes `features/` pieces into a full page, but shouldn't itself contain grid/table/form logic.
- **`features/`** — one folder per user-facing capability, holding the building blocks a page assembles, rather than grouping by file type. `trade-blotter/` owns the table, sorting/filtering controls, the refresh action, and the hooks for fetching + subscribing to live updates. `trade-form/` owns a single `TradeForm` component that handles both create and amend (an optional `initialTrade` prop is the only thing that changes) rather than two near-duplicate form components, plus shared validation. Everything needed to reason about "amend a trade" lives in one folder, tests included (e.g. `TradeTable.tsx` next to `TradeTable.test.tsx`).
- **`components/`** — shared, presentation-only UI primitives with no feature-specific logic.
- **`types/`** — the frontend's copy of the `Trade` domain type (see "Shared types" below).
- **`hooks/`** — cross-feature hooks only; anything specific to one feature stays inside that feature folder instead.

Colocation rule: same as the backend — a test sits next to the file it tests (`use-trades.ts` / `use-trades.test.ts`) instead of in a separate `test/` tree.

Root of `frontend/` also holds `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`, `Dockerfile`.

## Shared types

`Trade` is duplicated once in the backend's trades domain module and once in `frontend/src/types/` rather than extracted into a shared package — for a project this size a shared workspace package is overhead the brief doesn't ask for. Keep the two in sync by hand and note this trade-off in the README. (Revisit only if the exercise grows a second consumer of the API.)

## database/

Per the deliverables list, `database/` should exist alongside `frontend/` and `backend/` even though SQLite's actual data lives inside `backend/`. Use it to hold anything reviewers need to inspect independent of running the app: the canonical schema (mirrors `backend/src/db/migrations`), plus static sample output from each of the two seed scripts.
