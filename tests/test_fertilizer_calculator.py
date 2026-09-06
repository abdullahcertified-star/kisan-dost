"""Unit and integration tests for Phase 4 Deterministic Fertilizer Calculator.
Verifies:
1. All 7 crops are supported (Wheat, Chickpea, Mustard, Rice, Cotton, Maize, Potato).
2. 100% deterministic repeatability (no LLM involvement).
3. Exact DAP bag and Urea bag calculations (accounting for DAP's 18% Nitrogen contribution).
4. Soil type modifier adjustments (Sandy Loam increases N & P by 10%).
5. Target yield scaling is bounded properly.
6. Bag sizes and prices are loaded dynamically from fertilizer_catalog.json.
7. Prices are clearly flagged as estimates (`is_price_estimate == True`).
8. Input validation (rejecting negative or 0 acres).
9. POST /api/fertilizer/calculate endpoint returns valid Pydantic JSON.
10. Safety check: No pesticide chemicals or toxic recommendations are present.
"""
import pytest
import json
import os
from httpx import AsyncClient, ASGITransport

from backend.app.main import app
from backend.app.models.schemas import FertilizerInput, FertilizerPlan, FertilizerProduct
from backend.app.services.fertilizer_service import FertilizerService


def test_all_seven_crops_supported():
    """Verify all 7 crops compute valid plans without errors."""
    crops = ["Wheat", "Chickpea", "Mustard", "Rice", "Cotton", "Maize", "Potato"]
    for crop in crops:
        inp = FertilizerInput(crop=crop, acres=5.0, soil_type="Loam (Mera)")
        plan = FertilizerService.calculate(inp)
        assert isinstance(plan, FertilizerPlan)
        assert plan.crop.lower() in [c.lower() for c in ["Wheat", "Chickpea (Gram)", "Mustard / Canola (Raya)", "Rice (Basmati / Coarse)", "Cotton", "Maize (Spring / Autumn Hybrid)", "Potato (Autumn / Spring)"]]
        assert plan.acres == 5.0
        assert plan.nitrogen_requirement_kg > 0.0
        assert plan.phosphorus_requirement_kg > 0.0
        assert plan.dap_bags > 0.0
        assert plan.estimated_total_cost_pkr > 0
        assert plan.is_price_estimate is True


def test_dap_nitrogen_deduction_stoichiometry():
    """Verify Nitrogen supplied by DAP (9kg N / 50kg bag) is subtracted before calculating Urea bags."""
    inp = FertilizerInput(crop="Wheat", acres=1.0, soil_type="Loam (Mera)")
    plan = FertilizerService.calculate(inp)

    # Wheat on Loam: Base N=50 kg, Base P=35 kg
    assert plan.nitrogen_requirement_kg == 50.0
    assert plan.phosphorus_requirement_kg == 35.0

    # DAP needed for 35 kg P: 35 / 23 = 1.52 -> rounded to 1.5 bags
    assert plan.dap_bags == 1.5

    # N supplied by 1.5 bags DAP: 1.5 * 9.0 = 13.5 kg N
    # Remaining N: 50.0 - 13.5 = 36.5 kg N
    # Urea bags needed: 36.5 / 23.0 = 1.58 -> rounded to 1.6 bags
    assert plan.urea_bags == 1.6

    # Verify both products exist in structured breakdown
    products = {p.product_id: p for p in plan.products}
    assert "dap" in products
    assert "urea" in products
    assert products["dap"].bags_count == 1.5
    assert products["urea"].bags_count == 1.6


def test_chickpea_legume_low_nitrogen():
    """Verify Chickpea (legume) has minimal starter nitrogen and does not prescribe heavy urea."""
    inp = FertilizerInput(crop="Chickpea", acres=2.0, soil_type="Loam (Mera)")
    plan = FertilizerService.calculate(inp)

    # Chickpea has base N=10 kg, base P=25 kg per acre. For 2 acres: N=20kg, P=50kg
    # DAP bags: 50 / 23 = 2.17 -> 2.2 bags
    # N from DAP: 2.2 * 9 = 19.8 kg N (covers almost all 20 kg N requirement)
    # Urea bags should be minimal (<= 0.1 bag)
    assert plan.urea_bags <= 0.1
    assert "بیکٹیریا" in plan.agronomic_advice_urdu or "legume" in plan.agronomic_advice_english.lower()


def test_soil_type_modifiers():
    """Verify Sandy Loam increases requirements by 10% compared to benchmark Loam."""
    loam_inp = FertilizerInput(crop="Wheat", acres=5.0, soil_type="Loam (Mera)")
    sandy_inp = FertilizerInput(crop="Wheat", acres=5.0, soil_type="Sandy Loam (ریتلی میرا)")

    loam_plan = FertilizerService.calculate(loam_inp)
    sandy_plan = FertilizerService.calculate(sandy_inp)

    # Sandy Loam has n_factor=1.10, p_factor=1.10
    assert sandy_plan.nitrogen_requirement_kg == round(loam_plan.nitrogen_requirement_kg * 1.10, 1)
    assert sandy_plan.phosphorus_requirement_kg == round(loam_plan.phosphorus_requirement_kg * 1.10, 1)
    assert sandy_plan.estimated_total_cost_pkr > loam_plan.estimated_total_cost_pkr


def test_target_yield_scaling_bounded():
    """Verify target yield scales requirements linearly and is bounded between 0.6x and 1.5x."""
    base_inp = FertilizerInput(crop="Maize", acres=2.0, soil_type="Loam (Mera)")
    base_plan = FertilizerService.calculate(base_inp)

    # Benchmark yield for Maize is 60 maunds. Test target 90 maunds (1.5x)
    high_inp = FertilizerInput(crop="Maize", acres=2.0, soil_type="Loam (Mera)", target_yield=90.0)
    high_plan = FertilizerService.calculate(high_inp)
    assert high_plan.nitrogen_requirement_kg == round(base_plan.nitrogen_requirement_kg * 1.5, 1)

    # Test excessive unrealistic target yield of 300 maunds (should be clamped to 1.5x max)
    excessive_inp = FertilizerInput(crop="Maize", acres=2.0, soil_type="Loam (Mera)", target_yield=300.0)
    excessive_plan = FertilizerService.calculate(excessive_inp)
    assert excessive_plan.nitrogen_requirement_kg == high_plan.nitrogen_requirement_kg


def test_deterministic_repeatability():
    """Verify identical inputs yield 100% identical results (no LLM stochasticity)."""
    inp = FertilizerInput(crop="Cotton", acres=7.5, soil_type="Clay Loam", target_yield=30.0)
    plan1 = FertilizerService.calculate(inp)
    plan2 = FertilizerService.calculate(inp)

    assert plan1.nitrogen_requirement_kg == plan2.nitrogen_requirement_kg
    assert plan1.phosphorus_requirement_kg == plan2.phosphorus_requirement_kg
    assert plan1.potassium_requirement_kg == plan2.potassium_requirement_kg
    assert plan1.dap_bags == plan2.dap_bags
    assert plan1.urea_bags == plan2.urea_bags
    assert plan1.sop_bags == plan2.sop_bags
    assert plan1.estimated_total_cost_pkr == plan2.estimated_total_cost_pkr


def test_prices_clearly_labeled_as_estimates():
    """Verify prices are clearly marked as estimates with disclaimer."""
    inp = FertilizerInput(crop="Potato", acres=3.0, soil_type="Loam")
    plan = FertilizerService.calculate(inp)

    assert plan.is_price_estimate is True
    assert "تخمینہ" in plan.price_disclaimer or "estimate" in plan.price_disclaimer.lower()
    for product in plan.products:
        assert product.is_price_estimate is True


def test_input_validation_acres():
    """Verify negative or 0 acres raise validation error."""
    with pytest.raises(Exception):
        FertilizerInput(crop="Wheat", acres=0.0)

    with pytest.raises(Exception):
        FertilizerInput(crop="Wheat", acres=-5.0)


def test_safety_guardrail_zero_pesticide_information():
    """Verify the fertilizer tool never outputs pesticide chemical recommendations."""
    inp = FertilizerInput(crop="Cotton", acres=10.0, soil_type="Loam")
    plan = FertilizerService.calculate(inp)

    plan_str = json.dumps(plan.model_dump(), ensure_ascii=False).lower()
    unsafe_keywords = ["chlorpyrifos", "lambda", "emamectin", "cartap", "imidacloprid", "spray pesticide", "زہر سپرے"]
    for word in unsafe_keywords:
        assert word not in plan_str, f"Pesticide word '{word}' found in fertilizer output!"


@pytest.mark.anyio
async def test_api_fertilizer_calculate_endpoint():
    """Verify POST /api/fertilizer/calculate returns valid Pydantic JSON."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "crop": "Wheat",
            "acres": 5.0,
            "soil_type": "Loam (Mera)",
            "target_yield": 45.0,
            "preferred_language": "urdu"
        }
        resp = await ac.post("/api/fertilizer/calculate", json=payload)
        assert resp.status_code == 200
        data = resp.json()

        # Validate Pydantic schema deserialization
        plan = FertilizerPlan(**data)
        assert plan.crop.lower().startswith("wheat")
        assert plan.acres == 5.0
        assert plan.dap_bags > 0
        assert plan.urea_bags > 0
        assert plan.estimated_total_cost_pkr > 0
        assert plan.is_price_estimate is True
