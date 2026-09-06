"""
PHASE 13 — Hackathon Demo Mode Verification Test Suite
Validates:
- Demo Farmer Profile: Demo Farmer, Multan, Punjab, 5.0 acres, Loamy, Limited water, Rabi season
- Step 1: Farmer question about Rabi planting in Multan with limited water
- Step 2: Weather & Eco-Zone analysis for Multan
- Step 3: Crop suitability rankings
- Step 4: Fertilizer calculation (NPK stoichiometry for 5 acres)
- Step 5: Mandi prices (AMIS benchmark rates in Multan)
- Step 6: Estimated profit & break-even calculation
- Step 7: Farmer asks about cotton pest problem
- Step 8: Pest Doctor safe diagnosis with dosage clamping
- Step 9: Government support schemes matching (CM Punjab Kisan Card)
"""
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.database import init_db
from backend.app.agents.triage_agent import handle_query


@pytest.fixture(autouse=True)
async def setup_database():
    await init_db()


@pytest.mark.anyio
async def test_demo_step_1_farmer_sowing_inquiry():
    """STEP 1: Farmer asks 'I have 5 acres in Multan. Water is limited. What should I plant for Rabi?'"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/chat", json={
            "session_id": "demo_farmer_session_multan",
            "message": "I have 5 acres in Multan. Water is limited. What should I plant for Rabi?",
            "district": "Multan",
            "land_acres": 5.0,
            "current_crop": "None"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["agent_name"] == "agronomy"
        assert len(data["response"]) > 0


@pytest.mark.anyio
async def test_demo_step_2_weather_analysis():
    """STEP 2: Analyze Multan weather and agricultural conditions."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/weather/Multan")
        assert res.status_code == 200
        data = res.json()
        assert data["district"] == "Multan"
        assert "temperature" in data or "current" in data


@pytest.mark.anyio
async def test_demo_step_3_crop_recommendations():
    """STEP 3: Show crop recommendations for 5 acres in Multan under limited water."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/agriculture/recommend", json={
            "district": "Multan",
            "season": "Rabi",
            "water_availability": "Limited",
            "acres": 5.0,
            "soil_type": "Loam (Mera)"
        })
        assert res.status_code == 200
        data = res.json()
        assert len(data["top_recommendations"]) >= 2
        crops = [r["crop_name"].lower() for r in data["top_recommendations"]]
        assert any(any(kw in c for kw in ["wheat", "chickpea", "mustard", "gram", "raya", "lentil"]) for c in crops)


@pytest.mark.anyio
async def test_demo_step_4_fertilizer_calculation():
    """STEP 4: Calculate precision fertilizer requirements for 5 acres Wheat."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/fertilizer/calculate", json={
            "crop": "Wheat",
            "acres": 5.0,
            "soil_type": "Loam (Mera)",
            "target_yield_maunds": 38.0
        })
        assert res.status_code == 200
        data = res.json()
        assert data["urea_bags"] > 0
        assert data["dap_bags"] > 0
        assert data["total_cost_pkr"] > 0


@pytest.mark.anyio
async def test_demo_step_5_mandi_prices():
    """STEP 5: Show official AMIS mandi benchmark rates for Wheat in Multan."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/market/prices?crop=Wheat&market=Multan")
        assert res.status_code == 200
        data = res.json()
        assert len(data["rates"]) > 0
        assert "AMIS" in data["disclaimer"]


@pytest.mark.anyio
async def test_demo_step_6_profit_estimation():
    """STEP 6: Calculate estimated farm profit and break-even economics."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/profit/calculate", json={
            "crop": "Wheat",
            "acres": 5.0,
            "expected_yield_per_acre": 38.0,
            "mandi_price": 3900.0,
            "seed_cost": 3500.0,
            "fertilizer_cost": 14000.0,
            "pesticide_cost": 2500.0,
            "irrigation_cost": 5000.0,
            "labor_cost": 4500.0,
            "other_costs": 3000.0
        })
        assert res.status_code == 200
        data = res.json()
        assert data["gross_revenue"] == 5.0 * 38.0 * 3900.0
        assert data["net_profit"] > 0
        assert data["break_even_yield"] > 0


@pytest.mark.anyio
async def test_demo_step_7_and_8_pest_doctor_safe_diagnosis():
    """STEP 7 & 8: Farmer asks about pest problem; Pest Doctor handles safely."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Step 7: Chat query
        c_res = await client.post("/api/chat", json={
            "session_id": "demo_farmer_session_multan",
            "message": "My cotton crop leaves are curling yellow and white insects are swarming. What spray should I use?",
            "district": "Multan",
            "land_acres": 5.0,
            "current_crop": "Cotton"
        })
        assert c_res.status_code == 200
        assert c_res.json()["agent_name"] == "pest_doctor"

        # Step 8: Pest Doctor Diagnose API
        p_res = await client.post("/api/pest-doctor/diagnose", json={
            "crop": "Cotton",
            "symptoms": "leaves curling yellow and white insects under leaf surface",
            "district": "Multan",
            "acres": 5.0
        })
        assert p_res.status_code == 200
        p_data = p_res.json()
        assert "Whitefly" in p_data["primary_diagnosis"]
        assert p_data["dosage_disclaimer"] is not None
        assert p_data["verified_treatment"] is not None


@pytest.mark.anyio
async def test_demo_step_9_applicable_government_support():
    """STEP 9: Show applicable government support schemes for Multan smallholder."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/schemes?province=Punjab&district=Multan")
        assert res.status_code == 200
        data = res.json()
        assert len(data["schemes"]) >= 2
        scheme_names = [s["name"] for s in data["schemes"]]
        assert any("Kisan Card" in name for name in scheme_names)
