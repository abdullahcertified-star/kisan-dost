"""Output Safety Validator for Pest & Disease Doctor.
Ensures zero invented pesticide dosages, enforces label disclaimers,
blocks human medical content, and injects worker and pollinator safety guidelines.
"""
from typing import Optional, Dict, Any, List
from backend.app.guardrails.safety_guardrails import SafetyGuardrail, MAX_SAFE_LIMITS
from backend.app.models.schemas import PestDiagnosis, VerifiedTreatment


LABEL_DISCLAIMER_TEXT = (
    "Exact dosage must strictly be taken from the locally registered product container label "
    "or prescribed by a qualified agricultural extension officer (محکمہ زراعت توسیع). "
    "Never apply unverified chemical mixtures or exceed registered application rates."
)


class OutputSafetyValidator:
    """Validates and enforces agricultural safety on Pest Diagnosis payloads."""

    @staticmethod
    def validate_diagnosis(diagnosis: PestDiagnosis, raw_user_symptoms: str = "") -> PestDiagnosis:
        """
        Runs comprehensive post-generation safety checks on the diagnosis.
        Mutates/sanitizes diagnosis payload if safety violations are detected.
        """
        # 1. Check if user inquiry was human-medical
        if diagnosis.is_medical_query_rejected:
            # Strip all chemical recommendations
            diagnosis.verified_treatment = None
            diagnosis.dosage_disclaimer = "Kisan Dost is an agricultural assistant only and does not provide human medical advice."
            return diagnosis

        # 2. Check chemical treatment validity and dosage enforcement
        if diagnosis.verified_treatment:
            treatment = diagnosis.verified_treatment
            ingredient_lower = treatment.active_ingredient.lower()
            
            # If dosage is marked unverified, enforce label disclaimer
            if not treatment.has_verified_dosage or not treatment.safe_dosage_per_acre:
                treatment.safe_dosage_per_acre = "Refer to registered bottle label"
                treatment.dosage_numeric_ml_per_acre = None
                treatment.has_verified_dosage = False
                diagnosis.dosage_disclaimer = LABEL_DISCLAIMER_TEXT

            # If numeric dosage is present, validate against safety guardrail threshold
            elif treatment.dosage_numeric_ml_per_acre is not None:
                is_safe, capped_val, warning = SafetyGuardrail.validate_pesticide_dosage(
                    ingredient_lower, treatment.dosage_numeric_ml_per_acre
                )
                if not is_safe:
                    treatment.dosage_numeric_ml_per_acre = capped_val
                    treatment.safe_dosage_per_acre = f"{capped_val:.1f} ml/acre (Capped to maximum legal safety limit)"
                    if warning not in diagnosis.safety_notes:
                        diagnosis.safety_notes.insert(0, warning)

        # 3. Always enforce mandatory label disclaimer
        if not diagnosis.dosage_disclaimer or diagnosis.dosage_disclaimer.strip() == "":
            diagnosis.dosage_disclaimer = LABEL_DISCLAIMER_TEXT

        # 4. Enforce mandatory worker protection and pollinator safety notes
        mandatory_ppe = (
            "Safety Gear: Always wear long sleeves, chemical-resistant gloves, protective eye goggles, "
            "and a face mask when handling and spraying crop protection chemicals."
        )
        mandatory_bees = (
            "Pollinator Protection: Avoid spraying during peak daylight hours when honeybees and natural beneficial "
            "predators are active. Spray in calm early morning or late afternoon."
        )

        has_ppe = any("gloves" in note.lower() or "ppe" in note.lower() or "mask" in note.lower() for note in diagnosis.safety_notes)
        if not has_ppe:
            diagnosis.safety_notes.append(mandatory_ppe)

        has_bees = any("bee" in note.lower() or "pollinator" in note.lower() or "morning" in note.lower() for note in diagnosis.safety_notes)
        if not has_bees:
            diagnosis.safety_notes.append(mandatory_bees)

        return diagnosis
