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
- [x] UX polish: button hierarchy (one primary action per view), data hierarchy in the table (quantity/price bolded over muted labels), context-aware field sizing in the trade form, progressive disclosure for optional book/counterparty fields, proximity grouping, hover/focus states
- [x] Trade analytics panel (buy/sell volume, volume by symbol, trade activity over time) — client-side aggregation of the already-loaded/filtered trade list, no new API surface
- [x] "Simulate Trade" demo button — generates one random BUY/SELL trade client-side and submits it through the existing create endpoint, for live cross-client demoing without any backend changes
- [x] "Auto Simulate" toggle + frequency select next to "Simulate Trade" — fires the same simulated-trade path on a repeating interval for an unattended live demo
- [x] Component/hook tests (36 tests, all passing)

### Deliverables
- [x] README.md (architecture, install, run, test, assumptions, trade-offs)
- [x] AI Usage Report (`AI_USAGE_REPORT.md`)
- [x] Prompt Log (`PROMPT_LOG.md`)
- [ ] Docker support verified end-to-end (blocked: Docker not installed on this machine)

## Log

Append one entry per work session, newest at the top.

### 2026-09-18 — doc refresh + `ux-reviewer` agent + parallel code review
User asked "did we cover all in the [PDF]?" — re-checked the brief page-by-page against actual repo state. Findings:
- **The GitHub repo (`origin/main`) was a full session behind disk.** Nothing after the initial push had been committed — this session's UX polish, trade analytics, Simulate Trade/Auto Simulate, and agent-team setup all existed only on disk. Fixed by this entry's commit/push.
- **README, AI_USAGE_REPORT, PROMPT_LOG, CLAUDE.md, and action-items-for-you.md had all gone stale** — none mentioned anything past the original autonomous build session (wrong test counts, missing features, resolved blockers still listed as open). Refreshed all five.
- Docker is still the one open core-requirement gap: still not installed on this machine, `docker-compose.yml`/nginx still never run end-to-end.

Also added `.claude/agents/ux-reviewer.md` (5th subagent role) per user request: a read-only usability auditor that judges whether a piece of UI is good for the user and suggests a concrete alternative, scoped against this app's own established house style (button/data hierarchy, proximity, progressive disclosure) rather than generic advice, and explicitly barred from recommending the dark patterns rejected earlier. Updated `agent-team-workflow.md`'s role table and added a "Known limitation" section documenting the confirmed platform gap (see previous entries) and the `general-purpose`-plus-embedded-role workaround now used for all delegation in this session.

User then asked to "call the orchestrator... work with our agent-teams to review the code" — dispatched two `general-purpose` agents in parallel (same message, so genuinely concurrent), one carrying `qa-engineer`'s rules and one carrying `ux-reviewer`'s, mirroring the agent-teams docs' "parallel code review" use case as closely as this environment allows. Findings from that review are appended as their own log entry once both report back.

### 2026-09-18 — "Auto Simulate" toggle for the demo button
Extended the existing "Simulate Trade" one-shot demo button (see the entry below) with a continuous mode, so an unattended demo can run in the background at an adjustable frequency while talking to a client, instead of needing a click per trade.

- New `frontend/src/features/trade-blotter/use-auto-simulate.ts` — a small reusable hook, `useAutoSimulate(action, intervalMs, enabled)`, that drives a repeating async action on a `setInterval` while `enabled` is true. Guards against overlapping calls with an `inFlightRef`: if the previous tick's promise hasn't resolved yet (e.g. a slow request), the next tick is skipped rather than queued. `action` is captured in a ref (assigned inside a plain `useEffect`, not during render, to avoid oxlint's `react(refs)` "no ref writes during render" rule) so callers can pass a fresh closure every render without restarting the interval; the interval itself only restarts when `intervalMs` or `enabled` changes, and is always cleared via the effect's cleanup (covers toggle-off and unmount). Colocated test file (7 tests) using `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync()`, covering: disabled = no calls, one call per interval while enabled, overlapping-call skip, a rejected call not breaking the loop, frequency change taking effect on the next tick without a restart, and cleanup on both disable and unmount.
- `frontend/src/pages/TradeBlotterPage.tsx` — added `autoSimulating` (boolean) and `autoSimulateIntervalMs` (default 2000ms) state; `useAutoSimulate(handleSimulateTrade, autoSimulateIntervalMs, autoSimulating)` reuses the exact same trade-creation path the one-shot button already calls, so it still broadcasts over the existing WebSocket with no backend changes. Added to the header, next to "Simulate Trade": a "Start Auto"/"Stop Auto" toggle button (`aria-pressed`, and an accent-filled `.btn-toggle-on` modifier class when running, so it visually reads as "running" without borrowing `.btn-primary` — that stays reserved for the one true primary action per view, "New Trade") and a frequency `<select>` (0.5s/1s/2s/5s/10s presets, defaulting to 2s) styled like the existing filter selects. The plain "Simulate Trade" button is disabled while auto-simulate is running (`disabled={simulating || autoSimulating}`) to avoid confusing double-triggers.
- `frontend/src/index.css` — added `.simulate-controls` (groups the three new header controls), `.header-actions select` (reuses the existing filter-select look outside `.trade-filters`), and `.btn-toggle-on` (accent background/border, matching `.btn-primary`'s hover treatment) alongside the existing `.btn-*` hierarchy comment block.
- Verified from `frontend/`: `npm test` (36/36 passing, up from 29 — the 7 new hook tests), `npx tsc -b` clean, `npx oxlint src` clean (after moving the ref assignment into an effect — the initial render-time assignment tripped the `react(refs)` rule), `npm run build` clean.

### 2026-09-18 — "Simulate Trade" demo button
User wanted a button to demo real-time behavior live to a client: click it, one random trade appears, visible across connected clients. Implemented entirely in `frontend/`, no backend changes:

- `features/trade-blotter/random-trade.ts` — new `generateRandomTrade(): CreateTradeInput` module. Draws side (BUY/SELL), symbol and trader from small frontend-local lists that mirror (but deliberately don't import) `backend/src/db/seeds/mock-seed.ts`'s lists, to keep the frontend/backend boundary clean. Quantity: 50–10,000 rounded to a step of 10. Price: $10.00–$900.00 to 2 decimal places.
- `pages/TradeBlotterPage.tsx` — added a `handleSimulateTrade()` handler that calls the **existing** `tradesApi.create()` with the generated trade, reusing the same `actionError` state `handleCancel` already uses for failures, plus a new `simulating` boolean for a disabled/loading button state ("Simulating..."). Because it goes through the real create endpoint, the existing WebSocket broadcast + `useTrades` merge logic handles the live cross-client update for free — no new transport code needed.
- New "Simulate Trade" button sits next to "New Trade" in the header, styled `.btn-secondary` (outlined) so "New Trade" remains the sole `.btn-primary` per the button-hierarchy convention. Added a small `.header-actions` flex wrapper in `index.css` to group the two buttons.
- `features/trade-blotter/random-trade.test.ts` — 5 new tests: value-set membership for side/symbol/trader across many runs, quantity range + step-of-10 rounding, price range + 2-decimal rounding, and two `Math.random`-mocked boundary tests (min and max of the range) for determinism.
- Verified: `npm test` (29/29 passing, up from 24), `npx tsc -b`, `npx oxlint src`, and `npm run build` all clean.

### 2026-09-18 — UI/UX polish + trade analytics charts
User supplied `~/Downloads/ux_psychology_ui_principles.md`, an 18-principle UX/UI reference document. It mixed legitimate usability principles with consumer growth-hacking dark patterns (fake progress, guilt-trip cancellation copy, dopamine-hook variable rewards, decoy pricing, anchoring) — the latter don't fit an institutional trading tool and were deliberately skipped after confirming with the user. Applied only the legitimate ones:
- **Intentional button hierarchy** (`index.css`): `.btn-primary`/`.btn-secondary`/`.btn-ghost`/`.btn-ghost-danger` classes — exactly one solid-fill primary action per view (New Trade, form submit), outlined secondary (Amend, Refresh), borderless tertiary (form Cancel), and a danger-tinted ghost for the destructive row action (Cancel trade).
- **Data hierarchy** (`TradeTable.tsx`): quantity/price cells bolded and upsized over muted, uppercase column headers — traders scan for numbers, not labels.
- **Context-aware field sizing + proximity grouping** (`TradeForm.tsx`): Symbol/Side and Quantity/Price now sit in fixed-width rows instead of uniform full-width stacked fields; optional Book/Counterparty moved behind a `<details>` "Additional details" progressive-disclosure section (auto-open on amend when either is already set, so existing data is never hidden).
- **Aesthetic-usability polish**: hover/focus-visible states, button/modal transitions, modal entrance animation.
- Skipped: fake progress meters, loss-aversion cancellation framing, variable rewards, decoy pricing, anchoring — inapplicable/inappropriate for this app.

Also added a **trade analytics panel** (`features/trade-analytics/`) per user request for "graphs a trader would like to see" — three charts computed client-side from the already-loaded (and already-filtered) trade list, no new API surface:
- `RankedBarChart` (HTML/CSS bars) for Buy vs Sell volume (green/sell-red, matching the existing side-badge convention) and Volume by Symbol (single blue hue since it's a magnitude ranking, not a series-identity comparison; top 6 symbols + "Other" fold).
- `ActivityLineChart` (inline SVG) for trade count over time, with adaptive bucketing (hourly if the data spans ≤2 days, daily ≤90 days, else weekly) and a pointer-tracked crosshair + tooltip.
- Followed the project's `dataviz` skill: one hue for magnitude/single-series (never a rainbow), no dual-axis, rounded/thin marks, gridlines as hairlines, direct labels, hover-on-every-mark. Cancelled trades excluded from the volume charts (never represented real exposure) but included in the activity chart (still real trading activity).
- New `trade-analytics.ts` aggregation module has its own colocated test file (6 tests) per the project's test convention.

Verified: `npm test` (24/24 passing, up from 18), `npx tsc -b`, `npx oxlint src`, and `npm run build` all clean. Started the backend + frontend dev servers and confirmed the API serves seeded data and the dev server serves the updated bundle without errors — **could not visually confirm chart rendering in an actual browser**, no browser-automation tool was available this session. Left backend (`:4000`) and frontend (`:5173`) dev servers running for the user to check visually.

Also set up the agent team (see entry below) in the same session, at the user's request, interleaved with this work.

### 2026-09-18 — agent team setup
User wanted the team missing `qa-engineer`/team-lead/orchestrator roles and a flow for parallel work, referencing Claude Code's agent-teams docs. Clarified there's no separate "team lead"/"orchestrator" subagent — per those docs the lead is always the interactive session itself, fixed for its lifetime, not definable as a subagent file. What was actually added:
- `.claude/agents/qa-engineer.md` — read-only verifier (tests, type-check, lint, real-time behavior, Docker), reports findings rather than fixing them.
- `.claude/settings.json` — `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, so spawning `backend-engineer`/`frontend-engineer`/`devops-engineer`/`qa-engineer` by name launches them as real parallel teammates (own context, message each other, shared task list) instead of one-shot subagents.
- `.claude/docs/agent-team-workflow.md` — the four roles' disjoint ownership (why they're safe to parallelize), example spawn prompt, and when sequencing beats parallelizing (e.g. frontend against a backend contract that hasn't landed yet).

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
