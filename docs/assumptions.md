# HASAD Assumptions Log

Use this file to record implementation-time assumptions.

## Template
- Date:
- Area:
- Assumption:
- Why needed:
- Impact:

---

## Assumptions

### Date: 2026-04-03
**Area: Database Schema**

**Assumption:** The database uses PostgreSQL with UUID primary keys for all tables.

**Why needed:** UUIDs are preferred for distributed systems and provide better security than auto-increment integers. PostgreSQL native UUID support is efficient.

**Impact:** All model IDs are UUID type, requiring proper handling in API responses and frontend.

---

### Date: 2026-04-03
**Area: Authentication**

**Assumption:** Users are identified by email address (not username). JWT tokens contain user ID in the "sub" claim.

**Why needed:** Email is more standard for modern web applications and easier to verify uniqueness.

**Impact:** Login/register endpoints use email instead of username. Frontend forms must collect email.

---

### Date: 2026-04-03
**Area: Farm Ownership**

**Assumption:** Each farm belongs to exactly one user (user_id foreign key). No shared farms.

**Why needed:** Simpler data model aligned with product scope (individual farmer accounts). Multi-tenancy is out of scope.

**Impact:** Farm access checks compare farm.user_id with current user ID. No farm sharing features.

---

### Date: 2026-04-03
**Area: Weather Caching**

**Assumption:** Weather data is cached for 1 hour. If recent data exists (within last hour), it's returned instead of fetching from API.

**Why needed:** Reduces API calls and improves response time. Weather doesn't change that frequently.

**Impact:** `/farms/{id}/weather/current` may return cached data. Manual refresh button fetches new data.

---

### Date: 2026-04-03
**Area: Crop Configuration**

**Assumption:** Each farm has at most one active crop configuration. Creating a new crop config deactivates the previous one.

**Why needed:** Simplifies the system and aligns with current product flow.

**Impact:** POST to crop endpoint deactivates existing active crops. Only one crop per farm is returned.

---

### Date: 2026-04-03
**Area: API Versioning**

**Assumption:** API is versioned at `/api/v1/` prefix. This prefix is applied to all routes.

**Why needed:** Allows future breaking changes while maintaining backward compatibility.

**Impact:** All API routes include the `/api/v1` prefix. Frontend API client must use this prefix.

---

### Date: 2026-04-03
**Area: Location Format**

**Assumption:** Farm coordinates are stored as decimal degrees (latitude/longitude). Validation allows latitude: -90 to 90, longitude: -180 to 180.

**Why needed:** Standard format for geolocation APIs and mapping services.

**Impact:** Frontend must validate coordinate ranges. Weather APIs require this format.

---

### Date: 2026-04-03
**Area: Soil Types**

**Assumption:** Soil type may originate as free text in stored data, but irrigation logic normalizes values to canonical buckets internally.

**Why needed:** Existing records and user input may vary in casing/spelling.

**Impact:** Irrigation calculations should not silently fail just because soil text varies.

---

### Date: 2026-04-03
**Area: Area Units**

**Assumption:** Farm area is measured in dunums (~1000 m²), not hectares or acres.

**Why needed:** This is a Jordanian agricultural system, and dunum is the standard local unit.

**Impact:** Volume calculations can convert mm/day into practical water totals using dunum-based area.

---

### Date: 2026-04-03
**Area: User Roles**

**Assumption:** Two user roles exist: farmer (default) and admin.

**Why needed:** Prepared for admin features later without blocking current farmer flows.

**Impact:** Role column exists in database and auth model, even if admin features are not yet the immediate focus.

---

### Date: 2026-04-03
**Area: Frontend Routing**

**Assumption:** React Router is used for client-side routing. No server-side rendering.

**Why needed:** Standard approach for React SPAs.

**Impact:** All navigation is handled on the client side.

---

### Date: 2026-04-03
**Area: Testing Framework**

**Assumption:** pytest is used for backend tests. Frontend tests are preferred when practical.

**Why needed:** pytest integrates well with FastAPI and service-layer testing.

**Impact:** Backend regression confidence depends primarily on pytest coverage.

---

### Date: 2026-04-03
**Area: Test Database**

**Assumption:** Tests use SQLite in-memory database with SQLAlchemy models.

**Why needed:** Isolates test data, speeds up execution, and avoids requiring a live PostgreSQL for every test.

**Impact:** Models and JSON field choices should remain SQLite-compatible where practical.

---

### Date: 2026-04-03
**Area: Error Handling**

**Assumption:** Backend errors return JSON with a `detail` field. Frontend displays/extracts this field.

**Why needed:** Consistent error format across endpoints.

**Impact:** Frontend error handling should remain aligned with this structure.

---

### Date: 2026-04-12
**Area: Irrigation Engine**

**Assumption:** Penman-Monteith is used as the primary ET0 method, with Hargreaves as fallback when required inputs are unavailable.

**Why needed:** Improves scientific accuracy while maintaining robustness.

**Impact:** Irrigation outputs must clearly state which ET0 method was used.

---

### Date: 2026-04-12
**Area: Crop Coefficients**

**Assumption:** Crop coefficient values are derived from a canonical crop table using crop_type + crop_stage, unless the user provides an override.

**Why needed:** Crop-aware irrigation should not depend on users manually entering Kc as the normal flow.

**Impact:** Crop configuration directly influences ETc and irrigation recommendations.

---

### Date: 2026-04-12
**Area: Radiation Estimation**

**Assumption:** When direct solar radiation is unavailable, radiation-related terms may be estimated from available weather fields such as cloud cover, date, and latitude.

**Why needed:** External provider data may not include full agronomic radiation variables.

**Impact:** Irrigation assumptions must document estimated-radiation logic explicitly.

---

### Date: 2026-04-12
**Area: Disease Engine Evolution**

**Assumption:** The disease risk engine remains rule-based for now, but must be replaceable by crop-specific ML models without changing the API contract.

**Why needed:** Allows incremental upgrade toward ML while preserving frontend/backend compatibility.

**Impact:** Output structure must remain stable through the disease ML phase.

---

### Date: 2026-04-12
**Area: Assistant Persistence**

**Assumption:** Assistant chat is session-based and persisted in the database, not handled as local-only transient UI state.

**Why needed:** Supports per-farm history, continuity, and future RAG/agentic evolution.

**Impact:** Chat session/message tables and assistant flows must not regress to stateless/local-only behavior.