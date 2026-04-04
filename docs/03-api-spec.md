# HASAD API Specification

## Base path
/api/v1

## Auth
POST /auth/register
POST /auth/login
GET /auth/me

## Farms
GET /farms
POST /farms
GET /farms/{farm_id}
PATCH /farms/{farm_id}
DELETE /farms/{farm_id}

## Crop Configuration
GET /farms/{farm_id}/crop
POST /farms/{farm_id}/crop
PATCH /farms/{farm_id}/crop

## Weather
GET /farms/{farm_id}/weather/current
GET /farms/{farm_id}/weather/history

## Irrigation
POST /farms/{farm_id}/irrigation/calculate
GET /farms/{farm_id}/irrigation/history

## Disease Risk
POST /farms/{farm_id}/disease-risk/calculate
GET /farms/{farm_id}/disease-risk/history

## Assistant
POST /chat/sessions
GET /chat/sessions
GET /chat/sessions/{session_id}
POST /chat/sessions/{session_id}/messages

## Admin
GET /admin/users
GET /admin/system-logs