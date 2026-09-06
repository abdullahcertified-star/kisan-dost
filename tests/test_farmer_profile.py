import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.database import init_db


@pytest.fixture(autouse=True)
async def setup_db():
    await init_db()


@pytest.mark.anyio
async def test_create_and_get_farmer_profile():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Create Profile
        payload = {
            "name": "Chaudhry Tariq",
            "district": "Multan",
            "province": "Punjab",
            "land_acres": 12.5,
            "soil_type": "Loam (Mera)",
            "water_availability": "Canal + Tubewell",
            "current_crop": "Cotton",
            "preferred_language": "urdu",
        }
        res = await client.post("/api/farmer/profile", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert "id" in data
        assert data["name"] == "Chaudhry Tariq"
        assert data["district"] == "Multan"
        assert data["province"] == "Punjab"
        assert data["land_acres"] == 12.5
        assert data["water_availability"] == "Canal + Tubewell"
        assert data["preferred_language"] == "urdu"
        profile_id = data["id"]

        # 2. Retrieve Profile
        get_res = await client.get(f"/api/farmer/profile/{profile_id}")
        assert get_res.status_code == 200
        get_data = get_res.json()
        assert get_data["id"] == profile_id
        assert get_data["name"] == "Chaudhry Tariq"

        # 3. Update Profile
        update_payload = {
            "land_acres": 15.0,
            "current_crop": "Wheat",
            "water_availability": "Tubewell",
        }
        put_res = await client.put(f"/api/farmer/profile/{profile_id}", json=update_payload)
        assert put_res.status_code == 200
        put_data = put_res.json()
        assert put_data["land_acres"] == 15.0
        assert put_data["current_crop"] == "Wheat"
        assert put_data["water_availability"] == "Tubewell"
        assert put_data["name"] == "Chaudhry Tariq"  # preserved


@pytest.mark.anyio
async def test_farmer_profile_validation_failures():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Failure 1: land_acres <= 0
        res = await client.post("/api/farmer/profile", json={
            "name": "Malik Aslam",
            "district": "Faisalabad",
            "province": "Punjab",
            "land_acres": 0.0,  # Invalid
            "soil_type": "Clay Loam",
            "water_availability": "Canal",
            "current_crop": "Sugarcane",
            "preferred_language": "urdu",
        })
        assert res.status_code == 422

        # Failure 2: negative land_acres
        res_neg = await client.post("/api/farmer/profile", json={
            "name": "Malik Aslam",
            "district": "Faisalabad",
            "province": "Punjab",
            "land_acres": -5.0,  # Invalid
            "soil_type": "Clay Loam",
            "water_availability": "Canal",
            "current_crop": "Sugarcane",
            "preferred_language": "urdu",
        })
        assert res_neg.status_code == 422

        # Failure 3: Unsupported province
        res_prov = await client.post("/api/farmer/profile", json={
            "name": "Malik Aslam",
            "district": "London",
            "province": "California",  # Invalid province
            "land_acres": 10.0,
            "soil_type": "Loam",
            "water_availability": "Canal",
            "current_crop": "Wheat",
            "preferred_language": "urdu",
        })
        assert res_prov.status_code == 422

        # Failure 4: Unsupported water availability
        res_water = await client.post("/api/farmer/profile", json={
            "name": "Malik Aslam",
            "district": "Sargodha",
            "province": "Punjab",
            "land_acres": 10.0,
            "soil_type": "Loam",
            "water_availability": "Ocean Water",  # Invalid
            "current_crop": "Citrus",
            "preferred_language": "urdu",
        })
        assert res_water.status_code == 422

        # Failure 5: Unsupported language
        res_lang = await client.post("/api/farmer/profile", json={
            "name": "Malik Aslam",
            "district": "Sargodha",
            "province": "Punjab",
            "land_acres": 10.0,
            "soil_type": "Loam",
            "water_availability": "Canal",
            "current_crop": "Wheat",
            "preferred_language": "klingon",  # Invalid
        })
        assert res_lang.status_code == 422


@pytest.mark.anyio
async def test_get_nonexistent_profile_404():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/farmer/profile/non-existent-uuid-123")
        assert res.status_code == 404
