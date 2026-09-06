import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.database import init_db


@pytest.fixture(autouse=True)
async def setup_db():
    await init_db()


@pytest.mark.anyio
async def test_api_crop_advisor():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/tools/crop-advisor", json={
            "district": "Multan",
            "soil_type": "Loam (Mera)",
            "season": "Rabi",
            "land_acres": 5.0
        })
        assert res.status_code == 200
        data = res.json()
        assert data["district"] == "Multan"
        assert len(data["top_recommendations"]) > 0


@pytest.mark.anyio
async def test_api_fertilizer():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/tools/fertilizer-calculator", json={
            "crop": "wheat",
            "acres": 5.0
        })
        assert res.status_code == 200
        data = res.json()
        assert data["urea_bags"] == 7.9  # Net nitrogen after DAP contribution
        assert data["dap_bags"] == 7.6
        assert data["total_cost_pkr"] > 0


@pytest.mark.anyio
async def test_api_mandi_prices():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/tools/mandi-prices?commodity=wheat")
        assert res.status_code == 200
        data = res.json()
        assert len(data["rates"]) > 0


@pytest.mark.anyio
async def test_api_chat_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/chat", json={
            "message": "Gandum k liye kitni bori khad chahiye?",
            "district": "Multan",
            "land_acres": 5.0,
            "current_crop": "Wheat"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["session_id"] is not None
        assert "یوریا" in data["response"] or "Urea" in data["response"]
        assert data["tool_used"] == "Fertilizer Calculator"
