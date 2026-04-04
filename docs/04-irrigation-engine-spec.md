# HASAD Irrigation Engine Specification

## Goal
Generate a daily irrigation recommendation for a farm using weather-based calculations and crop-specific adjustment.

## Required inputs
- farm latitude
- farm longitude
- soil_type
- active crop_type
- active crop_stage
- weather inputs:
  - temperature_c
  - humidity_pct
  - wind_speed_mps
  - pressure_hpa if available
  - rainfall_mm if available
  - observed_at

## Pipeline
1. Validate farm and active crop config
2. Resolve latest weather record or fetch/store current weather
3. Determine crop coefficient Kc
4. Compute ET0 using a documented consistent method
5. Compute ETc = ET0 * Kc
6. Adjust for effective rainfall
7. Produce net irrigation mm
8. Generate recommendation text
9. Persist result with assumptions

## Output fields
- et0
- kc
- etc
- effective_rainfall_mm
- net_irrigation_mm
- recommendation_text
- assumptions[]