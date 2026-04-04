# HASAD Product Scope

## Product summary
HASAD is a smart farming web system for Jordanian farmers. It provides low-cost digital farm support using weather-based intelligence instead of expensive on-farm hardware sensors.

## Primary users
### Farmer
A registered user who manages farms, views recommendations, checks disease risk, and interacts with the assistant.

### Admin
A privileged user who can monitor users, system health/logs, and basic platform activity.

## Must-have features
1. User registration and login
2. JWT-based authenticated API access
3. Farm CRUD
4. Crop and soil configuration per farm
5. Weather retrieval based on stored farm coordinates
6. Irrigation recommendation generation and persistence
7. Disease risk assessment generation and persistence
8. AI assistant grounded on local project knowledge and farm context
9. History pages for prior recommendations/assessments
10. Admin visibility into system logs/basic platform activity

## Out of scope
- Native mobile app
- IoT sensor integration
- Payments
- Marketplace
- Satellite imagery pipeline
- Full MLOps platform