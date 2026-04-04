# HASAD Project Instructions

You are implementing HASAD, a smart farming system for Jordanian farmers.

## Mission
Transform this repository from a simple MVP into a production-structured graduation project system based on the requirements in the docs/ folder.

The target system must support:
1. Authentication and user management
2. Farm management
3. Weather ingestion by farm coordinates
4. Irrigation recommendation engine
5. Disease risk assessment engine
6. Grounded AI assistant
7. Historical logs and reporting
8. Admin observability basics

## Product boundaries
Do not invent major new features unless they are clearly marked as optional.
Do not remove core documented features.
If a requirement is ambiguous, follow docs/ and record assumptions in docs/assumptions.md.

## Tech targets
- Frontend: React
- Backend: FastAPI
- Database: PostgreSQL
- Containerization: Docker Compose
- Migrations: use a clean standard and keep it consistent
- API design: RESTful JSON APIs
- Auth: JWT
- Secrets: environment variables only
- Testing: automated backend tests required, frontend tests preferred when practical

## Working style
- Read CLAUDE.md and docs/ before major changes.
- First inspect the current codebase and compare it to the documented target state.
- Before implementing a major feature, propose a file-level plan.
- Implement in phases, not one giant rewrite unless absolutely necessary.
- Keep code modular and reviewable.
- Prefer service layer separation over putting business logic inside route handlers.
- Prefer typed request/response schemas.
- Update docs when implementation introduces a necessary clarification.

## Security rules
- Never hardcode secrets.
- Never expose API keys in committed files.
- Use password hashing, not plain-text storage.
- Use proper authorization checks for farm ownership and admin-only routes.
- Validate all external input.

## Engineering rules
- Use real persistence where the docs require persistence.
- Avoid in-memory production logic except for trivial local mocks in tests.
- External API failures must be handled gracefully.
- Add logs for important operations and failures.
- Keep functions focused and testable.

## Definition of done
A feature is done only if:
- backend implementation exists
- frontend integration exists if relevant
- DB schema/migrations exist if relevant
- tests exist for the critical path
- docs are updated where needed

## Delivery expectation
Work in these phases unless instructed otherwise:
1. Foundation refactor: database, auth, farms, weather
2. Irrigation engine
3. Disease risk engine
4. AI assistant
5. Reporting, admin basics, polish

## Output expectation for each major task
When given a feature task:
1. Summarize current state
2. Show implementation plan
3. Implement
4. Run tests
5. Report what changed, what passed, and any assumptions