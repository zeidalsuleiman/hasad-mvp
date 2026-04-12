"""
Irrigation recommendation service.

ET0 Methods:
  Primary:  FAO-56 Penman-Monteith (used when temperature + humidity are available)
  Fallback: Hargreaves-Samani (1985) (used when PM inputs are insufficient)

Pipeline per calculation:
  1. Extract and normalise weather inputs
  2. Attempt Penman-Monteith ET0; fall back to Hargreaves if inputs insufficient
  3. Derive crop coefficient Kc (from crop_service)
  4. Compute ETc = ET0 × Kc
  5. Compute effective rainfall from soil-type retention factor
  6. Compute net irrigation requirement
  7. Gross-up for irrigation-method efficiency
  8. Compute total volume from farm area if known
  9. Persist recommendation + full assumptions log
"""

from __future__ import annotations

import math
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.crop import FarmCrop
from app.models.farm import Farm
from app.models.irrigation import IrrigationRecommendation
from app.models.weather import WeatherLog
from app.services import crop_service

# ─── Physical constants ─────────────────────────────────────────────────────
_GSC = 0.0820          # Solar constant  MJ m⁻² min⁻¹
_SIGMA = 4.903e-9      # Stefan-Boltzmann  MJ K⁻⁴ m⁻² day⁻¹
_ALPHA = 0.23          # Albedo of reference grass surface
_AS = 0.25             # Angstrom a-coefficient (FAO-56 default)
_BS = 0.50             # Angstrom b-coefficient (FAO-56 default)
_WIND_HEIGHT_M = 10.0  # OWM wind measurement height (m)
_U2_FACTOR = 4.87 / math.log(67.8 * _WIND_HEIGHT_M - 5.42)  # ≈ 0.748


# ─── Helpers ────────────────────────────────────────────────────────────────

def _svp(temp_c: float) -> float:
    """Saturation vapour pressure (kPa) at temperature temp_c (°C).
    FAO-56 Eq. 11: e°(T) = 0.6108 × exp(17.27T / (T + 237.3))
    """
    return 0.6108 * math.exp(17.27 * temp_c / (temp_c + 237.3))


def _day_of_year(dt: datetime) -> int:
    return dt.timetuple().tm_yday


def _ra_mj(latitude: float, doy: int) -> Tuple[float, float, float]:
    """
    Extraterrestrial radiation Ra (MJ m⁻² day⁻¹), daylight hours N,
    and sunset hour angle ωs (rad).

    FAO-56 Equations 21–23.
    """
    lat_r = math.radians(latitude)
    dr = 1 + 0.033 * math.cos(2 * math.pi * doy / 365)          # FAO-56 Eq. 23
    dec = 0.409 * math.sin(2 * math.pi * doy / 365 - 1.39)      # FAO-56 Eq. 24
    omega_s = math.acos(max(-1.0, min(1.0, -math.tan(lat_r) * math.tan(dec))))  # Eq. 25
    ra = (
        (24 * 60 / math.pi) * _GSC * dr
        * (omega_s * math.sin(lat_r) * math.sin(dec)
           + math.cos(lat_r) * math.cos(dec) * math.sin(omega_s))
    )                                                              # Eq. 21
    n_hours = (24 / math.pi) * omega_s                            # Eq. 34
    return max(0.0, ra), n_hours, omega_s


class IrrigationService:
    """Service for irrigation recommendation calculations."""

    DEFAULT_KC = crop_service.DEFAULT_KC

    # ── Soil retention factors ──────────────────────────────────────────────
    SOIL_FACTORS: Dict[str, float] = {
        "Sandy": 0.60,
        "Loamy": 0.70,
        "Clay":  0.80,
        "Silt":  0.75,
        "Peat":  0.85,
    }
    DEFAULT_SOIL_FACTOR = 0.70

    SOIL_TYPE_ALIASES: Dict[str, str] = {
        "sandy":       "Sandy",
        "sandy loam":  "Sandy",
        "loam":        "Loamy",
        "loamy":       "Loamy",
        "clay":        "Clay",
        "clay loam":   "Clay",
        "heavy clay":  "Clay",
        "silty clay":  "Clay",
        "silt":        "Silt",
        "silty":       "Silt",
        "silt loam":   "Silt",
        "peat":        "Peat",
        "peaty":       "Peat",
    }

    # ── Irrigation method efficiencies ──────────────────────────────────────
    IRRIGATION_EFFICIENCY: Dict[str, float] = {
        "drip":                0.90,
        "trickle":             0.90,
        "micro drip":          0.90,
        "sprinkler":           0.75,
        "overhead":            0.75,
        "overhead sprinkler":  0.75,
        "flood":               0.60,
        "surface":             0.60,
        "furrow":              0.60,
        "basin":               0.60,
        "subsurface":          0.95,
    }
    DEFAULT_IRRIGATION_EFFICIENCY = 0.75

    # ── Soil helpers ────────────────────────────────────────────────────────
    @staticmethod
    def normalize_soil_type(soil_type: str) -> str:
        if not soil_type:
            return ""
        return IrrigationService.SOIL_TYPE_ALIASES.get(
            soil_type.strip().lower(), soil_type.strip()
        )

    @staticmethod
    def get_soil_factor(soil_type: str) -> float:
        canonical = IrrigationService.normalize_soil_type(soil_type or "")
        return IrrigationService.SOIL_FACTORS.get(
            canonical, IrrigationService.DEFAULT_SOIL_FACTOR
        )

    @staticmethod
    def get_irrigation_efficiency(method: Optional[str]) -> float:
        if not method:
            return IrrigationService.DEFAULT_IRRIGATION_EFFICIENCY
        return IrrigationService.IRRIGATION_EFFICIENCY.get(
            method.strip().lower(), IrrigationService.DEFAULT_IRRIGATION_EFFICIENCY
        )

    # ── ET0: Penman-Monteith (FAO-56) ───────────────────────────────────────
    @staticmethod
    def calculate_et0_penman_monteith(
        temp_c: float,
        latitude: float,
        observation_date: Optional[datetime] = None,
        temp_min_c: Optional[float] = None,
        temp_max_c: Optional[float] = None,
        humidity_pct: Optional[float] = None,
        wind_speed_mps: Optional[float] = None,
        pressure_hpa: Optional[float] = None,
        cloud_pct: Optional[float] = None,
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Reference ET0 via FAO-56 Penman-Monteith (daily timestep, mm/day).

        Formula (FAO-56 Eq. 6):
            ET0 = [0.408 Δ(Rn−G) + γ(900/(T+273)) u₂ (es−ea)]
                  / [Δ + γ(1 + 0.34 u₂)]

        Returns (et0_mm_day, details_dict).
        The details_dict carries every intermediate value for transparency.

        Input notes:
        - temp_min_c / temp_max_c: OWM current-weather gives same-day snapshot
          extremes (not true 24-h min/max); used as best available estimate.
        - dew_point_c: not available from OWM free tier; ea is derived from
          humidity_pct using ea = e°(Tmean) × RH/100.
        - wind_speed_mps: OWM reports at 10 m height; converted to 2 m.
        - cloud_pct: used to estimate sunshine fraction (n/N ≈ 1 − cloud/100)
          and solar radiation Rs via Angstrom formula (as=0.25, bs=0.50).
        - pressure_hpa: used directly for psychrometric constant; altitude is
          back-derived for Rso only.
        """
        if observation_date is None:
            observation_date = datetime.utcnow()

        doy = _day_of_year(observation_date)
        details: Dict[str, Any] = {"doy": doy}
        fallbacks: List[str] = []

        # ── Step 1: Temperature ─────────────────────────────────────────────
        have_minmax = (
            temp_min_c is not None
            and temp_max_c is not None
            and temp_max_c > temp_min_c
        )
        if have_minmax:
            tmean = (temp_min_c + temp_max_c) / 2.0
            details["tmean_source"] = "mean(Tmax, Tmin)"
        else:
            tmean = temp_c
            details["tmean_source"] = "OWM current temp (Tmax/Tmin unavailable)"
            fallbacks.append(
                "Tmean: used OWM current reading "
                f"({temp_c:.1f} °C); true daily min/max not in snapshot"
            )
        details["tmean"] = round(tmean, 2)
        details["tmax"] = round(temp_max_c, 2) if temp_max_c is not None else None
        details["tmin"] = round(temp_min_c, 2) if temp_min_c is not None else None

        # ── Step 2: Saturation vapour pressure (es, kPa) ───────────────────
        # FAO-56 Eq. 12: use mean of e°(Tmax) + e°(Tmin) for daily; else e°(Tmean)
        if have_minmax:
            es = ((_svp(temp_max_c) + _svp(temp_min_c)) / 2.0)
            details["es_source"] = "mean(e°(Tmax), e°(Tmin))"
        else:
            es = _svp(tmean)
            details["es_source"] = "e°(Tmean)"
        details["es_kpa"] = round(es, 4)

        # ── Step 3: Actual vapour pressure (ea, kPa) ───────────────────────
        # dew_point_c is always NULL from OWM free tier.
        # Standard approach when only RHmean is available (FAO-56 §3.3.2):
        #   ea = es × RH/100
        rh = humidity_pct if humidity_pct is not None else 50.0
        if humidity_pct is None:
            fallbacks.append("Humidity: missing — defaulted to 50% (moderate conditions)")
        ea = es * (rh / 100.0)
        details["ea_source"] = "es × RHmean/100 (dew point not in OWM free tier)"
        details["ea_kpa"] = round(ea, 4)
        details["rh_pct"] = round(rh, 1)

        # ── Step 4: Vapour pressure deficit ────────────────────────────────
        vpd = max(0.0, es - ea)
        details["vpd_kpa"] = round(vpd, 4)

        # ── Step 5: Slope of SVP curve Δ (kPa/°C) ──────────────────────────
        # FAO-56 Eq. 13
        delta = 4098.0 * _svp(tmean) / (tmean + 237.3) ** 2
        details["delta_kpa_per_c"] = round(delta, 4)

        # ── Step 6: Psychrometric constant γ (kPa/°C) ──────────────────────
        # FAO-56 Eq. 8: γ = 0.665 × 10⁻³ × P (kPa)
        if pressure_hpa is not None:
            p_kpa = pressure_hpa * 0.1
            details["pressure_source"] = "OWM station pressure"
        else:
            p_kpa = 101.325  # sea-level default
            details["pressure_source"] = "defaulted to 101.325 kPa (sea level)"
            fallbacks.append("Atmospheric pressure: not measured — defaulted to 101.325 kPa (sea level)")
        gamma = 0.000665 * p_kpa
        details["gamma_kpa_per_c"] = round(gamma, 4)
        details["pressure_kpa"] = round(p_kpa, 2)

        # ── Step 7: Wind speed at 2 m height (u₂, m/s) ─────────────────────
        # OWM wind is at 10 m; FAO-56 Eq. 47 conversion
        if wind_speed_mps is not None:
            u2 = wind_speed_mps * _U2_FACTOR
            details["wind_source"] = f"OWM 10 m wind × {_U2_FACTOR:.3f} → 2 m"
        else:
            u2 = 2.0  # FAO-56 recommended default when wind is missing
            details["wind_source"] = "defaulted to 2.0 m/s (FAO-56 recommendation)"
            fallbacks.append("Wind speed: missing — defaulted to 2.0 m/s (FAO-56 §2.6)")
        details["u2_mps"] = round(u2, 3)
        details["u10_mps"] = round(wind_speed_mps, 2) if wind_speed_mps is not None else None

        # ── Step 8: Extraterrestrial radiation Ra ───────────────────────────
        Ra, N_hours, omega_s = _ra_mj(latitude, doy)
        details["Ra_mj"] = round(Ra, 3)
        details["N_hours"] = round(N_hours, 2)

        # ── Step 9: Solar radiation Rs (Angstrom formula) ───────────────────
        # n/N ≈ 1 − cloud_pct/100 (cloud fraction → sunshine fraction)
        if cloud_pct is not None:
            sunshine_frac = max(0.0, min(1.0, 1.0 - cloud_pct / 100.0))
            details["cloud_pct"] = round(cloud_pct, 1)
            details["sunshine_frac_source"] = "1 − cloud_pct/100 (OWM cloudiness)"
        else:
            sunshine_frac = 0.5  # conservative default (50% cloud)
            details["cloud_pct"] = None
            details["sunshine_frac_source"] = "defaulted to 0.5 (cloud cover unavailable)"
            fallbacks.append("Cloud cover: missing — sunshine fraction defaulted to 0.5")
        # Angstrom: Rs = (as + bs × n/N) × Ra  (FAO-56 Eq. 35)
        Rs = (_AS + _BS * sunshine_frac) * Ra
        details["Rs_mj"] = round(Rs, 3)
        details["sunshine_frac"] = round(sunshine_frac, 3)

        # ── Step 10: Net shortwave radiation Rns ────────────────────────────
        # FAO-56 Eq. 38: Rns = (1 − α) × Rs
        Rns = (1.0 - _ALPHA) * Rs
        details["Rns_mj"] = round(Rns, 3)

        # ── Step 11: Clear-sky radiation Rso ────────────────────────────────
        # FAO-56 Eq. 37: Rso = (0.75 + 2×10⁻⁵ × z) × Ra
        # Derive elevation from pressure: z ≈ 44307 × (1 − (P/1013.25)^0.19026)
        z_m = max(0.0, 44307.0 * (1.0 - (p_kpa / 101.325) ** 0.19026))
        Rso = (0.75 + 2e-5 * z_m) * Ra
        Rso = max(Rso, 1e-6)  # avoid division by zero in polar-night edge case
        details["Rso_mj"] = round(Rso, 3)
        details["elevation_est_m"] = round(z_m, 0)

        # ── Step 12: Net longwave radiation Rnl ────────────────────────────
        # FAO-56 Eq. 39:
        #   Rnl = σ × T_avg⁴ × (0.34 − 0.14√ea) × (1.35 Rs/Rso − 0.35)
        if have_minmax:
            t4_avg = ((temp_max_c + 273.16) ** 4 + (temp_min_c + 273.16) ** 4) / 2.0
            details["Rnl_T_source"] = "mean(Tmax⁴, Tmin⁴)"
        else:
            t4_avg = (tmean + 273.16) ** 4
            details["Rnl_T_source"] = "Tmean⁴ (Tmax/Tmin unavailable)"

        rs_rso_ratio = min(1.0, max(0.0, Rs / Rso))
        cloudiness_term = max(0.05, min(1.0, 1.35 * rs_rso_ratio - 0.35))
        humidity_term = 0.34 - 0.14 * math.sqrt(max(0.0, ea))
        Rnl = _SIGMA * t4_avg * humidity_term * cloudiness_term
        Rnl = max(0.0, Rnl)
        details["Rnl_mj"] = round(Rnl, 3)
        details["rs_rso_ratio"] = round(rs_rso_ratio, 3)

        # ── Step 13: Net radiation Rn ────────────────────────────────────────
        Rn = Rns - Rnl
        details["Rn_mj"] = round(Rn, 3)
        details["G_mj"] = 0.0  # G = 0 for daily timestep (FAO-56 §4.2)

        # ── Step 14: ET0 (PM equation) ──────────────────────────────────────
        numerator = (
            0.408 * delta * (Rn - 0.0)
            + gamma * (900.0 / (tmean + 273.0)) * u2 * vpd
        )
        denominator = delta + gamma * (1.0 + 0.34 * u2)
        et0 = max(0.0, numerator / denominator)

        details["et0_mm"] = round(et0, 4)
        details["fallbacks"] = fallbacks

        return et0, details

    # ── ET0: Hargreaves-Samani (1985) — fallback ────────────────────────────
    @staticmethod
    def calculate_et0_hargreaves(
        temp_c: float,
        latitude: float,
        observation_date: Optional[datetime] = None,
        temp_min_c: Optional[float] = None,
        temp_max_c: Optional[float] = None,
    ) -> Tuple[float, float, str]:
        """
        Reference ET0 via Hargreaves-Samani (1985) (mm/day).

        Formula: ET0 = 0.0023 × Ra × (Tmean + 17.8) × √(Tmax − Tmin)

        Returns (et0, temp_range_used, temp_range_source).
        Used as fallback when PM humidity input is missing.
        """
        if observation_date is None:
            observation_date = datetime.utcnow()

        doy = _day_of_year(observation_date)
        Ra, _, _ = _ra_mj(latitude, doy)

        have_range = (
            temp_min_c is not None
            and temp_max_c is not None
            and temp_max_c > temp_min_c
        )
        if have_range:
            temp_range = temp_max_c - temp_min_c
            range_source = "measured"
        else:
            temp_range = 10.0
            range_source = "default (10 °C; no daily min/max in OWM snapshot)"

        et0 = 0.0023 * Ra * (temp_c + 17.8) * math.sqrt(temp_range)
        return max(0.0, et0), temp_range, range_source

    # ── ET0 dispatch (PM primary, Hargreaves fallback) ───────────────────────
    @staticmethod
    def _compute_et0(
        weather: WeatherLog,
        latitude: float,
    ) -> Tuple[float, str, Dict[str, Any]]:
        """
        Attempt Penman-Monteith ET0; fall back to Hargreaves if inputs are
        insufficient.

        PM requires temperature AND humidity.  All other inputs have defaults.

        Returns:
          (et0, method_label, method_details)
          method_label: "penman-monteith" | "hargreaves"
          method_details: dict of intermediate values for transparency log
        """
        temp_c = weather.temperature_c
        humidity = weather.humidity_pct

        # Resolve temp_min/max from column or raw payload (pre-migration rows)
        tmin = weather.temp_min_c
        tmax = weather.temp_max_c
        if (tmin is None or tmax is None) and weather.raw_payload_json:
            main = weather.raw_payload_json.get("main", {})
            tmin = tmin if tmin is not None else main.get("temp_min")
            tmax = tmax if tmax is not None else main.get("temp_max")

        if temp_c is not None and humidity is not None:
            et0, details = IrrigationService.calculate_et0_penman_monteith(
                temp_c=temp_c,
                latitude=latitude,
                observation_date=weather.observed_at,
                temp_min_c=tmin,
                temp_max_c=tmax,
                humidity_pct=humidity,
                wind_speed_mps=weather.wind_speed_mps,
                pressure_hpa=weather.pressure_hpa,
                cloud_pct=weather.cloud_pct,
            )
            return et0, "penman-monteith", details

        # Fallback: Hargreaves
        fallback_reason = []
        if temp_c is None:
            fallback_reason.append("temperature missing")
        if humidity is None:
            fallback_reason.append("humidity missing")

        _temp = temp_c if temp_c is not None else 20.0
        et0_hg, tr, tr_src = IrrigationService.calculate_et0_hargreaves(
            temp_c=_temp,
            latitude=latitude,
            observation_date=weather.observed_at,
            temp_min_c=tmin,
            temp_max_c=tmax,
        )
        hg_details = {
            "reason": f"Hargreaves fallback: {', '.join(fallback_reason)}",
            "temp_range": tr,
            "temp_range_source": tr_src,
            "tmean": round(_temp, 2),
        }
        return et0_hg, "hargreaves", hg_details

    # ── Main calculation pipeline ────────────────────────────────────────────
    @staticmethod
    def calculate_irrigation(
        db: Session,
        farm: Farm,
        weather: WeatherLog,
        crop: Optional[FarmCrop] = None,
    ) -> IrrigationRecommendation:
        """
        Full daily irrigation recommendation pipeline.

        Steps:
          1  Extract weather; apply fallbacks
          2  ET0 via PM (primary) or Hargreaves (fallback)
          3  Kc from crop config or default
          4  ETc = ET0 × Kc
          5  Effective rainfall (soil retention)
          6  Net irrigation requirement
          7  Gross irrigation (method efficiency)
          8  Total volume (farm area)
          9  Assemble recommendation + assumptions
          10 Persist
        """
        fallbacks_applied: List[str] = []

        # ── 1. Weather extraction ──────────────────────────────────────────
        temp_c = weather.temperature_c
        if temp_c is None:
            temp_c = 20.0
            fallbacks_applied.append(
                "Air temperature: missing — defaulted to 20 °C"
            )

        humidity_pct = weather.humidity_pct or 50.0
        if weather.humidity_pct is None:
            fallbacks_applied.append(
                "Relative humidity: missing — defaulted to 50%"
            )

        rainfall_mm = weather.rainfall_mm or 0.0

        # ── 2. ET0 ────────────────────────────────────────────────────────
        et0, et0_method, et0_details = IrrigationService._compute_et0(
            weather=weather,
            latitude=farm.latitude,
        )

        # Carry PM's internal fallbacks into the top-level list
        if et0_method == "penman-monteith":
            fallbacks_applied.extend(et0_details.get("fallbacks", []))
        else:
            fallbacks_applied.append(
                f"ET0 method fell back to Hargreaves: {et0_details.get('reason', 'unknown reason')}"
            )
            if et0_details.get("temp_range_source") == "default":
                fallbacks_applied.append(
                    "Daily temperature range: defaulted to 10 °C (no min/max in OWM snapshot)"
                )

        # ── 3. Kc ─────────────────────────────────────────────────────────
        if crop:
            kc, kc_source = crop_service.get_kc(
                crop_type=crop.crop_type,
                crop_stage=crop.crop_stage,
                override=crop.kc_value_override,
            )
            crop_label = crop.crop_type
            crop_stage_label = crop.crop_stage
        else:
            kc = IrrigationService.DEFAULT_KC
            kc_source = f"default (no crop configured; Kc = {IrrigationService.DEFAULT_KC})"
            crop_label = "Unknown"
            crop_stage_label = "Unknown"
            fallbacks_applied.append(
                f"Crop coefficient: defaulted to Kc = {kc} (no crop configured for this farm)"
            )

        # ── 4. ETc ────────────────────────────────────────────────────────
        etc = et0 * kc

        # ── 5. Effective rainfall ─────────────────────────────────────────
        soil_canonical = IrrigationService.normalize_soil_type(farm.soil_type or "")
        soil_factor = IrrigationService.get_soil_factor(farm.soil_type or "")
        if soil_canonical not in IrrigationService.SOIL_FACTORS:
            fallbacks_applied.append(
                f"Soil type '{farm.soil_type}' not recognised; "
                f"used default retention factor {IrrigationService.DEFAULT_SOIL_FACTOR}"
            )
        effective_rainfall = rainfall_mm * soil_factor

        # ── 6. Net irrigation ─────────────────────────────────────────────
        net_irrigation_mm = max(0.0, etc - effective_rainfall)

        # ── 7. Gross irrigation ───────────────────────────────────────────
        efficiency = IrrigationService.get_irrigation_efficiency(farm.irrigation_method)
        method_label = farm.irrigation_method or "unknown"
        if not farm.irrigation_method:
            fallbacks_applied.append(
                f"Irrigation method not set; "
                f"efficiency defaulted to {IrrigationService.DEFAULT_IRRIGATION_EFFICIENCY}"
            )
        gross_irrigation_mm = (
            net_irrigation_mm / efficiency if net_irrigation_mm > 0 else 0.0
        )

        # ── 8. Total volume ───────────────────────────────────────────────
        total_volume_m3: Optional[float] = None
        if farm.area_dunum and farm.area_dunum > 0:
            area_m2 = farm.area_dunum * 1000  # 1 dunum = 1000 m²
            total_volume_m3 = (gross_irrigation_mm / 1000.0) * area_m2

        # ── 9. Recommendation + assumptions ───────────────────────────────
        recommendation_text, assumptions = IrrigationService.generate_recommendation(
            et0=et0,
            kc=kc,
            etc=etc,
            effective_rainfall=effective_rainfall,
            net_irrigation_mm=net_irrigation_mm,
            gross_irrigation_mm=gross_irrigation_mm,
            temp_c=temp_c,
            soil_type=farm.soil_type or "Unknown",
            soil_factor=soil_factor,
            crop_type=crop_label,
            crop_stage=crop_stage_label,
            kc_source=kc_source,
            irrigation_method=method_label,
            efficiency=efficiency,
            total_volume_m3=total_volume_m3,
            area_dunum=farm.area_dunum,
            fallbacks_applied=fallbacks_applied,
            et0_method=et0_method,
            et0_details=et0_details,
        )

        # ── 10. Persist ───────────────────────────────────────────────────
        return IrrigationService.save_recommendation(
            db=db,
            farm_id=str(farm.id),
            weather_log_id=str(weather.id) if weather.id else None,
            et0=et0,
            kc=kc,
            etc=etc,
            effective_rainfall_mm=effective_rainfall,
            net_irrigation_mm=net_irrigation_mm,
            recommendation_text=recommendation_text,
            assumptions_json={
                "et0_method": et0_method,
                "assumptions": assumptions,
            },
        )

    # ── Recommendation text + assumptions log ───────────────────────────────
    @staticmethod
    def generate_recommendation(
        et0: float,
        kc: float,
        etc: float,
        effective_rainfall: float,
        net_irrigation_mm: float,
        gross_irrigation_mm: float,
        temp_c: float,
        soil_type: str,
        soil_factor: float,
        crop_type: str,
        crop_stage: str,
        kc_source: str,
        irrigation_method: str,
        efficiency: float,
        total_volume_m3: Optional[float],
        area_dunum: Optional[float],
        fallbacks_applied: List[str],
        et0_method: str,
        et0_details: Dict[str, Any],
    ) -> Tuple[str, List[str]]:
        """
        Build human-readable assumptions list and recommendation text.

        Returns (recommendation_text, assumptions_list).
        """
        assumptions: List[str] = []

        # ── ET0 section ──────────────────────────────────────────────────
        if et0_method == "penman-monteith":
            assumptions += [
                "ET₀ method: FAO-56 Penman-Monteith (primary)",
                f"  Tmean = {et0_details['tmean']:.1f} °C  [{et0_details['tmean_source']}]",
            ]
            if et0_details.get("tmax") is not None:
                assumptions.append(
                    f"  Tmax = {et0_details['tmax']:.1f} °C,  Tmin = {et0_details['tmin']:.1f} °C"
                )
            assumptions += [
                f"  Humidity = {et0_details['rh_pct']:.1f}%  →  "
                f"es = {et0_details['es_kpa']:.3f} kPa  [{et0_details['es_source']}]",
                f"  ea = {et0_details['ea_kpa']:.3f} kPa  [{et0_details['ea_source']}]",
                f"  VPD = {et0_details['vpd_kpa']:.3f} kPa",
                f"  Δ = {et0_details['delta_kpa_per_c']:.4f} kPa/°C  |  "
                f"γ = {et0_details['gamma_kpa_per_c']:.4f} kPa/°C  "
                f"[P = {et0_details['pressure_kpa']:.1f} kPa,  {et0_details['pressure_source']}]",
                f"  u₂ = {et0_details['u2_mps']:.2f} m/s  [{et0_details['wind_source']}]",
                f"  Ra = {et0_details['Ra_mj']:.2f}  |  "
                f"Rs = {et0_details['Rs_mj']:.2f}  |  "
                f"Rso = {et0_details['Rso_mj']:.2f}  |  "
                f"Rn = {et0_details['Rn_mj']:.2f}  MJ m⁻² day⁻¹",
                f"  Cloud = {et0_details['cloud_pct']}%  →  "
                f"sunshine fraction = {et0_details['sunshine_frac']:.2f}  "
                f"[{et0_details['sunshine_frac_source']}]",
                f"  G = {et0_details['G_mj']:.1f} MJ m⁻² day⁻¹  (zero for daily timestep)",
                f"ET₀ = {et0:.2f} mm/day  (Penman-Monteith)",
            ]
        else:  # hargreaves fallback
            tr = et0_details.get("temp_range", 10.0)
            tr_src = et0_details.get("temp_range_source", "default")
            assumptions += [
                "ET₀ method: Hargreaves-Samani (1985) — fallback",
                f"  Reason: {et0_details.get('reason', 'insufficient PM inputs')}",
                f"  Tmean = {et0_details['tmean']:.1f} °C",
                f"  Temperature range = {tr:.1f} °C  [{tr_src}]",
                f"ET₀ = {et0:.2f} mm/day  (Hargreaves)",
            ]

        # ── Crop / Kc section ────────────────────────────────────────────
        assumptions += [
            f"Crop: {crop_type},  stage: {crop_stage}",
            f"Kc = {kc:.2f}  [{kc_source}]",
            f"ETc = ET₀ × Kc = {et0:.2f} × {kc:.2f} = {etc:.2f} mm/day",
        ]

        # ── Rainfall / soil section ──────────────────────────────────────
        raw_rain = (
            effective_rainfall / soil_factor
            if soil_factor > 0 else 0.0
        )
        assumptions += [
            f"Soil: {soil_type}  (retention factor {soil_factor:.2f})",
            f"Effective rainfall = {raw_rain:.2f} mm raw × {soil_factor:.2f} = {effective_rainfall:.2f} mm",
            f"Net irrigation requirement = {net_irrigation_mm:.2f} mm/day",
        ]

        # ── Efficiency / gross ───────────────────────────────────────────
        assumptions += [
            f"Irrigation method: {irrigation_method}  "
            f"(application efficiency {efficiency:.0%})",
            f"Gross application needed = {gross_irrigation_mm:.2f} mm/day  "
            f"[net / efficiency]",
        ]

        # ── Volume ───────────────────────────────────────────────────────
        if total_volume_m3 is not None and area_dunum:
            assumptions.append(
                f"Total volume for {area_dunum:.1f} dunum "
                f"({area_dunum * 1000:.0f} m²): "
                f"{total_volume_m3:.1f} m³  "
                f"({total_volume_m3 * 1000:.0f} litres)"
            )

        # ── Fallbacks ────────────────────────────────────────────────────
        if fallbacks_applied:
            assumptions.append("Fallbacks / assumptions applied:")
            assumptions.extend(f"  • {f}" for f in fallbacks_applied)

        # ── Recommendation text ──────────────────────────────────────────
        vol_str = ""
        if total_volume_m3 is not None:
            vol_str = (
                f" ({total_volume_m3:.1f} m³ total "
                f"for your {area_dunum:.1f}-dunum farm)"
            )

        method_tag = "PM" if et0_method == "penman-monteith" else "Hargreaves"

        if net_irrigation_mm < 1.0:
            recommendation_text = (
                f"No irrigation needed today. "
                f"ET₀ {et0:.2f} mm/day [{method_tag}], ETc {etc:.2f} mm/day — "
                f"covered by rainfall and/or low evaporative demand. "
                f"Monitor soil moisture if dry conditions persist."
            )
        elif net_irrigation_mm < 3.0:
            recommendation_text = (
                f"Light irrigation recommended: apply {gross_irrigation_mm:.1f} mm gross "
                f"({net_irrigation_mm:.1f} mm net){vol_str}. "
                f"Temp {temp_c:.1f} °C, ETc {etc:.2f} mm/day [{method_tag}]. "
                f"Minimal water-stress risk for {crop_type}."
            )
        elif net_irrigation_mm < 6.0:
            recommendation_text = (
                f"Moderate irrigation recommended: apply {gross_irrigation_mm:.1f} mm gross "
                f"({net_irrigation_mm:.1f} mm net){vol_str}. "
                f"Temp {temp_c:.1f} °C, ETc {etc:.2f} mm/day [{method_tag}]. "
                f"Regular watering will maintain optimal {crop_type} growth."
            )
        else:
            recommendation_text = (
                f"High irrigation needed: apply {gross_irrigation_mm:.1f} mm gross "
                f"({net_irrigation_mm:.1f} mm net){vol_str}. "
                f"High evapotranspiration (ETc {etc:.2f} mm/day [{method_tag}]) "
                f"at {temp_c:.1f} °C. Ensure adequate water supply for {crop_type}."
            )

        return recommendation_text, assumptions

    # ── Crop Kc (kept for backward compatibility) ───────────────────────────
    @staticmethod
    def get_crop_kc(
        crop_type: str,
        crop_stage: str,
        override: Optional[float] = None,
    ) -> float:
        kc, _ = crop_service.get_kc(crop_type, crop_stage, override)
        return kc

    # ── Persistence ─────────────────────────────────────────────────────────
    @staticmethod
    def save_recommendation(
        db: Session,
        farm_id: str,
        weather_log_id: Optional[str],
        et0: float,
        kc: float,
        etc: float,
        effective_rainfall_mm: float,
        net_irrigation_mm: float,
        recommendation_text: str,
        assumptions_json: Dict[str, Any],
    ) -> IrrigationRecommendation:
        """Persist recommendation record."""
        try:
            farm_uuid = uuid.UUID(farm_id)
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid farm ID format",
            )

        weather_log_uuid = None
        if weather_log_id:
            try:
                weather_log_uuid = uuid.UUID(weather_log_id)
            except (ValueError, AttributeError):
                pass

        rec = IrrigationRecommendation(
            farm_id=farm_uuid,
            weather_log_id=weather_log_uuid,
            et0=et0,
            kc=kc,
            etc=etc,
            effective_rainfall_mm=effective_rainfall_mm,
            net_irrigation_mm=net_irrigation_mm,
            recommendation_text=recommendation_text,
            assumptions_json=assumptions_json,
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)
        return rec

    # ── History ──────────────────────────────────────────────────────────────
    @staticmethod
    def get_irrigation_history(
        db: Session, farm_id: str, limit: int = 100
    ) -> List[IrrigationRecommendation]:
        """Return irrigation recommendations for a farm, most-recent first."""
        try:
            farm_uuid = uuid.UUID(farm_id)
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid farm ID format",
            )
        return (
            db.query(IrrigationRecommendation)
            .filter(IrrigationRecommendation.farm_id == farm_uuid)
            .order_by(IrrigationRecommendation.created_at.desc())
            .limit(limit)
            .all()
        )
