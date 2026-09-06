"""Extensive Test Suite for Phase 4 Fertilizer Calculations (TEST 5).
Covers all requirements:
1. Exact benchmark tests for 1 acre, 5 acres, 10 acres.
2. Multi-crop tests across all 7 supported crops (Wheat, Chickpea, Mustard, Rice, Cotton, Maize, Potato).
3. Invalid crop validation (Pydantic ValidationError & HTTP 422).
4. Zero acres validation (Pydantic ValidationError & HTTP 422).
5. Negative acres validation (Pydantic ValidationError & HTTP 422).
6. Determinism & repeatable mathematical guarantees (100 repeated executions).
7. Strict non-negativity constraint on bags (no negative bags under any condition).
8. Exact cost calculation validation and price estimate disclosure.
9. FastAPI API endpoint response JSON verification.
"""
import pytest
import json
from pydantic import ValidationError
from httpx import AsyncClient, ASGITransport

from backend.app.main import app
from backend.app.models.schemas import FertilizerInput, FertilizerPlan
from backend.app.services.fertilizer_service import FertilizerService


# =====================================================================
# 1. KNOWN FIXED BENCHMARKS: 1 ACRE, 5 ACRES, 10 ACRES (WHEAT, LOAM)
# =====================================================================

def test_fixed_benchmark_1_acre_wheat():
    """Known fixed benchmark: 1 acre Wheat on standard Loam."""
    inp = FertilizerInput(crop="Wheat", acres=1.0, soil_type="Loam (Mera)")
    plan = FertilizerService.calculate(inp)

    # NPK Requirements (Wheat: 50 N, 35 P, 25 K per acre)
    assert plan.acres == 1.0
    assert plan.nitrogen_requirement_kg == 50.0
    assert plan.phosphorus_requirement_kg == 35.0
    assert plan.potassium_requirement_kg == 25.0

    # Bags calculation:
    # DAP: 35 / 23 = 1.52 -> 1.5 bags
    # DAP N: 1.5 * 9.0 = 13.5 kg
    # Rem N: 50.0 - 13.5 = 36.5 kg
    # Urea: 36.5 / 23.0 = 1.58 -> 1.6 bags
    # SOP: 25.0 / 25.0 = 1.0 bag
    assert plan.dap_bags == 1.5
    assert plan.urea_bags == 1.6
    assert plan.sop_bags == 1.0

    # Costs (DAP: 12,800, Urea: 4,600, SOP: 14,500)
    assert plan.dap_cost_pkr == 19200       # 1.5 * 12800
    assert plan.urea_cost_pkr == 7360       # 1.6 * 4600
    assert plan.sop_cost_pkr == 14500       # 1.0 * 14500
    assert plan.total_cost_pkr == 41060     # 19200 + 7360 + 14500
    assert plan.estimated_total_cost_pkr == 41060
    assert plan.is_price_estimate is True


def test_fixed_benchmark_5_acres_wheat():
    """Known fixed benchmark: 5 acres Wheat on standard Loam."""
    inp = FertilizerInput(crop="Wheat", acres=5.0, soil_type="Loam (Mera)")
    plan = FertilizerService.calculate(inp)

    # NPK Requirements
    assert plan.acres == 5.0
    assert plan.nitrogen_requirement_kg == 250.0
    assert plan.phosphorus_requirement_kg == 175.0
    assert plan.potassium_requirement_kg == 125.0

    # Bags calculation:
    # DAP: 175 / 23 = 7.608 -> 7.6 bags
    # DAP N: 7.6 * 9.0 = 68.4 kg
    # Rem N: 250.0 - 68.4 = 181.6 kg
    # Urea: 181.6 / 23.0 = 7.895 -> 7.9 bags
    # SOP: 125.0 / 25.0 = 5.0 bags
    assert plan.dap_bags == 7.6
    assert plan.urea_bags == 7.9
    assert plan.sop_bags == 5.0

    # Costs
    assert plan.dap_cost_pkr == 97280       # 7.6 * 12800
    assert plan.urea_cost_pkr == 36340      # 7.9 * 4600
    assert plan.sop_cost_pkr == 72500       # 5.0 * 14500
    assert plan.total_cost_pkr == 206120    # 97280 + 36340 + 72500
    assert plan.estimated_total_cost_pkr == 206120


def test_fixed_benchmark_10_acres_wheat():
    """Known fixed benchmark: 10 acres Wheat on standard Loam."""
    inp = FertilizerInput(crop="Wheat", acres=10.0, soil_type="Loam (Mera)")
    plan = FertilizerService.calculate(inp)

    # NPK Requirements
    assert plan.acres == 10.0
    assert plan.nitrogen_requirement_kg == 500.0
    assert plan.phosphorus_requirement_kg == 350.0
    assert plan.potassium_requirement_kg == 250.0

    # Bags calculation:
    # DAP: 350 / 23 = 15.217 -> 15.2 bags
    # DAP N: 15.2 * 9.0 = 136.8 kg
    # Rem N: 500.0 - 136.8 = 363.2 kg
    # Urea: 363.2 / 23.0 = 15.791 -> 15.8 bags
    # SOP: 250.0 / 25.0 = 10.0 bags
    assert plan.dap_bags == 15.2
    assert plan.urea_bags == 15.8
    assert plan.sop_bags == 10.0

    # Costs
    assert plan.dap_cost_pkr == 194560      # 15.2 * 12800
    assert plan.urea_cost_pkr == 72680      # 15.8 * 4600
    assert plan.sop_cost_pkr == 145000      # 10.0 * 14500
    assert plan.total_cost_pkr == 412240    # 194560 + 72680 + 145000
    assert plan.estimated_total_cost_pkr == 412240


# =====================================================================
# 2. DIFFERENT CROPS TESTING (ALL 7 CROPS) & NO NEGATIVE BAGS
# =====================================================================

@pytest.mark.parametrize("crop_name,acres,expected_k_bags", [
    ("Wheat", 2.0, 2.0),
    ("Chickpea", 3.0, 0.0),    # Legume, base K is 0
    ("Mustard", 4.0, 2.4),     # 4 * 15 = 60kg K / 25 = 2.4 bags
    ("Rice", 2.5, 2.5),        # 2.5 * 25 = 62.5kg K / 25 = 2.5 bags
    ("Cotton", 5.0, 5.0),      # 5 * 25 = 125kg K / 25 = 5.0 bags
    ("Maize", 3.0, 3.6),       # 3 * 30 = 90kg K / 25 = 3.6 bags
    ("Potato", 1.0, 3.0),      # 1 * 75 = 75kg K / 25 = 3.0 bags
])
def test_all_crops_calculations_and_non_negativity(crop_name, acres, expected_k_bags):
    """Verify all 7 crops calculate correct bags and never produce negative numbers."""
    inp = FertilizerInput(crop=crop_name, acres=acres, soil_type="Loam (Mera)")
    plan = FertilizerService.calculate(inp)

    # Core non-negativity constraint
    assert plan.dap_bags >= 0.0, f"Negative DAP bags found for {crop_name}"
    assert plan.urea_bags >= 0.0, f"Negative Urea bags found for {crop_name}"
    assert plan.sop_bags >= 0.0, f"Negative SOP bags found for {crop_name}"

    assert plan.nitrogen_requirement_kg >= 0.0
    assert plan.phosphorus_requirement_kg >= 0.0
    assert plan.potassium_requirement_kg >= 0.0

    assert plan.dap_cost_pkr >= 0
    assert plan.urea_cost_pkr >= 0
    assert plan.sop_cost_pkr >= 0
    assert plan.total_cost_pkr >= 0

    assert plan.sop_bags == expected_k_bags

    # Verify each product in structured breakdown has non-negative values
    for product in plan.products:
        assert product.bags_count >= 0.0
        assert product.total_cost_pkr >= 0
        assert product.unit_price_pkr > 0
        for nutrient, kg in product.nutrients_contributed_kg.items():
            assert kg >= 0.0


# =====================================================================
# 3. INVALID CROP VALIDATION
# =====================================================================

def test_invalid_crop_raises_pydantic_validation_error():
    """Verify invalid crop names fail Pydantic model validation."""
    with pytest.raises(ValidationError) as excinfo:
        FertilizerInput(crop="DragonFruit", acres=5.0)
    assert "not supported" in str(excinfo.value).lower()

    with pytest.raises(ValidationError):
        FertilizerInput(crop="unknown_crop_xyz", acres=2.0)

    with pytest.raises(ValidationError):
        FertilizerInput(crop="", acres=1.0)


def test_service_match_crop_rejects_unsupported():
    """Verify FertilizerService.match_crop directly raises ValueError on unsupported crop."""
    catalog = FertilizerService._load_catalog()
    with pytest.raises(ValueError) as excinfo:
        FertilizerService.match_crop("avocado", catalog)
    assert "not supported" in str(excinfo.value).lower()


# =====================================================================
# 4. ZERO ACRES VALIDATION
# =====================================================================

def test_zero_acres_raises_validation_error():
    """Verify acres=0 fails Pydantic validation."""
    with pytest.raises(ValidationError) as excinfo:
        FertilizerInput(crop="Wheat", acres=0.0)
    assert "greater than 0" in str(excinfo.value) or "Input should be greater than 0" in str(excinfo.value)


# =====================================================================
# 5. NEGATIVE ACRES VALIDATION
# =====================================================================

def test_negative_acres_raises_validation_error():
    """Verify negative acres fails Pydantic validation."""
    with pytest.raises(ValidationError) as excinfo:
        FertilizerInput(crop="Wheat", acres=-5.0)
    assert "greater than 0" in str(excinfo.value) or "Input should be greater than 0" in str(excinfo.value)

    with pytest.raises(ValidationError):
        FertilizerInput(crop="Cotton", acres=-0.5)


# =====================================================================
# 6. DETERMINISTIC GUARANTEE (100 REPEATED RUNS)
# =====================================================================

def test_calculations_are_strictly_deterministic():
    """Verify that identical inputs produce 100% bitwise identical results across 100 iterations."""
    inp = FertilizerInput(
        crop="Cotton",
        acres=8.5,
        soil_type="Clay Loam",
        target_yield=35.0,
        preferred_language="urdu"
    )

    first_result = FertilizerService.calculate(inp)
    first_dict = first_result.model_dump()

    for _ in range(100):
        repeat_result = FertilizerService.calculate(inp)
        assert repeat_result.model_dump() == first_dict


# =====================================================================
# 7. COST CALCULATION EXACT ARITHMETIC
# =====================================================================

def test_cost_calculation_arithmetic_precision():
    """Verify that product costs exactly match unit_price * bags_count and sum up to total_cost_pkr."""
    crops = ["Wheat", "Chickpea", "Mustard", "Rice", "Cotton", "Maize", "Potato"]
    for crop in crops:
        inp = FertilizerInput(crop=crop, acres=3.5, soil_type="Sandy Loam (ریتلی میرا)")
        plan = FertilizerService.calculate(inp)

        computed_total = 0
        for product in plan.products:
            expected_product_cost = int(round(product.bags_count * product.unit_price_pkr))
            assert product.total_cost_pkr == expected_product_cost
            computed_total += product.total_cost_pkr

        assert plan.total_cost_pkr == computed_total
        assert plan.estimated_total_cost_pkr == computed_total
        assert plan.dap_cost_pkr + plan.urea_cost_pkr + plan.sop_cost_pkr == plan.total_cost_pkr


# =====================================================================
# 8. API ENDPOINT VALIDATION (FASTAPI INTEGRATION)
# =====================================================================

@pytest.mark.anyio
async def test_api_returns_correct_json_and_status_codes():
    """Verify API POST /api/fertilizer/calculate endpoint behavior."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Valid 5 acres Wheat request
        payload = {
            "crop": "Wheat",
            "acres": 5.0,
            "soil_type": "Loam (Mera)",
            "target_yield": 40.0
        }
        resp = await ac.post("/api/fertilizer/calculate", json=payload)
        assert resp.status_code == 200
        data = resp.json()

        # Validate JSON keys
        required_keys = [
            "crop", "crop_ur", "acres", "nitrogen_requirement_kg",
            "phosphorus_requirement_kg", "potassium_requirement_kg",
            "dap_bags", "urea_bags", "sop_bags", "urea_cost_pkr",
            "dap_cost_pkr", "sop_cost_pkr", "total_cost_pkr",
            "estimated_total_cost_pkr", "is_price_estimate",
            "price_disclaimer", "products", "npk_kg_applied",
            "application_schedule", "agronomic_advice_urdu", "safety_notice"
        ]
        for key in required_keys:
            assert key in data, f"Missing required JSON key: {key}"

        assert data["acres"] == 5.0
        assert data["dap_bags"] == 7.6
        assert data["urea_bags"] == 7.9
        assert data["sop_bags"] == 5.0
        assert data["total_cost_pkr"] == 206120


@pytest.mark.anyio
async def test_api_rejects_invalid_inputs_with_422():
    """Verify API returns 422 Unprocessable Entity for invalid inputs."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Zero acres
        resp1 = await ac.post("/api/fertilizer/calculate", json={"crop": "Wheat", "acres": 0.0})
        assert resp1.status_code == 422

        # Negative acres
        resp2 = await ac.post("/api/fertilizer/calculate", json={"crop": "Wheat", "acres": -5.0})
        assert resp2.status_code == 422

        # Invalid crop
        resp3 = await ac.post("/api/fertilizer/calculate", json={"crop": "Pineapple", "acres": 3.0})
        assert resp3.status_code == 422
