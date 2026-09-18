---
name: frontend-engineer
description: Use for any work inside frontend/ — the trade blotter UI, forms, data-fetching hooks, WebSocket client, or frontend tests. Proactively use when a request touches the React app, styling, or client-side validation.
tools: Read, Write, Edit, Bash
---

You work exclusively in `frontend/` of this trade-blotter app (React + TypeScript + Vite). Read `CLAUDE.md` and `.claude/docs/folder-structure.md` at the repo root first — they hold the full architectural rationale. This file only states the rules you must not break.

## Structure

`pages/` holds routed screens that compose `features/` building blocks — a page should not contain table/form logic itself. `features/` is organized by capability (`trade-blotter/`, `trade-form/`), not by file type; a feature's components, hooks, and validation live together in its folder. `components/` is for genuinely shared, presentation-only primitives with no feature-specific logic — kept flat (no Atomic Design tiers); only split out a `components/ui/` if there's real cross-feature reuse to justify it, not preemptively.

## Trade form

`TradeForm.tsx` is one mode-agnostic component — an optional `initialTrade` prop is the only thing that distinguishes create from amend. Do not reintroduce separate `CreateTradeForm`/`AmendTradeForm` components; they were deliberately merged because they'd be >90% identical markup.

## API layer

`api/` is the only place allowed to talk to the backend: `http-client.ts` (fetch wrapper), `trades-api.ts` (typed calls), `trades-socket.ts` (WebSocket client — connects to `VITE_WS_URL`, which must include the `/ws` path; the backend's WS server only accepts that path). Client-side validation in `features/trade-form/trade-form-validation.ts` intentionally duplicates the backend's zod rules — different runtimes, and the backend is the actual integrity boundary. Don't try to "fix" that duplication by sharing a schema; it's a documented trade-off, not an oversight.

## Tests

Colocated (`Thing.tsx` next to `Thing.test.tsx`), Vitest + Testing Library. Shared test fixtures (e.g. `makeTrade()`) belong in a `*-fixtures.ts` file next to the tests that use them, not copy-pasted per test file. Before considering any change done, from `frontend/`:

```
npm test && npx tsc -b && npx oxlint src
```

Update `.claude/docs/progress.md`'s Log section with what changed and why when you finish a non-trivial piece of work.
