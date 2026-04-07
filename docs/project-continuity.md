# HASAD Project Continuity (Living State)

## Current Phase
- Stabilization Phase (End-to-End Readiness)

## Current System Status
- Backend: working (FastAPI)
- Frontend: working (React)
- Database: PostgreSQL integrated
- Authentication: implemented but under stabilization
- Dashboard: functional but needs alignment with spec
- Irrigation Engine: simplified ET0 (not full Penman-Monteith)
- Disease Engine: rule-based (temporary)
- AI Assistant: partially integrated (API key exists, not stable)
- Docker: build issues (frontend npm mismatch)

---

## Current Goal
Make the system **fully working end-to-end**:

User flow:
Register → Verify → Login → Dashboard → Farms → Weather → Irrigation → Disease → Assistant

---

## Modules Status

### Authentication
- OTP-based verification (target UX)
- OTP-based password reset
- 2FA exists (optional)
- Issues:
  - CORS errors (frontend blocked)
  - email delivery must be verified
  - UI still contains legacy token flows (must be removed)

👉 Target:
- Clean OTP-only flow
- No activation/token screens
- Fully working email delivery

---

### Dashboard
- Basic rendering works
- Needs:
  - layout cleanup
  - correct data cards (weather, irrigation, disease)
  - proper loading/error states

---

### Farm Configuration
- Backend working
- Frontend partially implemented
- Needs:
  - validation
  - clean UX
  - alignment with schema

---

### Irrigation Engine
- Current:
  - simplified ET0 (Hargreaves-like)

- Target:
  - move toward FAO-56 Penman-Monteith compatible model

- Missing:
  - full weather variables
  - solar radiation / approximation
  - stronger assumptions tracking

---

### Disease Engine
- Current:
  - rule-based scoring

- Target:
  - ML-based model (future phase)
  - must NOT break API contract

---

### AI Assistant
- Current:
  - service exists
  - API key configured
  - not stable

- Target:
  - grounded responses using:
    - farm
    - weather
    - irrigation
    - disease

---

## Hard Rules for Development

1. Do NOT introduce new features outside docs scope
2. Do NOT redesign UI beyond frontend-spec
3. Keep backend logic in services (not routes)
4. Do NOT break API contracts
5. Always update docs when behavior changes
6. Prefer fixing flows over adding features

---

## Known Temporary Implementations

- Irrigation ET0 simplified → will be upgraded
- Disease engine rule-based → will be ML
- Assistant → not fully integrated yet

---

## Next Immediate Steps

1. Fix authentication completely:
   - CORS
   - email sending
   - remove token flows
   - confirm OTP flows

2. Fix dashboard:
   - correct rendering
   - remove UI bugs

3. Fix farm configuration UI

4. Confirm full end-to-end flow works

---

## After Stabilization

- Irrigation upgrade
- Disease ML upgrade
- Assistant stabilization
- Agentic AI layer (final phase)

---

## DO NOT REGRESS

- working auth flows
- database schema
- API structure
- JWT logic
- farm ownership checks