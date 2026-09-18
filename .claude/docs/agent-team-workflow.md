# Agent Team Workflow

This repo has five subagent definitions in `.claude/agents/`: `backend-engineer`, `frontend-engineer`, `devops-engineer`, `qa-engineer`, `ux-reviewer`. `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set in `.claude/settings.json`.

## Known limitation: this doesn't actually work in every environment

The description above is what [Claude Code's agent-teams docs](https://code.claude.com/docs/en/agent-teams) say *should* happen: naming one of these as a subagent's type spawns it as a full teammate (own context, messages other teammates directly, self-claims off a shared task list) instead of a one-shot subagent. **In practice, this session's environment does not implement it** — the `Agent` tool's `subagent_type` only accepts a small fixed list (`claude`, `claude-code-guide`, `Explore`, `general-purpose`, `Plan`, `statusline-setup`) that doesn't include any project-defined agent, and the tool has no `name` parameter at all, so there's no way to make a spawned agent addressable the way the docs describe. This was confirmed by directly trying it and getting `Agent type 'frontend-engineer' not found` — filed as product feedback, not something fixable from this repo.

**The practical workaround used in this session**: spawn a fresh `general-purpose` agent and paste the target role's `.claude/agents/<name>.md` rules directly into its prompt, telling it to follow them manually. This gets the same delegated implementation/review done correctly — it just loses the native "team" extras (shared task list, teammates messaging each other, a live panel, true addressability). For work that benefits from multiple lenses at once (e.g. a parallel code review), launch multiple `general-purpose` agents with different embedded roles **in the same message** so they actually run concurrently — see the code-review example below.

If you're running this repo from the real Claude Code CLI in a terminal (not this environment), the native feature may well work as documented — worth retrying there.

## There is no "team lead" or "orchestrator" agent file

Per the docs, the lead is always whichever interactive session you're driving — it's fixed for the session's lifetime, can't be defined as a subagent, delegated to another agent, or promoted from a teammate. Whatever session you're talking to right now *is* the orchestrator: just ask it to spawn (workaround-style) teammates and it coordinates them.

## Roles

| Agent | Owns |
|---|---|
| `backend-engineer` | `backend/` |
| `frontend-engineer` | `frontend/` |
| `devops-engineer` | `docker-compose.yml`, `nginx/`, both Dockerfiles |
| `qa-engineer` | nothing — read-only functional/correctness verifier, runs after the above land work |
| `ux-reviewer` | nothing — read-only usability auditor, judges whether UI is good for the user and suggests an approach; doesn't implement |

The three implementer roles own disjoint file trees. That's the actual precondition for safe parallelism the docs call out ("avoid file conflicts... each teammate owns a different set of files") — it's not automatic just because they have different names. `qa-engineer` and `ux-reviewer` are both read-only, so they're always safe to run in parallel with each other (different review lenses, same code) — this is the pattern the docs call "Run a parallel code review."

## Triggering parallel work

Ask the lead to delegate (workaround-style, per above) by name in one message, e.g.:

> Spawn backend-engineer and frontend-engineer to add a `notes` field to trades — backend-engineer adds the migration/validation/API, frontend-engineer adds the form field and table column against the contract in `.claude/docs/spec.md`. Once both finish, have qa-engineer verify and ux-reviewer check the new field's UI.

In this environment that becomes multiple `general-purpose` agents launched in the same message, each carrying one role's rules — genuinely concurrent, just not "teammates" in the documented sense.

## When not to parallelize

Sequential dependencies (frontend needs an API contract backend hasn't written yet) or same-file edits. The docs are explicit: teams "work best when teammates can operate independently. For sequential tasks, same-file edits, or work with many dependencies, a single session or subagents are more effective." A backend API + frontend consumer of that *same, still-changing* endpoint is usually sequential, not parallel — land the backend contract first, then parallelize frontend against it. `qa-engineer` and `ux-reviewer` are the exception to "land work first, then verify" — they can review existing, already-landed code at any time since they don't touch anything.
