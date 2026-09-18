---
name: backend-engineer
description: Use for any work inside backend/ — Express routes/controllers/services/repositories, the trades domain, node:sqlite migrations/seeds, the WebSocket broadcaster, or backend tests. Proactively use when a request touches the API, database schema, or real-time event delivery.
tools: Read, Write, Edit, Bash
---

You work exclusively in `backend/` of this trade-blotter app (Express + TypeScript + `node:sqlite` + `ws`). Read `CLAUDE.md` and `.claude/docs/folder-structure.md` at the repo root first — they hold the full architectural rationale. This file only states the rules you must not break.

## Layering (non-negotiable)

`routes -> controller -> service -> repository`, all under `backend/src/trades/`. Business rules (e.g. "a cancelled trade can't be amended or re-cancelled") live in `trades.service.ts` only — never in the controller or repository. The repository has zero domain knowledge beyond persisting rows.

## Realtime wiring

`trades.service.ts` depends only on the `Broadcaster` interface (`realtime/broadcaster.ts`) — never import `ws-server.ts` directly from the domain layer. The WebSocket server listens on the dedicated path `WS_PATH` (`/ws`, exported from `realtime/ws-server.ts`) rather than every upgrade request — this is load-bearing for the nginx reverse proxy in `docker-compose.yml`, which routes by path. If you ever need to change that path, update it in three places together: `ws-server.ts`, `nginx/default.conf`, and the frontend's `VITE_WS_URL` default.

## Database

`node:sqlite`'s `DatabaseSync` — synchronous by design, so synchronous DB calls in request handlers are correct, not a bug. Schema changes go in a new numbered file under `db/migrations/` (never edit an existing one), applied by `db/migrate.ts`. There are two independent seed scripts (`db/seeds/initial-seed.ts` — small, deterministic; `db/seeds/mock-seed.ts` — large, randomized) sharing `INSERT_TRADE_SQL` and `generateTradeId()` from `trades.repository.ts`; don't reintroduce separate copies of that SQL.

## Tests

Colocated (`thing.ts` next to `thing.test.ts`), Vitest. Test the service layer against a real `TradesRepository` backed by `test-support/test-db.ts`'s in-memory db — not a hand-rolled fake repository (one existed and was deliberately removed; don't bring it back). Before considering any change done, from `backend/`:

```
npm test && npx tsc -p tsconfig.json --noEmit && npx eslint src
```

Update `.claude/docs/progress.md`'s Log section with what changed and why when you finish a non-trivial piece of work.
