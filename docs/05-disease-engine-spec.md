# HASAD Disease Risk Engine Specification

## Goal
Estimate crop disease risk using crop context and weather conditions.

## Version 1 (Current)
- Rule-based engine
- Score-based risk (0–100)
- Based on humidity, temperature, rainfall, wind

## Version 2 (Next Phase — ML)
Replace rule engine with ML models.

### Design:
- Crop-specific models (recommended)
- Example:
  - Tomato → Early blight model
  - Olive → Peacock spot model

### Requirements:
- Keep SAME API contract
- Add confidence score
- fallback to rule engine if:
  - no model available
  - missing inputs

## Inputs
- active crop_type
- active crop_stage
- weather:
  - temperature_c
  - humidity_pct
  - rainfall_mm
  - wind_speed_mps
  - cloud_pct
- recent weather history (optional)

## Output
- disease_name
- risk_score (0–100)
- risk_level (low | medium | high)
- explanation_text
- features_json
- triggered_rules_json (only for rule fallback)

## Design rule
ML integration must NOT break:
- API structure
- frontend expectations