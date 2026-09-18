# Progress Log

Tracks what's actually done vs. outstanding. Update this whenever a milestone lands — check items off, don't just append; keep the "Log" section as the append-only history of what happened per session.

## Status checklist

### Scaffolding
- [x] `backend/` project initialized (package.json, tsconfig, entrypoint)
- [x] `frontend/` project initialized (Vite + React + TS)
- [x] `database/` schema + seed script
- [x] `docker-compose.yml` + nginx reverse proxy (`nginx/default.conf`) fronting both containers on one port; written, **not yet tested** — Docker isn't installed on this machine, see action-items-for-you.md

### Backend
- [x] Trade domain type + DB schema
- [x] `GET /trades` (list, with symbol/trader/side/status filters + sortBy/sortDir)
- [x] `POST /trades` (create) + validation (zod)
- [x] `PATCH /trades/:id` (amend)
- [x] `POST /trades/:id/cancel` (cancel, status transition; rejects if already cancelled)
- [x] Initial seed (small, clean, deterministic dataset — 5 trades)
- [x] Mock seed (randomized generator, 300 trades by default) for volume testing
- [x] Auto-seed on empty startup (runs mock seed if the trades table is empty)
- [x] WebSocket server broadcasting create/amend/cancel events
- [x] Unit tests (service layer, 5 tests)
- [x] Integration tests (routes, 5 tests) + repository tests (6 tests) + realtime tests (2 tests) — 17 total, all passing

### Frontend
- [x] Trade blotter table (list view)
- [x] Sorting (click column header, toggles asc/desc)
- [x] Basic filtering (symbol, trader, side, status)
- [x] Manual refresh action
- [x] Create trade form + validation
- [x] Amend trade form — consolidated into one mode-agnostic `TradeForm` component (create vs. amend differs only by whether a trade is passed in), not two near-duplicate forms
- [x] Cancel trade action
- [x] Live updates via WebSocket subscription (merges into list state by trade id)
- [x] Component/hook tests (18 tests, all passing)

### Deliverables
- [x] README.md (architecture, install, run, test, assumptions, trade-offs)
- [x] AI Usage Report (`AI_USAGE_REPORT.md`)
- [x] Prompt Log (`PROMPT_LOG.md`)
- [ ] Docker support verified end-to-end (blocked: Docker not installed on this machine)

## Log

Append one entry per work session, newest at the top.

### 2026-09-18 (evening) — autonomous build session while user was asleep
Scaffolded and implemented the full app end-to-end, plus README. Decisions made without user sign-off (flagging for morning review):

- **DB driver: `node:sqlite`** (Node's built-in module, stable on Node 24) instead of `better-sqlite3` — zero native dependencies, avoids node-gyp/prebuilt-binary risk on Windows, which matters given the brief's OS-agnostic requirement. Confirmed working via `DatabaseSync` on this machine's Node v24.20.0.
- **Test runner: Vitest** for both frontend and backend (not Jest) — TS-native, fast, and vitest's frontend config already needed Vite anyway.
- Had to upgrade `vitest`/`vite` from the versions `npm install` initially picked (vitest 2.1.9 / vite 5.4.21) to vitest 5.0.1 / vite 8.3.0 — the older vite-node couldn't resolve `node:sqlite` (its builtin-module allowlist predates that API). Backend tests were failing before this upgrade; all pass after.
- **Validation: zod** on the backend; a small hand-written validator on the frontend (not shared) — see README's "Trade-offs accepted" for why they're not unified.
- **No React Query / data-fetching library** — a plain `useTrades` hook (fetch + WebSocket-driven merge) was enough for one list view; would reconsider if the app grew more than one data-driven screen.
- **No table/grid library** (AG Grid, TanStack Table) — a plain `<table>` covers the required sorting/filtering at the brief's 100-1,000 row scale; virtualization is listed as optional bonus and was skipped.
- Consolidated the planned `CreateTradeForm.tsx` + `AmendTradeForm.tsx` (see prior folder-structure.md) into a single `TradeForm.tsx` — the two would have been >90% identical markup; `folder-structure.md` updated to match.
- Verified end-to-end manually (not just unit tests): built backend binary boots and auto-seeds, a real WebSocket client independent of the one making a change receives the live broadcast (confirms the "changes visible to all connected clients" requirement), frontend dev server builds and serves against a live backend.
- Ran `/simplify` (4 parallel review agents: reuse/simplification/efficiency/altitude) against the new code, scoped to the full file list rather than a git diff (no repo to diff — see below). Applied fixes, then re-ran type-check/tests/lint/build on both projects — all still pass (backend 16 tests, frontend 18 tests). Applied:
  - Extracted `generateTradeId()` and a shared `INSERT_TRADE_SQL` in `trades.repository.ts`, used by `repository.create()` and both seed scripts instead of 3 copies of the same SQL/ID logic.
  - Added `TradesRepository.count()`, replacing a duplicated `SELECT COUNT(*)` in `index.ts` and `initial-seed.ts`.
  - Unified the sortable-fields list: `SORTABLE_FIELDS` now lives once in `trades.repository.ts`; the controller imports it instead of maintaining its own copy.
  - Rewrote `repository.amend()`/`cancel()` to a single `UPDATE ... RETURNING` (with `COALESCE` for partial amends) instead of fetch-then-update-then-refetch — cut 2 redundant `SELECT`s per mutation. Confirmed `node:sqlite` supports `RETURNING` before making the change.
  - Removed the `TradesRepositoryPort` interface + hand-rolled `FakeRepository` in `trades.service.test.ts`; the service test now uses the real `TradesRepository` against an in-memory `createTestDb()`, so business-rule tests can't silently drift from real repository behavior.
  - Added `details` to the `AppError` base class, removing an unsafe cast in `error-handler.ts`.
  - Frontend: removed a pointless `JSON.stringify`/`JSON.parse` round-trip in `use-trades.ts` (flagged independently by two review angles); consolidated `TradeFilters`' four near-identical `onChange` handlers into one `updateFilter()`; extracted a small `FormField` component inside `TradeForm.tsx` for its six repeated label/input/error blocks; derived `isCancelled` once per table row instead of re-checking `trade.status === "CANCELLED"` for each button; extracted a shared `makeTrade()` test fixture (`trade-fixtures.ts`) used by both frontend test files instead of two copies.
  - **Skipped** (judgment calls, not false positives to silently ignore): `Broadcaster` interface kept as-is (genuinely has 2 real implementations, not just a test seam); `Trade`/`TradeEvent` type duplication across frontend/backend kept (documented no-shared-package trade-off in README); frontend form validation duplicating backend zod rules kept (different runtimes, server is the integrity boundary); `TradeTable`/`TradeBlotterPage` `React.memo`/`useCallback` memoization skipped (premature at this scale — table isn't virtualized, so it re-renders the same row count regardless); split error-handling location between page (cancel) and form (create/amend) left as-is (each is self-contained and appropriately scoped); symbol-uppercasing appearing in three places (validation, repository filter, form submit) left as-is — each serves a distinct purpose (data integrity, case-insensitive filtering, UX formatting), not true duplication.
- **Could not verify Docker.** Docker Desktop isn't installed on this machine; `docker-compose.yml` and both Dockerfiles are written but untested. Needs a real run before submission.
- **Could not use git.** This directory isn't a git repo, and `git` itself is broken here — Xcode license not accepted (`sudo xcodebuild -license`), which needs an interactive sudo password only the user can provide. All work this session is uncommitted on disk. **First thing to do in the morning: accept the Xcode license, then `git init` and commit.**
- Wrote `AI_USAGE_REPORT.md` and `PROMPT_LOG.md` at the repo root, drawn directly from this session's actual prompts/decisions (not fabricated after the fact). Added `.gitignore` at root, `backend/`, and confirmed `frontend/`'s already had one, so the eventual `git init` doesn't pick up `node_modules`/`dist`/`data`.
- Still outstanding: actually testing Docker Compose (blocked on Docker install), committing to git (blocked on Xcode license), and everything in `action-items-for-you.md`'s "decisions only you can make" section (submission method, deadline, where to send it).

### 2026-09-18 (later) — added an nginx reverse proxy
User asked to "include nginx" — clarified this meant a single entry point in front of both containers (nginx was already serving the frontend's own static build, but that wasn't what was being asked). Added:

- `nginx/default.conf` — routes `/trades`, `/health`, `/ws` to the backend and everything else to the frontend, on one exposed port.
- Gave the backend's WebSocket server a dedicated `/ws` path (`backend/src/realtime/ws-server.ts`, exported as `WS_PATH`) instead of listening on every upgrade request — needed so nginx can route by path without trying to disambiguate a `/` WS upgrade from a `/` page request. Added a test confirming connections on any other path are rejected.
- `docker-compose.yml`: added a `proxy` service (`nginx:alpine` + the config above) as the only service publishing a host port (`8080:80`); `backend`/`frontend` no longer publish ports themselves. `VITE_API_BASE_URL`/`VITE_WS_URL` build args now point at `http://localhost:8080`/`ws://localhost:8080/ws`.
- Manually verified (without Docker, since it's still not installed): started the backend directly and confirmed a WS client on `/ws` connects and receives broadcasts, while a client on `/` is rejected — the exact behavior nginx's path-based routing depends on. The nginx config itself is still unverified end-to-end (see action-items-for-you.md).
- Backend test count: 16 -> 17 (added the path-rejection test). Re-ran full type-check/lint/build on both projects after — all clean.
- One side benefit worth knowing: because the browser now talks to the frontend and `/trades` on the same origin (`localhost:8080`) when running via Docker Compose, CORS effectively becomes a non-issue for that path — it's still needed (and configured) for the non-Docker local-dev flow where frontend (5173) and backend (4000) are genuinely different origins.

### 2026-09-18 (morning)
- Set up `CLAUDE.md` and `.claude/docs/` (spec.md, deliverables-and-grading.md, folder-structure.md, progress.md) from the assessment PDF. No application code written yet.
