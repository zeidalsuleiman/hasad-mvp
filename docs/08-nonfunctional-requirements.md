# HASAD Non-Functional Requirements

## Security
- JWT authentication
- hashed passwords
- secrets from environment variables
- farm ownership checks
- admin-only protection for admin routes
- optional 2FA support
- secure token/OTP handling

## Reliability
- graceful handling of external weather API failures
- important failures logged
- graceful fallback from Penman-Monteith to Hargreaves when required data is missing
- registration should not leave local development unusable due to SMTP misconfiguration
- additive schema/API evolution should not break existing data/history

## Maintainability
- modular backend architecture
- business logic separated from route handlers
- clear folder structure
- updated docs
- central crop/Kc logic instead of duplicated business rules
- explainable scientific calculations

## Testability
- automated backend tests for critical flows
- irrigation behavior should remain testable under both primary and fallback methods
- disease engine upgrade should preserve existing API contract for testing
- frontend tests are preferred when practical

## Usability
- minimal-friction onboarding
- clear empty states
- explicit validation feedback
- readable assistant/chat experience
- practical farmer-facing outputs (e.g. mm/day and volume/day where relevant)

## Explainability
- irrigation outputs must include transparent assumptions
- ET0 method must be identifiable
- crop/Kc source must be visible in outputs and/or UI