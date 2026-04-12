# HASAD Roadmap — Next Phases

## Phase A — Stabilization → DONE
- Auth fixed
- Dashboard fixed
- UI stabilized

## Phase B — Product Alignment → DONE
- UI aligned with spec
- flows validated

## Phase C — Irrigation Upgrade → DONE
- Full Penman-Monteith implemented
- fallback logic added
- assumptions tracking added

## Phase D — Disease ML → NEXT

Goal:
Replace rule-based disease engine with ML

Tasks:
- select crops (start with 2–3)
- define disease targets
- prepare dataset
- train model (Random Forest recommended)
- integrate into backend
- keep API unchanged
- add confidence score
- fallback to rules

---

## Phase E — AI Assistant Upgrade (RAG)

Goal:
Make assistant fully grounded

Tasks:
- include:
  - crop
  - irrigation
  - disease
  - weather
- use structured context
- reduce hallucination
- improve explanation quality

---

## Phase F — Admin & Observability

Goal:
Add system visibility

Tasks:
- user monitoring
- logs inspection
- debug tools
- system metrics

---

## Phase G — Agentic AI (FINAL)

Goal:
Assistant becomes orchestrator

Tasks:
- tool-based reasoning:
  - irrigation
  - disease
  - weather
- multi-step decisions
- safe boundaries

---

## Final State

System is:
- scientifically valid
- crop-aware
- ML-enhanced
- explainable
- AI-assisted