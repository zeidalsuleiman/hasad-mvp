# HASAD Database Schema

## users
- id UUID PK
- full_name
- email unique
- password_hash
- role enum(farmer, admin)
- is_active
- is_verified
- two_factor_enabled
- totp_secret_hash nullable
- backup_codes_hash nullable
- backup_codes_updated_at nullable
- activation_token_hash nullable
- activation_token_expires_at nullable
- password_reset_token_hash nullable
- password_reset_token_expires_at nullable
- created_at
- updated_at

## farms
- id UUID PK
- user_id FK users.id
- name
- latitude
- longitude
- area_dunum nullable
- soil_type
- irrigation_method nullable
- notes nullable
- created_at
- updated_at

## farm_crops
- id UUID PK
- farm_id FK farms.id
- crop_type
- crop_stage
- planting_date nullable
- root_depth_m nullable
- kc_value_override nullable
- is_active
- created_at
- updated_at

## weather_logs
- id UUID PK
- farm_id FK farms.id
- source
- observed_at
- temperature_c nullable
- temp_max_c nullable
- temp_min_c nullable
- dew_point_c nullable
- humidity_pct nullable
- wind_speed_mps nullable
- pressure_hpa nullable
- rainfall_mm nullable
- cloud_pct nullable
- weather_description nullable
- raw_payload_json nullable
- created_at

## irrigation_recommendations
- id UUID PK
- farm_id FK farms.id
- weather_log_id FK weather_logs.id nullable
- et0
- et0_method nullable
- kc
- etc
- effective_rainfall_mm nullable
- net_irrigation_mm
- recommendation_text
- assumptions_json nullable
- confidence nullable
- created_at

## disease_risk_assessments
- id UUID PK
- farm_id FK farms.id
- weather_log_id FK weather_logs.id nullable
- crop_type
- disease_name
- risk_score
- risk_level enum(low, medium, high)
- triggered_rules_json nullable
- features_json nullable
- explanation_text
- created_at

## chat_sessions
- id UUID PK
- user_id FK users.id
- farm_id FK farms.id nullable
- title nullable
- created_at
- updated_at

## chat_messages
- id UUID PK
- session_id FK chat_sessions.id
- role enum(system, user, assistant)
- content
- citations_json nullable
- created_at

## system_logs
- id UUID PK
- actor_user_id FK users.id nullable
- action
- entity_type nullable
- entity_id nullable
- metadata_json nullable
- created_at

## Notes
- One farm can have multiple crop records historically, but only one active crop configuration at a time.
- Weather logs are append-only records tied to farms.
- Irrigation and disease results are persisted as historical records.
- Chat sessions are farm-aware but farm_id is nullable so session history can survive farm deletion if desired.
- Scientific outputs remain explainable via assumptions_json and related metadata.