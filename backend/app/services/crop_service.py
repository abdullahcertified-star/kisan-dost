"""Deterministic Pakistani Crop Suitability Service.
Evaluates candidate crops against agro-ecological rules based on district, province,
season, soil type, water availability, and land size.
Calculates transparent 0-100 scores without LLM hallucination.
"""
import json
import os
from pathlib import Path
from typing import List, Dict, Any, Optional

from backend.app.models.schemas import (
    CropRecommendationRequest,
    CropRecommendation,
    CropPlan,
)

CROPS_DB_PATH = Path(__file__).resolve().parent.parent / "data" / "crops_db.json"


class CropService:
    _crops_cache: Optional[List[Dict[str, Any]]] = None

    @classmethod
    def load_crops(cls) -> List[Dict[str, Any]]:
        """Load the structured Pakistani crop database from JSON file."""
        if cls._crops_cache is None:
            if not CROPS_DB_PATH.exists():
                raise FileNotFoundError(f"Crop knowledge base not found at: {CROPS_DB_PATH}")
            with open(CROPS_DB_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                cls._crops_cache = data.get("crops", [])
        return cls._crops_cache

    @classmethod
    def recommend_crops(cls, req: CropRecommendationRequest) -> CropPlan:
        """
        Deterministic, rule-based crop suitability evaluator.
        Scores candidate crops on:
        1. Season Matching (25 pts)
        2. Water Availability Fit (30 pts)
        3. Soil Compatibility (20 pts)
        4. Agro-ecological / Province Zone (15 pts)
        5. Economic Margins & Resilience (10 pts)
        """
        crops = cls.load_crops()

        district_clean = req.district.strip().title()
        province_clean = (req.province or "Punjab").strip().title()
        season_clean = req.season.strip().capitalize()
        soil_clean = req.soil_type.strip().lower()
        water_clean = req.water_availability.strip().lower()
        acres = max(0.5, round(req.land_acres, 1))

        # Detect water availability category
        is_rainfed = any(w in water_clean for w in ["rainfed", "rain-fed", "rain fed", "barani", "بارانی"])
        is_limited_water = is_rainfed or any(w in water_clean for w in ["limited", "kam", "shortage", "scarce", "کم پانی", "محدود"])
        is_abundant_water = any(w in water_clean for w in ["abundant", "zyada", "excess", "plenty", "high", "وافر"])

        candidates: List[CropRecommendation] = []

        for crop in crops:
            crop_name = crop["crop_name"]
            crop_name_urdu = crop["crop_name_urdu"]
            crop_season = crop["season"]
            water_req = crop["water_requirement"]
            ideal_soils = crop["suitable_soil_types"]
            provinces = crop["suitable_provinces"]
            econ = crop["economic_factors"]
            irrigation_info = crop.get("irrigation_characteristics", {})

            reasons: List[str] = []
            risks: List[str] = []

            # -------------------------------------------------------------
            # Rule 1: Season Filter & Scoring (Max 25 pts)
            # -------------------------------------------------------------
            season_score = 0.0
            season_clean_lower = season_clean.lower()
            crop_seasons = [s.lower() for s in crop.get("seasons", [])]
            crop_season_lower = crop_season.lower()

            is_req_summer = any(s in season_clean_lower for s in ["summer", "kharif", "گرمی", "گرمیاں", "خریف"])
            is_req_winter = any(s in season_clean_lower for s in ["winter", "rabi", "سردی", "سردیاں", "ربیع"])
            is_req_spring = any(s in season_clean_lower for s in ["spring", "بہار", "zaid rabi", "zaid_rabi"])
            is_req_autumn = any(s in season_clean_lower for s in ["autumn", "fall", "خزاں", "zaid kharif", "zaid_kharif"])

            is_crop_summer = "summer" in crop_season_lower or "kharif" in crop_season_lower or "summer" in crop_seasons or "kharif" in crop_seasons
            is_crop_winter = "winter" in crop_season_lower or "rabi" in crop_season_lower or "winter" in crop_seasons or "rabi" in crop_seasons
            is_crop_spring = "spring" in crop_season_lower or "spring" in crop_seasons
            is_crop_autumn = "autumn" in crop_season_lower or "autumn" in crop_seasons

            season_match = False
            if is_req_summer and is_crop_summer:
                season_match = True
            elif is_req_winter and is_crop_winter:
                season_match = True
            elif is_req_spring and is_crop_spring:
                season_match = True
            elif is_req_autumn and is_crop_autumn:
                season_match = True
            elif (
                season_clean_lower in crop_season_lower
                or crop_season_lower in season_clean_lower
                or any(season_clean_lower in s for s in crop_seasons)
                or "annual" in crop_season_lower
            ):
                season_match = True

            if season_match:
                season_score = 25.0
                reasons.append(f"Ideal seasonal window: {crop['sowing_window']} ({crop_season} season).")
            else:
                # Season mismatch disqualifies crop for active recommendation
                continue

            # -------------------------------------------------------------
            # Rule 2: Water Availability Fit (Max 30 pts)
            # -------------------------------------------------------------
            water_score = 0.0
            req_lower = water_req.lower()

            if is_rainfed:
                if "low" in req_lower:
                    water_score = 30.0
                    reasons.append(
                        f"Superb adaptation to rain-fed (barani) moisture regimes ({crop['irrigation_count']})."
                    )
                elif "medium" in req_lower:
                    water_score = 14.0
                    reasons.append("Can be grown under rain-fed conditions if certified drought-tolerant barani varieties are sown.")
                    risks.append("High vulnerability to drought if seasonal monsoon rains are delayed or insufficient.")
                else:
                    # High / Very High strictly disqualified under rainfed
                    water_score = 0.0
                    risks.append(f"Disqualified for rain-fed conditions: requires regular irrigation ({crop['irrigation_count']}).")
            elif is_limited_water:
                if "low" in req_lower:
                    water_score = 30.0
                    reasons.append(
                        f"Highly drought-resilient ({crop['irrigation_count']}). Thrives under limited water supply."
                    )
                elif "medium" in req_lower:
                    water_score = 18.0
                    reasons.append(f"Manageable under limited water if critical stages are prioritized ({crop['irrigation_count']}).")
                    risks.append("Water stress risk during grain formation / flowering stage if fewer than 3 irrigations are available.")
                elif "high" in req_lower:
                    water_score = 6.0
                    risks.append(f"Severe water stress alert: requires {crop['irrigation_count']}. High probability of stunted yield under limited water.")
                elif "very high" in req_lower:
                    water_score = 0.0
                    risks.append(f"Disqualified for limited water: Requires standing water ({crop['irrigation_count']}).")
            elif is_abundant_water:
                if "very high" in req_lower or "high" in req_lower:
                    water_score = 30.0
                    reasons.append("Maximizes high water availability with heavy vegetative biomass and grain yield.")
                elif "medium" in req_lower:
                    water_score = 28.0
                    reasons.append("Regular irrigation schedule guarantees optimal yield.")
                else:
                    water_score = 18.0
                    risks.append("Excessive moisture / standing water may promote root fungal rot in low-water crops.")
            else:
                # Normal / Adequate water
                if "medium" in req_lower:
                    water_score = 28.0
                    reasons.append(f"Matches standard canal and tubewell rotations ({crop['irrigation_count']}).")
                elif "low" in req_lower:
                    water_score = 26.0
                    reasons.append(f"Conserves water ({crop['irrigation_count']}) with lower pumping costs.")
                elif "high" in req_lower:
                    water_score = 25.0
                    reasons.append(f"Sustainable under scheduled canal plus tubewell irrigations ({crop['irrigation_count']}).")
                else:
                    water_score = 20.0

            # -------------------------------------------------------------
            # Rule 3: Soil Compatibility (Max 20 pts)
            # -------------------------------------------------------------
            soil_score = 0.0
            # Handle variations like "loamy", "loam", "sandy", "clay"
            is_loamy = "loam" in soil_clean or "loamy" in soil_clean or "mera" in soil_clean
            is_sandy = "sand" in soil_clean or "sandy" in soil_clean or "reet" in soil_clean
            is_clay = "clay" in soil_clean or "clayey" in soil_clean or "paki" in soil_clean

            soil_fit = any(
                (is_loamy and "loam" in s.lower())
                or (is_sandy and "sand" in s.lower())
                or (is_clay and "clay" in s.lower())
                or s.lower().split()[0] in soil_clean
                for s in ideal_soils
            )

            if soil_fit:
                soil_score = 20.0
                reasons.append(f"Excellent match with your {req.soil_type} soil structure.")
            elif is_loamy and any("loam" in s.lower() for s in ideal_soils):
                soil_score = 18.0
                reasons.append(f"Good compatibility with {req.soil_type}.")
            else:
                soil_score = 8.0
                risks.append(f"Suboptimal soil texture: Best performance on {', '.join(ideal_soils)}.")

            # -------------------------------------------------------------
            # Rule 4: Province & Ecological Zone Fit (Max 15 pts)
            # -------------------------------------------------------------
            eco_score = 0.0
            if province_clean in provinces or "Pakistan" in provinces:
                eco_score = 10.0
                # Regional bonus for renowned agricultural belts
                if district_clean in ["Multan", "Bahawalpur", "Bhakkar", "Layyah", "Mianwali"] and crop["id"] in ["chickpea", "mustard", "wheat", "cotton"]:
                    eco_score += 5.0
                    reasons.append(f"Proven high-performance crop in {district_clean} agro-climatic zone.")
                elif district_clean in ["Faisalabad", "Sahiwal", "Okara", "Pakpattan"] and crop["id"] in ["wheat", "maize", "potato", "mustard"]:
                    eco_score += 5.0
                    reasons.append(f"Thriving benchmark belt in Central Punjab ({district_clean}).")
                elif district_clean in ["Gujranwala", "Sheikhupura", "Sialkot"] and crop["id"] in ["rice", "wheat"]:
                    eco_score += 5.0
                    reasons.append(f"Prime Kalar Basmati belt in {district_clean}.")
                else:
                    eco_score += 3.0
            else:
                eco_score = 4.0
                risks.append(f"Uncommon in {province_clean}; verify local microclimate before sowing.")

            # -------------------------------------------------------------
            # Rule 5: Economics, Margins & Price Stability (Max 10 pts)
            # -------------------------------------------------------------
            econ_score = 0.0
            margin_ratio = econ["net_profit_per_acre"] / max(1, econ["total_cost_per_acre"])

            if margin_ratio > 1.5:
                econ_score = 10.0
                reasons.append(f"Outstanding profit-to-cost ratio (>150% ROI) at PKR {econ['market_price_per_maund']:,}/maund.")
            elif margin_ratio > 1.0:
                econ_score = 8.0
                reasons.append(f"Solid economic returns (PKR {econ['net_profit_per_acre']:,}/acre net margin).")
            else:
                econ_score = 6.0

            # Add common pest alerts to risks
            pests_str = ", ".join(crop.get("common_pests", [])[:2])
            if pests_str:
                risks.append(f"Monitor for seasonal pests: {pests_str}.")

            # -------------------------------------------------------------
            # Total Mathematical Suitability Score (0 - 100)
            # -------------------------------------------------------------
            total_score = round(season_score + water_score + soil_score + eco_score + econ_score, 1)
            total_score = max(0.0, min(100.0, total_score))

            if total_score >= 85.0:
                label = "Highly Suitable (انتہائی موزوں ⭐⭐⭐)"
            elif total_score >= 70.0:
                label = "Suitable (موزوں ⭐⭐)"
            elif total_score >= 50.0:
                label = "Moderate (درمیانہ موزوں ⭐)"
            else:
                label = "Not Recommended (ناموزوں)"

            # Financial Calculations for total land acres
            yield_per_acre = econ["avg_yield_maunds_per_acre"]
            price_per_maund = econ["market_price_per_maund"]
            total_yield = round(yield_per_acre * acres, 1)
            gross_revenue = int(yield_per_acre * price_per_maund * acres)
            total_cost = int(econ["total_cost_per_acre"] * acres)
            net_profit = gross_revenue - total_cost

            # Acreage allocation (Primary allocation)
            candidates.append(
                CropRecommendation(
                    crop_name=crop_name,
                    crop_name_urdu=crop_name_urdu,
                    season=crop_season,
                    suitability_score=total_score,
                    suitability_label=label,
                    acreage_allocation=acres,
                    water_requirement=f"{water_req} ({crop['irrigation_count']})",
                    reasons=reasons,
                    risks=risks,
                    expected_yield_maunds_per_acre=yield_per_acre,
                    total_expected_yield_maunds=total_yield,
                    market_price_per_maund=price_per_maund,
                    gross_revenue_pkr=gross_revenue,
                    estimated_cost_pkr=total_cost,
                    net_profit_pkr=net_profit,
                    sowing_window=crop["sowing_window"],
                    growing_duration_days=crop["approximate_growing_duration_days"],
                    common_pests=crop.get("common_pests", []),
                    irrigation_advice=irrigation_info.get("irrigation_tip", f"Standard schedule: {crop['irrigation_count']}"),
                )
            )

        # Sort candidates descending by deterministic suitability score, then by net profit
        candidates.sort(key=lambda c: (c.suitability_score, c.net_profit_pkr), reverse=True)

        if not candidates:
            # Fallback if an exotic season input was provided
            top_rec = CropRecommendation(
                crop_name="Wheat",
                crop_name_urdu="گندم",
                season="Rabi",
                suitability_score=75.0,
                suitability_label="Suitable (موزوں ⭐⭐)",
                acreage_allocation=acres,
                water_requirement="Medium (4-5 irrigations)",
                reasons=["Staple crop across Pakistan with guaranteed government minimum support price."],
                risks=["Requires at least 3 critical irrigations."],
                expected_yield_maunds_per_acre=42.0,
                total_expected_yield_maunds=42.0 * acres,
                market_price_per_maund=3900,
                gross_revenue_pkr=int(42.0 * 3900 * acres),
                estimated_cost_pkr=int(67000 * acres),
                net_profit_pkr=int((42.0 * 3900 - 67000) * acres),
                sowing_window="November 01 to November 30",
                growing_duration_days=150,
                common_pests=["Aphids", "Rust"],
                irrigation_advice="Apply water at Crown Root Initiation and Flowering stages.",
            )
            candidates = [top_rec]

        best = candidates[0]

        # Summaries in English and Urdu
        summary_en = (
            f"For {district_clean}, {province_clean} during the {season_clean} season with {req.water_availability.lower()} water on {acres:.1f} acres of {req.soil_type}, "
            f"the top recommended crop is {best.crop_name} ({best.crop_name_urdu}) with a suitability score of {best.suitability_score}/100. "
            f"It offers an estimated net profit of PKR {best.net_profit_pkr:,} with an expected total yield of {best.total_expected_yield_maunds} maunds."
        )

        summary_ur = (
            f"{district_clean} ({province_clean}) میں {season_clean} سیزن کے دوران {acres:.1f} ایکڑ {req.soil_type} زمین اور {req.water_availability} پانی کی دستیابی کے لیے "
            f"سب سے زیادہ موزوں فصل **{best.crop_name_urdu} ({best.crop_name})** ہے (اہلیت اسکور: {best.suitability_score}/100)۔ "
            f"اس سے متوقع خالص منافع تقریباً **PKR {best.net_profit_pkr:,}** اور کل پیداوار {best.total_expected_yield_maunds} من متوقع ہے۔"
        )

        return CropPlan(
            district=district_clean,
            province=province_clean,
            season=season_clean,
            land_acres=acres,
            total_recommended_acreage=acres,
            soil_type=req.soil_type,
            water_availability=req.water_availability,
            recommended_crop=best.crop_name,
            recommended_crop_urdu=best.crop_name_urdu,
            recommendations=candidates,
            top_recommendations=candidates[:4],
            overall_agronomy_summary=summary_en,
            summary_urdu=summary_ur,
            generated_by="Deterministic Agronomy Service (Kisan Dost)",
        )
