# Action Items Only You Can Do

Things Claude Code can't do on your behalf — accounts, credentials, local machine setup, and decisions that need your say-so. Checked against this machine on 2026-09-18.

## Resolved since the last check

- ~~Accept the Xcode license~~ — resolved; `git` works, the repo is initialized and has a remote.
- ~~GitHub repository~~ — resolved; pushed to `git@github.com:jmocon/tpicap-takehome.git` (`origin/main`). This satisfies the brief's "give us a Git repository we can install and run locally" deployment option.

## Still blocking

- [ ] **Install Docker Desktop.** Still not found on this machine (`docker`/`docker compose` commands don't exist). Required to actually verify the `docker-compose.yml` path (3-service stack: backend, frontend, nginx reverse proxy on `http://localhost:8080`) — it's written but has **never been run**. Get it from docker.com, then run `docker compose up --build` and confirm: `http://localhost:8080` loads; `http://localhost:8080/api/trades` returns JSON (the API moved behind an `/api` prefix on 2026-09-19 — the bare `/trades` URL now correctly serves the SPA, not JSON); `http://localhost:8080/positions` loads the **positions page** and survives a hard refresh (that deep-link case was broken twice over until the same change); and live updates work across two browser tabs through the proxy.
- Node.js v24.20.0 and npm 11.19.0 are already installed — no action needed there.

## Decisions only you can make

- [ ] **Receipt date / deadline.** The brief gives "7 calendar days from receipt" — still don't know when you actually received this exercise, so the real deadline isn't tracked in `progress.md`.
- [ ] **Where to send the final submission** (email address, portal, GitHub invite, etc.) — not stated in the PDF; check whatever email/instructions accompanied it. The GitHub repo above is ready to hand over as-is, or you can add a cloud deployment on top if you'd rather demo it live — your call.

## Not needed from you

- AI Usage Report and Prompt Log: kept current directly from session work — see `.claude/docs/deliverables-and-grading.md`.
- Everything else (code, tests, README, Docker config, seed data, agent-team setup) is buildable without external accounts.
