"""
Crop configuration service.

Provides the canonical crop type / stage → Kc coefficient table and
lookup helpers used by the irrigation engine.  All crop types and stages
are stored with UPPERCASE canonical keys internally; the normalisation
functions accept any reasonable user input (title-case, hyphenated, etc.).
"""

from typing import Optional, Tuple

# ── Canonical values exposed to the rest of the app ────────────────────────
SUPPORTED_CROPS = ["WHEAT", "TOMATO", "POTATO", "OLIVE", "MAIZE"]
SUPPORTED_STAGES = ["INITIAL", "DEVELOPMENT", "MID", "LATE"]

# FAO-56 Kc table aligned with the HASAD specification
KC_TABLE: dict[str, dict[str, float]] = {
    "WHEAT":  {"INITIAL": 0.35, "DEVELOPMENT": 0.75, "MID": 1.15, "LATE": 0.25},
    "TOMATO": {"INITIAL": 0.60, "DEVELOPMENT": 0.95, "MID": 1.15, "LATE": 0.80},
    "POTATO": {"INITIAL": 0.50, "DEVELOPMENT": 0.85, "MID": 1.10, "LATE": 0.75},
    "OLIVE":  {"INITIAL": 0.65, "DEVELOPMENT": 0.70, "MID": 0.70, "LATE": 0.65},
    "MAIZE":  {"INITIAL": 0.40, "DEVELOPMENT": 0.80, "MID": 1.20, "LATE": 0.60},
}

DEFAULT_KC = 0.70

# Alternate names → canonical stage key
_STAGE_ALIASES: dict[str, str] = {
    "initial":     "INITIAL",
    "dev":         "DEVELOPMENT",
    "development": "DEVELOPMENT",
    "mid":         "MID",
    "mid-season":  "MID",
    "midseason":   "MID",
    "mid season":  "MID",
    "late":        "LATE",
    "late-season": "LATE",
    "lateseason":  "LATE",
    "late season": "LATE",
}


# ── Normalisation ────────────────────────────────────────────────────────────

def normalize_crop_type(crop_type: str) -> str:
    """Return the canonical (uppercase) crop type key."""
    return crop_type.strip().upper()


def normalize_crop_stage(crop_stage: str) -> str:
    """
    Return the canonical (uppercase) stage key.

    Accepts: "INITIAL", "Initial", "initial", "mid-season", "Mid-season",
    "Development", "late season", etc.
    """
    upper = crop_stage.strip().upper()
    if upper in SUPPORTED_STAGES:
        return upper
    lower = crop_stage.strip().lower()
    return _STAGE_ALIASES.get(lower, upper)  # fallback: return as-is


# ── Kc derivation ────────────────────────────────────────────────────────────

def derive_kc(crop_type: str, crop_stage: str) -> Tuple[float, str]:
    """
    Derive Kc from crop type and stage using the internal KC_TABLE.

    Returns (kc, source_label).
    If the combination is not found, returns (DEFAULT_KC, "default").
    """
    ct = normalize_crop_type(crop_type)
    cs = normalize_crop_stage(crop_stage)
    if ct in KC_TABLE and cs in KC_TABLE[ct]:
        kc = KC_TABLE[ct][cs]
        return kc, f"FAO-56 table ({ct}/{cs})"
    return DEFAULT_KC, f"default (crop '{crop_type}' or stage '{crop_stage}' not in table; Kc = {DEFAULT_KC})"


def get_kc(
    crop_type: str,
    crop_stage: str,
    override: Optional[float] = None,
) -> Tuple[float, str]:
    """
    Return (kc, source_label) for a crop configuration.

    Priority:
      1. kc_value_override if set and > 0
      2. KC_TABLE lookup via derive_kc
    """
    if override is not None and override > 0:
        return float(override), "user override"
    return derive_kc(crop_type, crop_stage)
