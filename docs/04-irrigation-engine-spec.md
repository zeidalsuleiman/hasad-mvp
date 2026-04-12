# HASAD Irrigation Engine Specification

## Goal
Generate a scientifically accurate daily irrigation recommendation using FAO-56 Penman-Monteith with crop-specific adjustment.

## Required inputs
- farm latitude
- farm longitude
- soil_type
- active crop_type
- active crop_stage
- weather inputs:
  - temperature_c
  - temp_max_c
  - temp_min_c
  - humidity_pct
  - wind_speed_mps
  - pressure_hpa
  - rainfall_mm
  - cloud_pct
  - observed_at

## Pipeline
1. Validate farm and active crop config
2. Resolve latest weather record or fetch/store current weather
3. Determine crop coefficient Kc
4. Compute ET0 using FAO-56 Penman-Monteith (primary)
   - fallback to Hargreaves if required inputs missing
5. Compute ETc = ET0 × Kc
6. Adjust for effective rainfall
7. Compute net irrigation
8. Apply irrigation efficiency → gross irrigation
9. Generate recommendation text
10. Persist result with assumptions

## Output fields
- et0
- et0_method (penman-monteith | hargreaves)
- kc
- etc
- effective_rainfall_mm
- net_irrigation_mm
- recommendation_text
- assumptions_json

## Transparency Rules
All results must include:
- ET0 method used
- temperature inputs (Tmean, Tmax, Tmin)
- humidity, wind, pressure
- radiation estimation method
- Kc source (derived or override)
- rainfall handling
- efficiency adjustment
- fallback list (if any)

## Notes
- Soil heat flux G = 0 (daily timestep)
- Radiation estimated from cloud cover if solar data unavailable
- Dew point derived from humidity when not provided