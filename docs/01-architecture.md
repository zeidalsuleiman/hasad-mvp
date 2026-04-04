# HASAD Architecture

## Overview
HASAD is a modular web application with:
- React frontend
- FastAPI backend
- PostgreSQL database
- External weather provider
- Optional LLM provider for assistant features

## Main components
### Frontend
Responsible for:
- auth screens
- farms
- dashboard
- irrigation result display
- disease risk display
- assistant chat
- history pages
- admin pages

### Backend
Responsible for:
- auth and authorization
- farm ownership checks
- validation
- weather ingestion
- irrigation logic
- disease risk logic
- assistant grounding
- persistence
- logging

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