# HASAD API Specification

## Base path
`/api/v1`

## Auth

### Registration and login
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### Email verification (OTP)
- `POST /auth/verify-email`

### Password reset (OTP-based)
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

### 2FA
- `POST /auth/2fa/verify`
- `POST /auth/2fa/enable`
- `POST /auth/2fa/disable`

## Farms
- `GET /farms`
- `POST /farms`
- `GET /farms/{farm_id}`
- `PATCH /farms/{farm_id}`
- `DELETE /farms/{farm_id}`

## Crop Configuration
- `GET /farms/{farm_id}/crop`
- `POST /farms/{farm_id}/crop`
- `PATCH /farms/{farm_id}/crop`

### Crop response notes
Crop responses should expose:
- crop_type
- crop_stage
- planting_date
- root_depth_m
- kc_value_override
- kc_effective
- kc_source

## Weather
- `GET /farms/{farm_id}/weather/current`
- `GET /farms/{farm_id}/weather/history`

### Weather response notes
Weather responses may include:
- temperature_c
- temp_max_c
- temp_min_c
- dew_point_c
- humidity_pct
- wind_speed_mps
- pressure_hpa
- rainfall_mm
- cloud_pct

## Irrigation
- `POST /farms/{farm_id}/irrigation/calculate`
- `GET /farms/{farm_id}/irrigation/history`

### Irrigation response notes
Irrigation responses should expose:
- et0
- et0_method
- kc
- etc
- effective_rainfall_mm
- net_irrigation_mm
- recommendation_text
- assumptions_json

`assumptions_json` should include calculation trace and fallback indicators.

## Disease Risk
- `POST /farms/{farm_id}/disease-risk/calculate`
- `GET /farms/{farm_id}/disease-risk/history`

### Disease response notes
Disease responses should expose:
- disease_name
- risk_score
- risk_level
- explanation_text
- rule or model context without breaking compatibility

## Assistant

### Session-based assistant
- `POST /chat/sessions`
- `GET /chat/sessions`
- `GET /chat/sessions/{session_id}`
- `POST /chat/sessions/{session_id}/messages`

### Legacy/stateless assistant
- legacy assistant endpoints may still exist for compatibility/testing, but the current primary UX is session-based chat

## Admin
- `GET /admin/users`
- `GET /admin/system-logs`

## API design notes
- All authenticated routes require JWT
- Farm-scoped routes enforce ownership
- Error responses use a consistent JSON `detail` field
- Additive response evolution is preferred over breaking changes