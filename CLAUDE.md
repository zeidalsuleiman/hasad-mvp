# HASAD Project Instructions

You are implementing HASAD, a smart farming system for Jordanian farmers.

## Mission
Transform this repository into a production-structured graduation project system based on the docs/ folder and the current implemented system state.

The target system must support:
1. Authentication and user management
2. Farm management
3. Weather ingestion by farm coordinates
4. Crop configuration and Kc derivation
5. Irrigation recommendation engine
6. Disease risk assessment engine
7. Grounded AI assistant
8. Historical logs and reporting
9. Admin observability basics

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
- Irrigation calculations must be scientifically explainable.
- All derived irrigation values must be traceable via assumptions.
- Crop configuration must always influence irrigation behavior.
- Prefer additive, backward-compatible response evolution.

## Definition of done
A feature is done only if:
- backend implementation exists
- frontend integration exists if relevant
- DB schema/migrations exist if relevant
- tests exist for the critical path
- docs are updated where needed

## Delivery expectation
Work in these phases unless instructed otherwise:

1. Foundation (DONE)
   - auth
   - farms
   - weather
   - persistence

2. Irrigation and crop system (DONE)
   - crop configuration
   - Kc derivation
   - Penman-Monteith implementation
   - explainable irrigation outputs

3. Disease ML (NEXT)
   - replace rule-based engine internals with ML
   - preserve API contract

4. RAG assistant
   - strengthen grounding and document retrieval

5. Admin + observability
   - user/system visibility
   - logs and diagnostics

6. Agentic AI
   - tool orchestration after core engines are trustworthy

## Output expectation for each major task
When given a feature task:
1. Summarize current state
2. Show implementation plan
3. Implement
4. Run tests
5. Report what changed, what passed, and any assumptions

## Current project reality
The system is beyond MVP skeleton state. It already includes:
- stable farm/auth/weather flows
- crop-aware irrigation
- persisted assistant chat
- historical records
- dashboard integration

The immediate next major engineering phase is:
- Disease ML upgrade

Do not regress:
- irrigation quality
- crop integration
- assistant session persistence
- API contracts
- farm ownership checks