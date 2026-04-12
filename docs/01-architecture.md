# HASAD Architecture

## Overview
HASAD is a modular web application with:
- React frontend
- FastAPI backend
- PostgreSQL database
- External weather provider
- Optional LLM provider for assistant features

The system is designed so that:
- the frontend handles user interaction and visualization
- the backend owns business logic and validation
- the database stores persistent farm, weather, irrigation, disease, and chat records
- external services provide weather and LLM capabilities

## Main components

### Frontend
Responsible for:
- auth screens
- dashboard
- farms and farm management
- crop configuration UI
- irrigation result display
- disease risk display
- assistant chat UI
- session history UI
- loading/error/empty states
- admin pages (future / partial)

### Backend
Responsible for:
- auth and authorization
- farm ownership checks
- validation
- weather ingestion
- crop service and Kc derivation
- irrigation logic
- disease risk logic
- assistant grounding
- chat session/message persistence
- logging
- assumptions/explainability generation

### Database
Stores:
- users
- farms
- crop settings
- weather logs
- irrigation recommendations
- disease assessments
- chat sessions/messages
- system logs

## Key backend service areas

### Auth services
- user registration/login
- verification flows
- optional 2FA support
- password reset/security flows

### Weather services
- fetch current weather by farm coordinates
- normalize external provider response
- persist weather logs
- expose weather history

### Crop services
- canonical crop/stage normalization
- Kc derivation from crop_type + crop_stage
- optional user override handling

### Irrigation services
- ET0 calculation
- Penman-Monteith as primary method
- Hargreaves fallback when required data missing
- ETc calculation
- rainfall adjustment
- irrigation efficiency handling
- volume calculations
- detailed assumptions tracking

### Disease services
- current rule-based risk assessment
- future ML-ready interface without breaking API contract

### Assistant services
- grounded context assembly
- farm-aware and session-aware chat handling
- persistence of chat sessions/messages
- future RAG upgrade path

## Architectural principles
- service-layer separation over fat routes
- typed schemas for request/response
- persistent state in database, not in-memory app logic
- farm-scoped access control
- explainable outputs where scientific logic is involved
- backward-compatible evolution where practical

## Current maturity
The system is no longer just an MVP skeleton. It now contains:
- stable auth/farm/weather flows
- crop-aware irrigation
- persisted assistant chat
- scientific irrigation calculations
- historical records and dashboard integration

## Planned next architectural evolution
1. disease ML integration behind current API contract
2. RAG-based assistant grounding
3. admin observability and system logs expansion
4. agentic tool orchestration later