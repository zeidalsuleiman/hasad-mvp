# HASAD Delivery Plan

## Phase 1 — Foundation (DONE)
- PostgreSQL
- real auth
- farm CRUD
- weather retrieval tied to stored farm coordinates

## Phase 2 — Irrigation & Crop Alignment (DONE)
- crop configuration UI and backend alignment
- weather/schema upgrades for irrigation inputs
- Penman-Monteith implementation
- irrigation transparency and assumptions tracking
- dashboard integration

## Phase 3 — Disease ML (NEXT)
- replace rule engine internals with ML models
- keep API contract stable
- define crop-specific disease targets
- validate model behavior
- preserve fallback strategy where needed

## Phase 4 — RAG Assistant
- upgrade assistant grounding using curated knowledge
- improve evidence-based responses
- keep chat persistence/session model
- strengthen assistant UX and reliability

## Phase 5 — Admin / Observability
- admin routes
- system logs
- platform monitoring visibility
- stronger diagnostics and supportability

## Phase 6 — Agentic AI
- define tool orchestration boundaries
- let assistant reason across weather/irrigation/disease/reporting tools
- preserve safety and determinism

## Cross-phase rules
- do not break current API contracts unless clearly justified
- prefer phased, reviewable changes
- update docs when behavior changes
- keep the system scientifically explainable