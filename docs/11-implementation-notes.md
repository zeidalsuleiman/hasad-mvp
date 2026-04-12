# HASAD Implementation Notes

## Current repo reality
The repository is no longer just an MVP skeleton.

It now includes:
- authentication with JWT, verification flow, and optional 2FA support
- farm CRUD and active-farm UX
- crop configuration UI and backend integration
- weather ingestion and persistence
- crop-aware irrigation engine using Penman-Monteith as primary ET0 method
- Hargreaves fallback path
- disease risk engine (rule-based for now)
- session-based assistant chat with persistence
- Dockerized local development
- substantial backend test coverage

## Important direction
1. Preserve the current stable foundation
2. Replace the disease rule engine with ML without breaking the API contract
3. Upgrade the assistant into a full RAG-backed system
4. Add admin observability basics
5. Move toward agentic orchestration only after core engines are trustworthy

## Current engineering notes
- Irrigation is now scientifically upgraded and explainable
- Crop configuration must remain central to irrigation quality
- Chat history is persisted and should not regress to local-only behavior
- Additive changes are preferred over breaking response formats
- SMTP/configuration issues may still need local-dev handling polish

## Known limitations
- Disease engine is still rule-based
- Assistant is not yet full RAG
- Admin capabilities are still limited
- Some local/dev auth email behavior may depend on SMTP configuration

## Definition of healthy current state
The project is currently healthy when:
- user can onboard and create a farm
- weather retrieval works
- crop can be configured
- irrigation calculation works and persists
- disease risk can be calculated and persisted
- assistant sessions/messages work
- dashboard reflects active-farm state correctly