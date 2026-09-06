import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.services.schemes_service import SchemesService
from backend.app.services.tracer import tracer


@pytest.mark.anyio
async def test_api_schemes_endpoint():
    """Verify GET /api/schemes returns structured official schemes with sources and verification dates."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/schemes?province=Punjab")
        assert res.status_code == 200
        data = res.json()
        assert data["total_count"] >= 3
        assert len(data["schemes"]) >= 3
        for s in data["schemes"]:
            assert "name" in s
            assert "province" in s
            assert "eligible_farmer_types" in s
            assert "applicable_crops" in s
            assert "benefits" in s
            assert "requirements" in s
            assert "source" in s
            assert "last_verified_date" in s
            assert s["is_reference"] is True


@pytest.mark.anyio
async def test_api_schemes_filtering_and_fallback():
    """Verify filtering by province, district, crop, and fallback handling when data is unavailable."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Wheat in Punjab
        res = await client.get("/api/schemes?province=Punjab&crop=wheat")
        assert res.status_code == 200
        data = res.json()
        assert data["total_count"] >= 1
        assert not data["fallback_used"]

        # Non-existent crop fallback
        fallback_res = await client.get("/api/schemes?province=Balochistan&crop=unknown_crop_xyz")
        assert fallback_res.status_code == 200
        fallback_data = fallback_res.json()
        assert fallback_data["fallback_used"] is True
        assert fallback_data["total_count"] > 0
        assert "Displaying nationwide reference support programs" in fallback_data["message"]


@pytest.mark.anyio
async def test_api_chat_bilingual_roman_urdu():
    """Verify bilingual Roman Urdu requests correctly route to agents and return authentic responses."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Roman Urdu profile establishment
        res1 = await client.post("/api/chat", json={
            "session_id": "test_bilingual_session_1",
            "message": "mere paas Multan mein 5 acre zameen hai"
        })
        assert res1.status_code == 200
        d1 = res1.json()
        assert d1["agent_name"] == "agronomy"

        # 2. Roman Urdu drought recommendation
        res2 = await client.post("/api/chat", json={
            "session_id": "test_bilingual_session_1",
            "message": "pani kam hai, kya lagaoon?"
        })
        assert res2.status_code == 200
        d2 = res2.json()
        assert d2["agent_name"] == "agronomy"
        assert any(w in d2["response"].lower() for w in ["sarson", "chana", "mustard", "kapas", "cotton"])

        # 3. Roman Urdu market price lookup
        res3 = await client.post("/api/chat", json={
            "session_id": "test_bilingual_session_1",
            "message": "gandum ka rate kya hai?"
        })
        assert res3.status_code == 200
        d3 = res3.json()
        assert d3["agent_name"] == "market"
        assert "3,900" in d3["response"] or "maund" in d3["response"].lower() or "40 kg" in d3["response"].lower()

        # 4. Roman Urdu fertilizer dosage
        res4 = await client.post("/api/chat", json={
            "session_id": "test_bilingual_session_1",
            "message": "kitni urea chahiye?"
        })
        assert res4.status_code == 200
        d4 = res4.json()
        assert d4["agent_name"] == "agronomy"
        assert "15" in d4["response"]

        # 5. Roman Urdu government schemes via Finance Agent
        res5 = await client.post("/api/chat", json={
            "session_id": "test_bilingual_session_1",
            "message": "kisan card ke fayde kya hain?"
        })
        assert res5.status_code == 200
        d5 = res5.json()
        assert d5["agent_name"] == "finance"
        assert "150,000" in d5["response"] or "kisan card" in d5["response"].lower()


@pytest.mark.anyio
async def test_observability_endpoints():
    """Verify GET /api/observability/traces and /api/observability/summary."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/observability/traces?limit=10")
        assert res.status_code == 200
        data = res.json()
        assert "traces" in data
        assert "total_recorded" in data

        summary_res = await client.get("/api/observability/summary")
        assert summary_res.status_code == 200
        summary_data = summary_res.json()
        assert "total_requests" in summary_data
        assert "agent_distribution" in summary_data
        assert "language_distribution" in summary_data


@pytest.mark.anyio
async def test_tractor_price_and_subsidy_routing():
    """Verify 'what is a price of tracktor' routes to Finance Agent with commercial & subsidized rates."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/chat", json={
            "session_id": "test_tractor_session",
            "message": "what is a price of tracktor"
        })
        assert res.status_code == 200
        d = res.json()
        assert d["agent_name"] == "finance"
        assert "MF-240" in d["response"] or "Tractor" in d["response"]
        assert "1,000,000" in d["response"] or "Green Tractor" in d["response"]

