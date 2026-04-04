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

**Why needed:** Simplifies the MVP. Most farms grow one primary crop at a time.

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

**Assumption:** Soil type is a free-text string, not an enum.

**Why needed:** Allows flexibility for various soil descriptions (clay, loam, sandy, silt, etc.).

**Impact:** No validation on soil types beyond being a non-empty string.

---

### Date: 2026-04-03
**Area: Area Units**

**Assumption:** Farm area is measured in "dunums" (Jordanian unit, ~1000 m²), not hectares or acres.

**Why needed:** This is a Jordanian agricultural system, and dunum is the standard local unit.

**Impact:** Frontend displays area in dunums. Conversion to other units would require backend changes.

---

### Date: 2026-04-03
**Area: User Roles**

**Assumption:** Two user roles: "farmer" (default) and "admin". Admin routes are not implemented in Phase 1.

**Why needed:** Prepared for future admin features (monitoring, logs) without blocking Phase 1.

**Impact:** Role column exists in database but admin-specific endpoints are not yet implemented.

---

### Date: 2026-04-03
**Area: Frontend Routing**

**Assumption:** React Router is used for client-side routing. No server-side rendering.

**Why needed:** Standard approach for React SPAs. Simple to implement and maintain.

**Impact:** All navigation is handled on client side. Page refreshes work but require full reload.

---

### Date: 2026-04-03
**Area: Testing Framework**

**Assumption:** pytest is used for backend tests. Frontend tests preferred when practical.

**Why needed:** pytest is standard for Python testing and integrates well with FastAPI.

**Impact:** Tests use SQLite in-memory database for isolation. Production uses PostgreSQL.

---

### Date: 2026-04-03
**Area: Test Database**

**Assumption:** Tests use SQLite in-memory database with SQLAlchemy models. Database URL is overridden via fixtures.

**Why needed:** Isolates test data, faster execution, no external dependencies.

**Impact:** Tests can run independently of production database.

---

### Date: 2026-04-03
**Area: Error Handling**

**Assumption:** Backend errors return JSON with a "detail" field. Frontend displays this to users.

**Why needed:** Consistent error format across all endpoints. FastAPI's default behavior.

**Impact:** Frontend error handling must extract `detail` field from error responses.

---

### Date: 2026-04-03 (Phase 1 Test Results)

**Assumption:** Weather endpoint tests have been deferred due to UUID handling complexity. The issue involves PostgreSQL UUID types vs. SQLite in-memory database tests.

**Why needed:** Weather tests require complex UUID handling to work with both SQLite (tests) and PostgreSQL (production). The issue stems from SQLAlchemy's UUID type expecting UUID objects when comparing with string values, but the test fixture is not properly mocking the database behavior.

**Impact:** Weather endpoints are implemented and functional, but tests need refinement. Tests for auth, farms, and crops (39 tests) all pass successfully.

---

### Date: 2026-04-03 (Phase 1 Completion Status)

**Assumption:** Database migrations are structured and can be applied via Alembic. The initial schema migration (001_initial_schema) defines all Phase 1 tables.

**Why needed:** Provides clean database initialization and version control.

**Impact:** Production database can be initialized with `alembic upgrade head`. Tests use SQLite with schema creation.

---

### Date: 2026-04-03
**Area: Backend Deployment**

**Assumption:** Docker Compose is configured with PostgreSQL service. The backend depends on db hostname "db".

**Why needed:** Standard containerization approach for FastAPI + PostgreSQL.

**Impact:** Backend must start after PostgreSQL is healthy. Connection string uses `db:5432`.

---

### Date: 2026-04-03
**Area: Environment Variables**

**Assumption:** Configuration uses environment variables via `.env` file. Template provided in `.env.example`.

**Why needed:** Secure configuration management. Secrets never committed to code.

**Impact:** Developers must copy `.env.example` to `.env` and fill in values. `.env` should be gitignored.

---

### Date: 2026-04-03
**Area: CORS**

**Assumption:** CORS is configured to allow requests from `http://localhost:3000`.

**Why needed:** Standard development setup for React dev server.

**Impact:** Frontend dev server can call backend API without CORS errors. Production would need proper origins list.

---

### Date: 2026-04-03
**Area: Password Storage**

**Assumption:** Passwords are hashed using bcrypt. The password hash is stored in the database, never in plain text.

**Why needed:** Security best practice. Compromise of password database would be catastrophic.

**Impact:** No plaintext passwords in database or logs. Forgotten passwords must be reset.

---

### Date: 2026-04-03
**Area: Service Layer Separation**

**Assumption:** Business logic is separated into service modules (AuthService, FarmService, WeatherService) rather than in route handlers.

**Why needed:** Code is more modular, testable, and reusable.

**Impact:** Route handlers remain thin and focus on request/response handling.

---

### Date: 2026-04-03
**Area: Pydantic Schemas**

**Assumption:** Pydantic is used for request/response validation and serialization.

**Why needed:** Provides automatic validation and type hints.

**Impact:** Invalid data returns 400 Bad Request errors before reaching handlers.

---

### Date: 2026-04-03
**Area: SQLAlchemy ORM**

**Assumption:** SQLAlchemy is used with declarative base pattern. Models inherit from Base.

**Why needed:** Standard Python ORM with first-class FastAPI integration.

**Impact:** Database queries are type-safe and efficient.

---

### Date: 2026-04-03 (Phase 1 Weather Tests - RESOLVED)

**Area: Weather Endpoint Tests**

**Assumption:** Weather endpoint tests are deferred due to complex UUID handling issues in test environment.

**Resolution:** Fixed by adding `uuid.UUID()` conversion in WeatherService methods (`get_farm_weather_history`, `get_latest_weather`, `create_weather_log`) and in the weather API endpoint. The issue was that SQLAlchemy's `UUID(as_uuid=True)` column type expects UUID objects, not strings, when performing comparisons and insertions. SQLite and PostgreSQL handle UUID types differently, but converting string parameters to UUID objects before queries resolves the issue consistently across both databases.

**Impact:** All 10 weather tests now pass. Full test suite: 49/49 tests passing.

---

### Date: 2026-04-03 (Phase 1 Status Summary)

**Completed:**
- PostgreSQL database schema with 4 tables (users, farms, farm_crops, weather_logs)
- JWT authentication with bcrypt password hashing
- User registration/login/me endpoints (9 tests pass)
- Farm CRUD endpoints (14 tests pass)
- Crop configuration endpoints (11 tests pass)
- Farm ownership protection verified (7 tests pass)
- Unauthorized access tests (2 tests pass)
- Weather current/history endpoints (10 tests pass)
- Database migration structure (001_initial_schema)
- Docker Compose with PostgreSQL service
- Environment variable template (.env.example)
- Frontend API client updated for /api/v1 paths
- React Router navigation
- Frontend AuthContext for auth state management
- Updated Auth.jsx with email/name fields
- Updated Dashboard.jsx to show farms list
- Created Farms.jsx and CreateFarm.jsx pages
- Comprehensive backend test suite (49 total, 49 pass)

**Outstanding from Phase 1:**
- Crop configuration UI (backend API exists, but no frontend form yet)

**Ready for Phase 2:**
- Irrigation recommendation engine (backend service and API stubs ready)
- Disease risk assessment engine (backend service and API stubs ready)

---

### Date: 2026-04-03
**Area: Irrigation Engine ET0 Method**

**Assumption:** Hargreaves method is used for ET0 calculation. This is a simplified approach that uses available weather data (temperature, latitude, day of year) without requiring full FAO-56 Penman-Monteith inputs (wind speed, solar radiation, humidity).

**Why needed:** Penman-Monteith requires additional weather data that may not be consistently available. Hargreaves is a reasonable approximation for agricultural use.

**Impact:** ET0 calculations are estimates based on temperature and latitude. All assumptions are documented in the irrigation recommendation output.

---

### Date: 2026-04-03
**Area: Irrigation Crop Coefficients**

**Assumption:** Crop coefficient (Kc) values are based on FAO-56 guidelines for common crops. Users can override Kc values if they have crop-specific data.

**Why needed:** Provides scientifically-based defaults while allowing farmer customization.

**Impact:** Default Kc values are reasonable estimates. Farmers can adjust based on local conditions and crop varieties.

---

### Date: 2026-04-03
**Area: Irrigation Soil Factors**

**Assumption:** Different soil types retain different amounts of rainfall. Soil factors are applied to calculate effective rainfall (Sandy: 0.6, Loamy: 0.7, Clay: 0.8, etc.).

**Why needed:** Accounts for drainage characteristics when determining irrigation needs.

**Impact:** Irrigation recommendations consider soil type. Heavy rainfall on sandy soil may require more irrigation than on clay soil.

---

### Date: 2026-04-03
**Area: Disease Risk Engine Model**

**Assumption:** Disease risk assessment uses a generic rule-based model (version 1) for fungal disease risk. This can be replaced by a trained ML model in future versions without changing the API contract.

**Why needed:** MVP requirement is a rule-based system. ML model requires training data and infrastructure not yet available.

**Impact:** Risk assessments are based on evidence-based rules for fungal disease conditions (humidity, temperature, rainfall, wind, cloud cover). Output format (disease_name, risk_score, risk_level, triggered_rules, explanation) is consistent with what an ML model would provide.

---

### Date: 2026-04-03
**Area: Disease Risk Rules**

**Assumption:** Disease risk rules evaluate conditions like high humidity (>80%), moderate humidity with warm temps, recent rainfall (>5mm), high temps (>30°C), low wind (<2 m/s), and cloud cover (>70%). Each rule contributes to risk score (0-100 scale).

**Why needed:** Based on agricultural research about conditions that promote fungal disease development.

**Impact:** Risk scores are calculated from triggered rules. Risk levels: low (0-33), medium (34-66), high (67-100).

---

### Date: 2026-04-03 (Phase 2 Status Summary)

**Completed:**
- Irrigation recommendation model (IrrigationRecommendation table)
- Irrigation service with Hargreaves ET0 calculation
- Irrigation API endpoints (calculate, history)
- Irrigation tests (13 tests pass)
- Database migration 002 for irrigation table
- Disease risk assessment model (DiseaseRiskAssessment table)
- Disease risk service with generic rule-based model
- Disease risk API endpoints (calculate, history)
- Disease risk tests (13 tests pass)
- Database migration 003 for disease table
- Updated main.py with irrigation and disease routers

**Total Tests:** 75/75 passing (49 Phase 1 + 26 Phase 2)

**Ready for Phase 3:**
- Grounded AI assistant (backend service and API)
- Reporting and logs (backend endpoints)
- Admin observability (backend endpoints)

---

### Date: 2026-04-03
**Area: AI Assistant MVP Design**

**Assumption:** Phase 3 MVP implements a stateless AI assistant that provides agricultural advice grounded in system data. No session persistence - client manages conversation history.

**Why needed:** Simplifies initial implementation. Focuses on grounded, single-turn responses with data attribution. Session management can be added in Phase 4 without changing API contract.

**Impact:** Assistant API requires farm_id and message in request, returns grounded response with sources_used, data_references, and confidence_level. Client must manage conversation state.

---

### Date: 2026-04-03
**Area: AI Assistant System Prompt**

**Assumption:** System prompt uses strict anti-hallucination instructions. Context is injected in structured format (FARM, WEATHER, IRRIGATION, DISEASE RISK). LLM instructed to use ONLY provided data, cite sources, state when data unavailable.

**Why needed:** Prevents AI from giving generic or incorrect advice. Ensures responses are grounded in actual farm data.

**Impact:** All responses are farm-specific and data-sourced. No hallucinated weather, crop, or disease information.

---

### Date: 2026-04-03
**Area: AI Assistant Data Retrieval**

**Assumption:** Assistant retrieves latest data from existing tables (farms, farm_crops, weather_logs, irrigation_recommendations, disease_risk_assessments). "Latest" means most recent by created_at desc, limit 1.

**Why needed:** Provides up-to-date context for AI. Ensures responses reflect current farm state.

**Impact:** Assistant responses reference real calculations and measurements. If no data exists for a category, response states "Available: false" clearly.

---

### Date: 2026-04-03
**Area: AI Assistant Confidence Level**

**Assumption:** Confidence level calculated from data availability: high (3 sources), medium (2 sources), low (1 source), low (no sources).

**Why needed:** Indicates to users how reliable the AI's answer is based on available data.

**Impact:** Users see confidence level and understand when AI has full context vs partial context.

---

### Date: 2026-04-03
**Area: AI Assistant LLM Integration**

**Assumption:** Phase 3 MVP returns structured response rather than calling an LLM. The system prompt and context structure are ready for LLM integration. Future versions can replace the structured response with actual LLM call.

**Why needed:** Allows immediate implementation without LLM API dependency. Demonstrates data retrieval and grounding architecture.

**Impact:** Current responses are template-based with context injection. Future LLM integration can replace the `process_chat_request` return value.

---

### Date: 2026-04-03
**Area: AI Assistant Response Schema**

**Assumption:** ChatResponse includes assistant_response, sources_used (list of data sources), data_references (structured dict with farm, crop, weather, irrigation, disease_risk), and confidence_level.

**Why needed:** Provides frontend with data to display and shows attribution. Confidence level helps users gauge reliability.

**Impact:** Frontend can display context cards (weather conditions, irrigation recommendation, disease risk) alongside AI advice.

---

### Date: 2026-04-03 (Phase 3 MVP Status Summary)

**Completed:**
- AssistantService with structured context building and confidence calculation
- Assistant schemas (ChatRequest, ChatResponse)
- Assistant API route (POST /api/v1/assistant/chat) with auth and ownership validation
- Assistant tests (9 tests pass)
- Updated main.py with assistant router

**Total Tests:** 84/84 passing (75 Phase 1-2 + 9 Phase 3 MVP)

**No database migration needed:** MVP is stateless, no persistence tables

**Ready for Phase 4:** Full LLM integration, session persistence, reporting endpoints, admin observability.
