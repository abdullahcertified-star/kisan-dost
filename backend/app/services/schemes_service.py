"""Government Schemes Service.
Provides filtering by province, district, and crop, with fallback handling and source attribution.
"""
from typing import List, Dict, Any, Optional
from backend.app.data.schemes_db import GOVERNMENT_SCHEMES


class SchemesService:
    @staticmethod
    def get_schemes(
        province: Optional[str] = None,
        district: Optional[str] = None,
        crop: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Filter government support schemes by province, district, and crop.
        Falls back gracefully with federal reference programs if no specific provincial
        or crop-specific scheme is matched.
        """
        matched = []
        prov_clean = (province or "").strip().lower()
        dist_clean = (district or "").strip().lower()
        crop_clean = (crop or "").strip().lower()

        for s in GOVERNMENT_SCHEMES:
            # 1. Check province match (or 'All' federal schemes)
            s_prov = s["province"].lower()
            prov_match = (
                not prov_clean
                or s_prov == "all"
                or prov_clean == "all"
                or s_prov in prov_clean
                or prov_clean in s_prov
            )

            # 2. Check district match
            s_districts = [d.lower() for d in s.get("districts", ["all"])]
            dist_match = (
                not dist_clean
                or "all" in s_districts
                or dist_clean in s_districts
            )

            # 3. Check crop match
            s_crops = [c.lower() for c in s.get("applicable_crops", [])]
            crop_match = (
                not crop_clean
                or any(crop_clean in c for c in s_crops)
            )

            if prov_match and dist_match and crop_match:
                matched.append(s)

        # Missing data / No exact match fallback:
        # If no schemes matched the specific filter combination, return general national schemes
        # and clearly inform the user that localized data is unavailable and marked as reference.
        fallback_used = False
        message = ""
        if not matched:
            fallback_used = True
            for s in GOVERNMENT_SCHEMES:
                if s["province"].lower() == "all":
                    matched.append(s)
            message = (
                f"No specific local schemes found matching province='{province or 'Any'}', "
                f"district='{district or 'Any'}', crop='{crop or 'Any'}'. "
                "Displaying nationwide reference support programs and financing options."
            )
        else:
            filters_applied = []
            if province:
                filters_applied.append(f"Province: {province}")
            if district:
                filters_applied.append(f"District: {district}")
            if crop:
                filters_applied.append(f"Crop: {crop}")
            filter_str = " | ".join(filters_applied) if filters_applied else "All active programs"
            message = f"Found {len(matched)} matching verified government support schemes ({filter_str})."

        return {
            "total_count": len(matched),
            "filters": {
                "province": province,
                "district": district,
                "crop": crop,
            },
            "fallback_used": fallback_used,
            "message": message,
            "schemes": matched,
            "source_disclaimer": "All schemes are grounded in official government gazettes and extension departments. Information is provided for reference and subject to official quota cycles."
        }
