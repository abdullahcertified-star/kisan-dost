"""Pest & Disease Knowledge Base Service.
Grounds diagnosis in verified Pakistani agronomic data from PARC, NARC, and Punjab Agri Dept.
"""
import json
import os
import re
from typing import List, Dict, Any, Optional, Tuple
from backend.app.models.schemas import (
    PestDiagnosisRequest,
    PestDiagnosis,
    VerifiedTreatment,
    AlternativeDiagnosis,
)


class PestService:
    def __init__(self):
        self._database: List[Dict[str, Any]] = []
        self._load_database()

    def _load_database(self):
        db_path = os.path.join(os.path.dirname(__file__), "..", "data", "pest_database.json")
        try:
            with open(db_path, "r", encoding="utf-8") as f:
                self._database = json.load(f)
        except Exception as e:
            print(f"[PestService] Error loading pest_database.json: {e}")
            self._database = []

    def get_all_pests(self, crop: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns all pest/disease records, optionally filtered by crop."""
        if not crop or crop.lower() in ["all", "all crops", "تمام"]:
            return self._database

        c_lower = crop.strip().lower()
        return [
            item for item in self._database
            if c_lower in item.get("crop", "").lower()
            or any(c_lower in tc.lower() for tc in item.get("target_crops", []))
        ]

    def find_match(self, crop: Optional[str], symptoms: str) -> Tuple[Optional[Dict[str, Any]], str, List[Dict[str, Any]]]:
        """
        Matches farmer symptoms against verified knowledge base.
        Returns:
            (best_record, confidence: "High" | "Moderate" | "Tentative / Low", alternatives)
        """
        if not self._database:
            return None, "Tentative / Low", []

        symptom_lower = symptoms.strip().lower()
        crop_lower = (crop or "").strip().lower()

        # Tokenize symptom query
        words = re.findall(r'\b\w{3,}\b', symptom_lower)
        scored_records = []

        for record in self._database:
            score = 0
            # Crop match weight
            crop_matched = False
            if crop_lower:
                if crop_lower in record.get("crop", "").lower() or any(crop_lower in tc.lower() for tc in record.get("target_crops", [])):
                    score += 4
                    crop_matched = True

            # Symptom keywords matching
            db_symptoms_text = " ".join(record.get("symptoms", []) + record.get("symptoms_ur", [])).lower()
            name_text = (record.get("pest_name", "") + " " + record.get("pest_name_ur", "")).lower()

            # Exact phrase match in symptoms or name
            if any(term in symptom_lower for term in [record["id"], record.get("pest_name_ur", "").lower()]):
                score += 8

            matched_keywords = 0
            for w in words:
                if w in db_symptoms_text or w in name_text:
                    score += 2
                    matched_keywords += 1

            if score > 0:
                scored_records.append((score, matched_keywords, crop_matched, record))

        # Sort by total score descending
        scored_records.sort(key=lambda x: (x[0], x[1]), reverse=True)

        if not scored_records:
            # Fallback to general crop record if available
            fallback = next((r for r in self._database if crop_lower in r.get("crop", "").lower()), self._database[0])
            return fallback, "Tentative / Low", []

        best_score, best_kw, crop_matched, best_record = scored_records[0]

        # Determine qualitative confidence
        if best_score >= 8 or (best_kw >= 3 and crop_matched):
            confidence = "High"
        elif best_score >= 4 or best_kw >= 2:
            confidence = "Moderate"
        else:
            confidence = "Tentative / Low"

        # Extract alternative possibilities (next top records)
        alternatives = []
        for s, kw, cm, rec in scored_records[1:4]:
            alternatives.append(rec)

        return best_record, confidence, alternatives

    def build_deterministic_diagnosis(
        self,
        req: PestDiagnosisRequest,
        best_record: Dict[str, Any],
        confidence: str,
        alternative_records: List[Dict[str, Any]],
    ) -> PestDiagnosis:
        """Constructs a deterministic PestDiagnosis grounded in verified data."""
        # Treatment mapping
        vt_data = best_record.get("verified_treatment")
        verified_tx = None
        if vt_data:
            verified_tx = VerifiedTreatment(
                active_ingredient=vt_data.get("active_ingredient", "Refer to registered label"),
                trade_names=vt_data.get("trade_names", []),
                has_verified_dosage=vt_data.get("has_verified_dosage", True),
                safe_dosage_per_acre=vt_data.get("safe_dosage_per_acre"),
                dosage_numeric_ml_per_acre=vt_data.get("dosage_numeric_ml_per_acre"),
                water_volume_liters_per_acre=vt_data.get("water_volume_liters_per_acre", 100),
                spray_timing=vt_data.get("spray_timing", "Early morning or late afternoon"),
                application_instructions=vt_data.get("application_instructions", "Follow registered label instructions"),
                source=vt_data.get("source", "Punjab Agriculture Department & PARC"),
            )

        # Alternative possibilities
        alt_list: List[AlternativeDiagnosis] = []
        for alt in alternative_records:
            distinguishing = f"Typically exhibits {alt.get('symptoms', ['distinct symptoms'])[0].lower()}."
            alt_list.append(
                AlternativeDiagnosis(
                    pest_name=alt.get("pest_name", "Alternative Problem"),
                    pest_name_ur=alt.get("pest_name_ur", "دیگر مسئلہ"),
                    scientific_name=alt.get("scientific_name"),
                    likelihood="Moderate" if confidence == "High" else "Tentative",
                    distinguishing_feature=distinguishing,
                )
            )

        # Symptom analysis narrative
        matched_symptom_str = ", ".join(best_record.get("symptoms", [])[:3])
        symptom_analysis = (
            f"Based on reported symptoms '{req.symptoms}', the diagnostic indicators strongly correspond to "
            f"{best_record.get('pest_name')} ({best_record.get('scientific_name')}). "
            f"Key matching field indicators include: {matched_symptom_str}."
        )

        return PestDiagnosis(
            crop=req.crop or best_record.get("crop", "Field Crop"),
            primary_diagnosis=best_record.get("pest_name", "Unknown Problem"),
            primary_diagnosis_ur=best_record.get("pest_name_ur", ""),
            scientific_name=best_record.get("scientific_name", "Unspecified"),
            category=best_record.get("category", "Agricultural Pest/Disease"),
            confidence=confidence,
            symptom_analysis=symptom_analysis,
            risk_factors=best_record.get("risk_factors", []),
            alternative_possibilities=alt_list,
            non_chemical_management=best_record.get("non_chemical_management", []),
            verified_treatment=verified_tx,
            dosage_disclaimer=(
                "Exact chemical dosage must strictly be verified from the locally registered container label "
                "or prescribed by your local Agriculture Extension Officer (محکمہ زراعت). Never guess dosages."
            ),
            safety_notes=best_record.get("safety_notes", []),
            phi_days=best_record.get("phi_days", 14),
            is_medical_query_rejected=False,
            source=best_record.get("verified_treatment", {}).get("source", "Pakistan Agricultural Research Council (PARC)"),
            image_supported=True,
        )


pest_service = PestService()
