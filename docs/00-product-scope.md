# HASAD Product Scope

## Product summary
HASAD is a smart farming web system for Jordanian farmers. It provides low-cost digital farm support using weather-based intelligence instead of expensive on-farm hardware sensors.

The current product focuses on:
- farm setup and management
- weather-based irrigation recommendations
- crop-aware irrigation using FAO-56 crop coefficients
- disease risk assessment
- session-based agricultural assistant chat
- historical records for irrigation, disease, weather, and chat

## Primary users

### Farmer
A registered user who:
- manages one or more farms
- configures crop information per farm
- views weather and irrigation recommendations
- checks disease risk
- interacts with the AI assistant
- reviews prior calculations and chat history

### Admin
A privileged user who can monitor users, system health/logs, and basic platform activity.
Admin features remain in scope, but are not the immediate next implementation priority.

## Must-have features
1. User registration and login
2. Email verification / secure auth flow
3. JWT-based authenticated API access
4. Optional 2FA support
5. Farm CRUD
6. Crop configuration per farm
7. Soil and irrigation-method configuration per farm
8. Weather retrieval based on stored farm coordinates
9. Irrigation recommendation generation and persistence
10. Crop-specific irrigation using FAO-56 Kc coefficients
11. ET0 calculation using Penman-Monteith as primary method with fallback
12. Disease risk assessment generation and persistence
13. AI assistant grounded on local project knowledge and farm context
14. Per-farm AI chat sessions with history
15. History pages for prior recommendations and assessments
16. Admin visibility into system logs/basic platform activity
17. Transparent assumptions/explanations for irrigation outputs

## Current implemented product state
Implemented now:
- authentication and protected routes
- farm CRUD
- crop configuration UI and backend integration
- weather retrieval and weather logs
- Penman-Monteith-based irrigation engine with explainable assumptions
- rule-based disease risk engine
- session-based assistant chat
- dashboard integration

Next major planned upgrades:
- ML-based disease prediction
- full RAG assistant
- admin observability improvements
- agentic AI orchestration later

## Out of scope
- Native mobile app
- IoT sensor integration
- Payments
- Marketplace
- Satellite imagery pipeline
- Full MLOps platform
- Hardware sensor fleet management