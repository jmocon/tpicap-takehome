# Action Items Only You Can Do

Things Claude Code can't do on your behalf — accounts, credentials, local machine setup, and decisions that need your say-so. Checked against this machine on 2026-09-18.

**Now blocking real progress** (the app itself is built — `backend/` and `frontend/` both work, tests pass — these two are what's stopping the next steps):

## Local machine setup

- [ ] **Accept the Xcode license.** `git --version` currently fails with "You have not agreed to the Xcode license agreements." Run in a terminal: `sudo xcodebuild -license`, then accept. Needed before `git` (and likely other build tooling) will work at all. **Blocking:** none of this session's work is committed yet — it all exists only on disk. Do this first, then `git init` + an initial commit.
- [ ] **Install Docker Desktop.** Not currently installed (`docker` / `docker-compose` not found). Required if we go with the `docker-compose.yml` path the brief prefers. Get it from docker.com and make sure it's running before we test the compose setup. **Blocking:** `docker-compose.yml` (now a 3-service stack: backend, frontend, and an nginx reverse proxy at `nginx/default.conf` fronting both on `http://localhost:8080`), both Dockerfiles, and the nginx config are all written but have never actually been run — needs a real `docker compose up --build` before you can trust it for submission. The nginx path-based routing (`/trades`, `/health`, `/ws` -> backend; everything else -> frontend) was verified manually against the backend directly, but nginx itself has never executed.
- Node.js v24.20.0 and npm 11.19.0 are already installed — no action needed there.

## Accounts / external services (only needed if you choose these paths)

- [ ] **GitHub (or other git host) repository.** The brief accepts "a Git repository we can install and run locally" as an alternative to cloud deployment — simplest path. If you want this option, create an empty repo (public or with reviewer access granted) and give me the remote URL so I can push to it.
- [ ] **Cloud provider account** (AWS/Azure/Heroku/etc.) — only needed if you'd rather deploy live instead of (or in addition to) handing over a repo. Creating the account and any billing/credentials setup has to be done by you; I can write the deployment config once you tell me which provider and share access (e.g., a CLI logged in locally, or credentials as env vars you provide).

## Decisions only you can make

- [ ] **Submission method:** local git repo hand-off vs. live cloud deployment vs. both. Drives whether the cloud-account item above is needed.
- [ ] **Receipt date / deadline.** The brief gives "7 calendar days from receipt" — I don't know when you actually received this exercise, so I can't track the real deadline in `progress.md` unless you tell me the date.
- [ ] **Where to send the final submission** (email address, portal, GitHub invite, etc.) — not stated in the PDF; check whatever email/instructions accompanied it.

## Not needed from you

- AI Usage Report and Prompt Log: I can draft these directly from this session's work — see `.claude/docs/deliverables-and-grading.md`.
- Everything else (code, tests, README, Docker config, seed data) is buildable without external accounts.
