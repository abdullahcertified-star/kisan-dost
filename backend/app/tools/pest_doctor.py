"""Pest & Disease Doctor Tool.
Identifies crop diseases and pests with verified safe pesticide dosages.
"""
from backend.app.models.schemas import PestDoctorRequest, PestTreatmentPlan
from backend.app.data.datasets import PEST_DISEASE_DB
from backend.app.guardrails.safety_guardrails import SafetyGuardrail


def run_pest_doctor(req: PestDoctorRequest) -> PestTreatmentPlan:
    symptom_text = req.symptoms.lower()
    crop_text = (req.crop or "").lower()
    acres = req.acres or 5.0

    best_match = None
    max_score = 0

    for record in PEST_DISEASE_DB:
        score = 0
        # Check crop match
        if any(c in crop_text for c in record["target_crops"]):
            score += 2

        # Check symptom keywords match
        for kw in record["symptoms"]:
            for word in kw.split():
                if len(word) > 3 and word in symptom_text:
                    score += 1

        if score > max_score:
            max_score = score
            best_match = record

    if not best_match:
        # Default to Whitefly if cotton or generic pest
        best_match = PEST_DISEASE_DB[0]

    safe_dosage = best_match["safe_dosage_ml_per_acre"]
    is_safe, capped_dosage, warning = SafetyGuardrail.validate_pesticide_dosage(
        best_match["id"], safe_dosage
    )

    total_chemical = capped_dosage * acres

    return PestTreatmentPlan(
        pest_or_disease=best_match["pest_name"],
        identified_crop=req.crop.title() if req.crop else "Field Crop",
        matched_symptoms=best_match["symptoms"][:3],
        chemical_treatment=best_match["chemical_treatment"],
        safe_dosage_ml_per_acre=capped_dosage,
        max_safe_limit_ml_per_acre=best_match.get("max_safe_dosage_ml_per_acre", 300.0),
        water_liters_per_acre=best_match["water_volume_liters_per_acre"],
        total_chemical_needed_ml=round(total_chemical, 1),
        organic_alternative=best_match["organic_treatment"],
        safety_warning=best_match["safety_instructions"],
        phi_days=14,
    )
