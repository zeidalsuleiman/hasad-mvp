# HASAD Disease Risk Engine Specification

## Goal
Estimate crop disease risk from farm crop context and weather conditions.

## Version 1 rule
Implement a rules-based or score-based engine first.
Do not require a trained ML model in v1.

## Inputs
- active crop_type
- active crop_stage if available
- current weather:
  - temperature_c
  - humidity_pct
  - rainfall_mm
- recent weather history if available

## Output
- disease_name
- risk_score: 0 to 100
- risk_level: low | medium | high
- triggered_rules[]
- explanation_text

## Design rule
Make the engine replaceable later by a trained ML model without changing the API contract.