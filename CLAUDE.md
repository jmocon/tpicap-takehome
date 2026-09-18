# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state

Fully scaffolded and implemented: `frontend/` (React + TypeScript + Vite), `backend/` (Express + TypeScript + `node:sqlite`), `database/` (schema + seed samples), `docker-compose.yml` + `nginx/` (written, not yet run end-to-end — Docker isn't installed on this machine, see `.claude/docs/action-items-for-you.md`). All core functional requirements (view/create/amend/cancel, sorting/filtering/refresh, live WebSocket updates) plus a trade analytics panel and "Simulate Trade"/"Auto Simulate" demo controls are built and tested (17 backend tests, 36 frontend tests). See `.claude/docs/progress.md` for the full status checklist and session-by-session log — check it before assuming something isn't done yet.

Build/lint/test commands: `npm test`, `npm run build`, `npm run lint` from `backend/` or `frontend/` respectively — see the root `README.md`'s "Running tests" / "Other commands" sections for the full list.

## What this repo is

A Full Stack Developer take-home exercise for TP ICAP: build a simplified real-time trade blotter (view/create/amend/cancel equity trades, live updates across clients) using a React+TypeScript frontend and a TypeScript backend, with a database and Docker/local-run setup as deliverables.

Full requirement detail lives in `.claude/docs/`:
- **[.claude/docs/spec.md](.claude/docs/spec.md)** — business context, required tech stack, the `Trade` model, seed-data shape, functional/non-functional requirements, optional bonus ideas.
- **[.claude/docs/deliverables-and-grading.md](.claude/docs/deliverables-and-grading.md)** — required repo layout (`frontend/`, `backend/`, `database/`, `docker-compose.yml`), README/AI-usage-report/prompt-log requirements, and how the submission is graded.
- **[.claude/docs/folder-structure.md](.claude/docs/folder-structure.md)** — proposed `frontend/` and `backend/` internal folder structure and the stack assumptions behind it.
- **[.claude/docs/progress.md](.claude/docs/progress.md)** — checklist of what's built vs. outstanding, plus a per-session log. Update this as work lands.
- **[.claude/docs/action-items-for-you.md](.claude/docs/action-items-for-you.md)** — things only the user can do (accounts, local machine setup, submission decisions). Check this before assuming a blocker is something Claude Code can resolve itself.
- **[.claude/docs/agent-team-workflow.md](.claude/docs/agent-team-workflow.md)** — the five subagent roles (`backend-engineer`, `frontend-engineer`, `devops-engineer`, `qa-engineer`, `ux-reviewer`), when to run them in parallel vs. sequentially, and a known environment limitation around native agent-teams support (read this before assuming `subagent_type: "<role>"` will work directly).

Read both before scaffolding the project — the grading weights (in deliverables-and-grading.md) should shape where effort goes: engineering quality + TypeScript usage + full-stack design are 70% of the score combined, ahead of UX and testing.

## Working conventions for this exercise

- Log significant prompts and their outcomes as you go (see the Prompt Log format in `.claude/docs/deliverables-and-grading.md`) — this is a required deliverable and is far easier to capture live than to reconstruct afterward.
- The `Trade` interface given in the brief is a minimum shape, not the final schema — the sample seed data uses richer fields (`book`, `counterparty`, `tradeId` vs `id`, `tradeTimestamp` vs `tradeDate`). Reconcile these deliberately when designing the persisted model and document the decision in the README.
- Prefer one real-time transport (WebSockets, Socket.IO, or SSE) chosen deliberately and documented, not multiple.
