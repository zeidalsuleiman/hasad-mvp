# HASAD Roadmap — Next Phases

## Phase A — Stabilization (NOW)

Goal: Fully working system end-to-end

Tasks:
- fix authentication (OTP + email + CORS)
- remove legacy token flows
- fix dashboard rendering
- fix farm configuration UI
- ensure all main flows work

Exit Criteria:
- user can:
  register → verify → login → use system fully

---

## Phase B — Product Alignment

Goal: Match system with specs

Tasks:
- align dashboard with frontend-spec
- add loading/error states
- clean UI/UX
- validate flows against acceptance tests

---

## Phase C — Irrigation Upgrade

Goal: Improve scientific accuracy

Tasks:
- extend ET0 calculation
- move toward Penman-Monteith compatibility
- define missing inputs
- add fallback logic
- improve assumptions tracking

---

## Phase D — Disease Engine Upgrade

Goal: Replace rules with ML

Tasks:
- keep API unchanged
- introduce ML model
- define training data
- add confidence scoring
- fallback to rules if needed

---

## Phase E — AI Assistant Stabilization

Goal: Fully working assistant

Tasks:
- integrate LLM properly
- ensure grounding
- use farm + weather + irrigation context
- ensure stable responses
- connect to UI

---

## Phase F — Agentic AI (FINAL)

Goal: System-wide intelligent orchestration

Tasks:
- define agent roles
- allow tool usage:
  - irrigation
  - disease
  - assistant
- ensure safe decision boundaries
- keep system deterministic

---

## Final State

System is:
- fully functional
- scientifically valid
- user-friendly
- AI-enhanced
- ready for deployment