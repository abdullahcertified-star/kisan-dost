"""Safety Guardrails for Pesticide & Chemical Dosages.
Protects farmers and soil from toxic chemical overdoses.
"""
from typing import Tuple, Dict


# Threshold maximum safe dosage in ml (or grams) per acre
MAX_SAFE_LIMITS: Dict[str, float] = {
    "whitefly": 300.0,
    "diafenthiuron": 300.0,
    "pyriproxyfen": 300.0,
    "pink_bollworm": 80.0,
    "chlorantraniliprole": 80.0,
    "spinetoram": 80.0,
    "wheat_rust": 250.0,
    "tebuconazole": 250.0,
    "propiconazole": 250.0,
    "rice_blast": 150.0,
    "tricyclazole": 150.0,
    "aphid": 80.0,
    "imidacloprid": 80.0,
    "flonicamid": 80.0,
    "default": 400.0,
}


class SafetyGuardrail:
    @staticmethod
    def validate_pesticide_dosage(pest_or_chemical: str, proposed_dosage_ml: float) -> Tuple[bool, float, str]:
        """
        Validates proposed chemical dosage per acre.
        Returns:
            (is_safe: bool, safe_dosage: float, warning_message: str)
        """
        key = pest_or_chemical.strip().lower()
        limit = MAX_SAFE_LIMITS.get("default", 400.0)

        for name, threshold in MAX_SAFE_LIMITS.items():
            if name in key:
                limit = threshold
                break

        if proposed_dosage_ml > limit:
            warning = (
                f"🚨 **DANGER OVERDOSE BLOCKED**: Requested dosage ({proposed_dosage_ml:.1f} ml/acre) "
                f"exceeds the government and manufacturer safety threshold of {limit:.1f} ml/acre! "
                "Overdosing causes severe crop scorch (patton ka jalna), chemical residues, and groundwater toxicity. "
                f"Dosage has been strictly capped to the verified safe limit of {limit:.1f} ml/acre in 100-120 liters of water."
            )
            return False, limit, warning

        return True, proposed_dosage_ml, "Dosage is within safe agronomic thresholds."
