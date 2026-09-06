"""Comprehensive Unit & Integration Test Suite for Phase 3 — Crop Advisor.
Verifies all requirements for TEST 4:
1. Recommendations are generated.
2. Recommendations are based on deterministic scoring.
3. Total recommended acreage equals 5 acres.
4. No negative acreage.
5. Unsupported crops are not returned.
6. The agent can explain the result.
7. Urdu query works.
8. Missing information is requested instead of invented.
9. API returns valid Pydantic-compatible JSON.
10. Test Faisalabad, Kharif, abundant water, and rain-fed conditions.
"""
import pytest
from httpx import AsyncClient, ASGITransport

from backend.app.main import app
from backend.app.services.crop_service import CropService
from backend.app.agents.agronomy_agent import AgronomyAgent
from backend.app.models.schemas import CropRecommendationRequest, CropPlan


REQUIRED_9_CROPS = [
    "wheat", "chickpea", "mustard", "barley",
    "lentil", "potato", "cotton", "rice", "maize"
]

REQUIRED_CROP_FIELDS = [
    "crop_name", "season", "suitable_provinces", "suitable_soil_types",
    "water_requirement", "approximate_growing_duration_days",
    "temperature_range", "irrigation_characteristics",
    "common_pests", "economic_factors"
]


def test_crop_database_integrity():
    """Verify crops_db.json contains all 9 required Pakistani crops with full schemas."""
    crops = CropService.load_crops()
    assert len(crops) >= 9

    crop_ids = [c["id"].lower() for c in crops]
    for required in REQUIRED_9_CROPS:
        assert required in crop_ids, f"Required crop '{required}' missing from crop knowledge base"

    for crop in crops:
        for field in REQUIRED_CROP_FIELDS:
            assert field in crop, f"Field '{field}' missing from crop '{crop.get('crop_name')}'"

        assert "min_c" in crop["temperature_range"]
        assert "max_c" in crop["temperature_range"]
        assert "critical_stages" in crop["irrigation_characteristics"]
        assert isinstance(crop["common_pests"], list) and len(crop["common_pests"]) > 0
        assert "avg_yield_maunds_per_acre" in crop["economic_factors"]
        assert "market_price_per_maund" in crop["economic_factors"]


def test_multan_5acres_rabi_limited_water_scenario():
    """
    Test 4 Core Requirement:
    District: Multan | Province: Punjab | Season: Rabi | Land: 5 acres | Water: Limited | Soil: Loamy
    
    Verifies:
    1. Recommendations are generated.
    2. Based on deterministic scoring (0-100).
    3. Total recommended acreage equals 5 acres.
    4. No negative acreage.
    5. Unsupported crops (e.g. Rice, Cotton in Rabi) are NOT returned.
    """
    req = CropRecommendationRequest(
        district="Multan",
        province="Punjab",
        season="Rabi",
        soil_type="Loamy",
        water_availability="Limited",
        land_acres=5.0,
        preferred_language="urdu"
    )
    plan = CropService.recommend_crops(req)

    # 1. Recommendations generated
    assert isinstance(plan, CropPlan)
    assert plan.district == "Multan"
    assert len(plan.recommendations) > 0

    # 2. Deterministic scoring
    top = plan.recommendations[0]
    assert 0.0 <= top.suitability_score <= 100.0
    assert top.suitability_score >= 80.0

    # 3. Total recommended acreage equals 5 acres
    assert plan.land_acres == 5.0
    assert plan.total_recommended_acreage == 5.0
    assert top.acreage_allocation == 5.0

    # 4. No negative acreage
    for c in plan.recommendations:
        assert c.acreage_allocation > 0
        assert c.acreage_allocation == 5.0

    # 5. Unsupported crops are not returned (Kharif crops must not appear in Rabi)
    crop_names = [c.crop_name.lower() for c in plan.recommendations]
    assert not any("rice" in name for name in crop_names), "Rice must not be returned in Rabi"
    assert not any("cotton" in name for name in crop_names), "Cotton must not be returned in Rabi"
    assert not any("sugarcane" in name for name in crop_names)

    # Top recommended crop must be drought-hardy (Chickpea or Mustard)
    assert any(target in top.crop_name.lower() for target in ["chickpea", "mustard", "canola", "raya", "lentil", "barley"])


def test_deterministic_scoring_repeatability():
    """Verify identical inputs yield strictly identical scores and order (no randomness/hallucination)."""
    req = CropRecommendationRequest(
        district="Multan",
        province="Punjab",
        season="Rabi",
        soil_type="Loam",
        water_availability="Limited",
        land_acres=5.0
    )
    plan1 = CropService.recommend_crops(req)
    plan2 = CropService.recommend_crops(req)

    assert plan1.recommended_crop == plan2.recommended_crop
    for c1, c2 in zip(plan1.recommendations, plan2.recommendations):
        assert c1.crop_name == c2.crop_name
        assert c1.suitability_score == c2.suitability_score
        assert c1.net_profit_pkr == c2.net_profit_pkr


@pytest.mark.anyio
async def test_agriculture_recommend_api_pydantic_json():
    """Verify POST /api/agriculture/recommend returns valid Pydantic-compatible JSON."""
    payload = {
        "district": "Multan",
        "province": "Punjab",
        "season": "Rabi",
        "soil_type": "Loam (Mera)",
        "water_availability": "Limited",
        "land_acres": 5.0,
        "preferred_language": "urdu"
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/agriculture/recommend", json=payload)
        assert res.status_code == 200
        data = res.json()

        # Validate with Pydantic model directly
        validated_plan = CropPlan.model_validate(data)
        assert validated_plan.district == "Multan"
        assert validated_plan.land_acres == 5.0
        assert validated_plan.total_recommended_acreage == 5.0
        assert len(validated_plan.recommendations) > 0
        assert validated_plan.recommendations[0].suitability_score > 0
        assert validated_plan.recommendations[0].acreage_allocation == 5.0


@pytest.mark.anyio
async def test_agronomy_agent_explanation():
    """Verify the agent can explain the result in friendly language with reasons & risks."""
    prompt = "5 acres in Multan, Rabi season, limited water."
    res = await AgronomyAgent.process_inquiry(prompt, language="english")

    assert res["needs_more_info"] is False
    assert res["crop_plan"] is not None
    response_text = res["response"]

    # Must contain crop name and financial figures
    assert any(c in response_text for c in ["Mustard", "Chickpea", "سرسوں", "چنا"])
    assert "PKR" in response_text or "روپے" in response_text


@pytest.mark.anyio
async def test_urdu_query_works():
    """Verify natural language Urdu query works end-to-end."""
    urdu_prompt = "ملتان میں 5 ایکڑ زمین، ربیع سیزن، کم پانی"
    res = await AgronomyAgent.process_inquiry(urdu_prompt, language="urdu")

    assert res["needs_more_info"] is False
    assert res["crop_plan"] is not None
    assert res["crop_plan"].district == "Multan"
    assert res["crop_plan"].land_acres == 5.0

    # Explanation in Urdu
    assert any(c in res["response"] for c in ["سرسوں", "چنا", "گندم", "من"])
    assert "اہلیت کا اسکور" in res["response"] or "تجویز کردہ" in res["response"]


@pytest.mark.anyio
async def test_missing_information_requested_not_invented():
    """Verify missing information triggers a clarification request instead of inventing parameters."""
    incomplete_prompts = [
        "What should I sow?",
        "Tell me which crop is best.",
        "5 acres land only",
        "Multan farming advice"
    ]

    for p in incomplete_prompts:
        res = await AgronomyAgent.process_inquiry(p, language="english")
        assert res["needs_more_info"] is True, f"Agent should request missing info for '{p}'"
        assert len(res["missing_fields"]) > 0
        assert res["crop_plan"] is None, "Agent must not invent crop plan when vital parameters are missing"


def test_faisalabad_kharif_abundant_water():
    """Verify Faisalabad during Kharif with abundant water recommends summer crops like Basmati Rice and Maize."""
    req = CropRecommendationRequest(
        district="Faisalabad",
        province="Punjab",
        season="Kharif",
        soil_type="Clay Loam",
        water_availability="Abundant",
        land_acres=10.0
    )
    plan = CropService.recommend_crops(req)

    assert plan.district == "Faisalabad"
    assert plan.season == "Kharif"
    assert len(plan.recommendations) > 0

    crop_names = [c.crop_name.lower() for c in plan.recommendations]

    # Rabi crops must NOT appear
    assert not any("wheat" in name for name in crop_names), "Wheat must not appear in Kharif"
    assert not any("chickpea" in name for name in crop_names), "Chickpea must not appear in Kharif"

    # Under abundant water in Kharif, Basmati Rice / Maize / Cotton must be returned
    assert any("rice" in name for name in crop_names) or any("maize" in name for name in crop_names)

    top = plan.recommendations[0]
    assert top.suitability_score >= 80.0
    assert top.acreage_allocation == 10.0


def test_rainfed_barani_conditions():
    """Verify rain-fed / barani conditions favor drought-hardy crops and penalize high-water crops."""
    req = CropRecommendationRequest(
        district="Chakwal",
        province="Punjab",
        season="Rabi",
        soil_type="Sandy Loam",
        water_availability="Rain-fed",
        land_acres=4.0
    )
    plan = CropService.recommend_crops(req)

    assert len(plan.recommendations) > 0
    top = plan.recommendations[0]

    # Top crop in rainfed must be a drought-hardy low water crop (Chickpea, Mustard, Barley, or Lentil)
    assert any(k in top.crop_name.lower() for k in ["chickpea", "mustard", "barley", "lentil"])
    assert top.acreage_allocation == 4.0
    assert "low" in top.water_requirement.lower() or "rainfed" in top.water_requirement.lower() or "1-2" in top.water_requirement.lower()

    # Potato requires heavy irrigation; under rain-fed conditions it must score lower than top crop
    potato_recs = [c for c in plan.recommendations if "potato" in c.crop_name.lower()]
    if potato_recs:
        assert potato_recs[0].suitability_score < top.suitability_score
        assert any("disqualified" in r.lower() or "irrigation" in r.lower() or "risk" in r.lower() for r in potato_recs[0].risks)


def test_four_seasons_order_and_recommendations():
    """Verify that Summer, Winter, Spring, and Autumn queries all return accurate, non-overlapping crop sets."""
    # 1. Summer (Kharif)
    summer_plan = CropService.recommend_crops(CropRecommendationRequest(
        district="Multan", province="Punjab", season="Summer",
        soil_type="Loam", water_availability="Adequate", land_acres=5.0
    ))
    summer_crops = [c.crop_name.lower() for c in summer_plan.recommendations]
    assert len(summer_crops) > 0
    assert any("cotton" in c or "rice" in c or "maize" in c for c in summer_crops)
    assert not any("wheat" in c for c in summer_crops), "Wheat must not be recommended in Summer"

    # 2. Winter (Rabi)
    winter_plan = CropService.recommend_crops(CropRecommendationRequest(
        district="Faisalabad", province="Punjab", season="Winter",
        soil_type="Loam", water_availability="Adequate", land_acres=5.0
    ))
    winter_crops = [c.crop_name.lower() for c in winter_plan.recommendations]
    assert len(winter_crops) > 0
    assert any("wheat" in c for c in winter_crops)
    assert not any("cotton" in c for c in winter_crops), "Cotton must not be recommended in Winter"
    assert not any("rice" in c for c in winter_crops), "Rice must not be recommended in Winter"

    # 3. Spring (Zaid Rabi)
    spring_plan = CropService.recommend_crops(CropRecommendationRequest(
        district="Sahiwal", province="Punjab", season="Spring",
        soil_type="Loam", water_availability="Adequate", land_acres=5.0
    ))
    spring_crops = [c.crop_name.lower() for c in spring_plan.recommendations]
    assert len(spring_crops) > 0
    assert any("maize" in c for c in spring_crops), "Spring Maize should be recommended in Spring"

    # 4. Autumn (Zaid Kharif)
    autumn_plan = CropService.recommend_crops(CropRecommendationRequest(
        district="Okara", province="Punjab", season="Autumn",
        soil_type="Loam", water_availability="Adequate", land_acres=5.0
    ))
    autumn_crops = [c.crop_name.lower() for c in autumn_plan.recommendations]
    assert len(autumn_crops) > 0
    assert any("potato" in c or "maize" in c for c in autumn_crops), "Potato or Maize should be recommended in Autumn"
    assert not any("cotton" in c for c in autumn_crops), "Cotton is not sown in Autumn"

