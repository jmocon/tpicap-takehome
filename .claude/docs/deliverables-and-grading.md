# Deliverables & Grading Detail

## Required repo layout

```
README.md
frontend/
backend/
database/
docker-compose.yml   # optional but preferred
```

`database/` should hold schema/migrations/seed scripts even if the DB itself is embedded (e.g. SQLite file) or run via the compose file.

## README.md must cover

- Architecture decisions
- Installation instructions
- How to run the application
- How to run tests
- Assumptions made
- Trade-offs accepted

## AI Usage Report (required deliverable, separate from README)

A short document describing:
- Which AI tools were used
- How they were used
- Example prompts
- Key architectural/implementation decisions influenced by AI
- Areas where AI-generated suggestions were accepted or rejected, and why

## Prompt Log (required deliverable, separate file)

Significant prompts + relevant responses (summarised if long) from development. Not exhaustive — a representative sample. Format like:

```
Prompt:
"Generate a WebSocket architecture for a React and Express application"

Outcome:
Used initial design but replaced Socket.IO with native WebSockets due to simplicity.
```

Since this repo is being built with Claude Code, capture prompts/outcomes as work happens rather than reconstructing them later — it's much harder to reconstruct a faithful log after the fact.

## Assessment weighting

| Category | Weight | Looks at |
|---|---|---|
| Engineering Quality | 30% | code quality, project structure, maintainability |
| TypeScript Usage | 20% | type safety, domain modelling, API contracts |
| Full Stack Design | 20% | frontend/backend interaction, database design, API design |
| User Experience | 10% | usability, responsiveness, error handling |
| Testing | 10% | unit/integration testing, sensible coverage |
| Communication | 10% | README quality, AI usage report, explanation of decisions |

Engineering quality + TypeScript usage + full-stack design are 70% of the grade combined — prioritize clean domain modelling and API contracts over bonus features.

## Constraints

- Must run cross-platform (Windows/Linux/Mac) — avoid OS-specific scripts/paths without a documented alternative.
- Deploy to a cloud provider **or** hand over a git repo that installs/runs locally — one of the two is required.
- Target time budget: 8-15 hours, deliver within 7 calendar days of receipt. Favor thoughtful trade-offs over feature completeness.
