# HASAD Implementation Notes

## Current repo reality
The current repository is still an MVP skeleton.
It mainly covers:
- basic auth
- weather fetch
- frontend/backend connection
- Docker
- basic CI

## Important direction
1. Replace in-memory users with database persistence
2. Add PostgreSQL to docker-compose
3. Move secrets to env-based config
4. Build service-layer modules for irrigation and disease logic
5. Keep assistant grounded and constrained
6. Add tests for real feature paths