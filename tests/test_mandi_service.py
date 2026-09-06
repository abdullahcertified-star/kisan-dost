"""Unit and API Integration Tests for Phase 5 Mandi Price Service."""
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.services.mandi_service import MandiService


def test_mandi_service_all_records():
    """Verify MandiService returns all records when no filters provided."""
    res = MandiService.get_prices()
    assert res.total_records > 0
    assert res.data_notice == "Reference price / last updated"
    assert "AMIS" in res.disclaimer
    # Verify records have all required fields
    for r in res.rates:
        assert r.crop
        assert r.mandi_name
        assert r.min_price_pkr > 0
        assert r.max_price_pkr >= r.min_price_pkr
        assert r.avg_price_pkr >= r.min_price_pkr
        assert r.price_type == "Reference price / last updated"
        assert r.last_updated == "2026-09-05"


def test_mandi_service_filter_by_crop():
    """Verify crop filtering for Wheat, Cotton, Rice, etc."""
    res_wheat = MandiService.get_prices(crop="Wheat")
    assert res_wheat.total_records > 0
    for r in res_wheat.rates:
        assert r.crop.lower() == "wheat"

    res_cotton = MandiService.get_prices(crop="Cotton")
    assert res_cotton.total_records > 0
    for r in res_cotton.rates:
        assert r.crop.lower() == "cotton"


def test_mandi_service_filter_by_market():
    """Verify market filtering for Multan, Faisalabad, Lahore."""
    for market in ["Multan", "Faisalabad", "Lahore"]:
        res = MandiService.get_prices(market=market)
        assert res.total_records > 0
        for r in res.rates:
            assert market.lower() in r.mandi_name.lower()


def test_mandi_service_combined_filter():
    """Verify filtering by both crop and market."""
    res = MandiService.get_prices(crop="Wheat", market="Multan")
    assert res.total_records == 1
    r = res.rates[0]
    assert r.crop == "Wheat"
    assert r.mandi_name == "Multan"
    assert r.avg_price_pkr == 3950
    assert r.price_type == "Reference price / last updated"


from fastapi.testclient import TestClient

def test_api_get_market_prices():
    """Verify GET /api/market/prices endpoint returns valid JSON with reference label."""
    client = TestClient(app)
    resp = client.get("/api/market/prices")
    assert resp.status_code == 200
    data = resp.json()
    assert data["data_notice"] == "Reference price / last updated"
    assert "rates" in data
    assert len(data["rates"]) > 0

    # Filter query
    resp_filtered = client.get("/api/market/prices?crop=Wheat&market=Faisalabad")
    assert resp_filtered.status_code == 200
    filtered_data = resp_filtered.json()
    assert filtered_data["total_records"] >= 1
    assert filtered_data["rates"][0]["mandi_name"] == "Faisalabad"

def test_jhang_market_dataset():
    """Verify Jhang dataset exists for Wheat, Cotton, Rice, Maize, Potato, Chickpea."""
    from backend.app.services.mandi_service import MandiService
    res = MandiService.get_prices(market="Jhang")
    assert res.total_records >= 6
    crops_in_jhang = {r.crop for r in res.rates}
    assert "Wheat" in crops_in_jhang
    assert "Cotton" in crops_in_jhang
    assert "Rice" in crops_in_jhang
    assert "Maize" in crops_in_jhang
    assert "Potato" in crops_in_jhang
    assert "Chickpea" in crops_in_jhang
    for r in res.rates:
        assert r.mandi_name == "Jhang"
        assert r.province == "Punjab"

def test_sialkot_and_sukkur_datasets():
    """Verify Sialkot and Sukkur datasets are fully populated with all major crops."""
    from backend.app.services.mandi_service import MandiService
    
    # Sialkot (Punjab)
    res_sialkot = MandiService.get_prices(market="Sialkot")
    assert res_sialkot.total_records >= 7
    sialkot_crops = {r.crop for r in res_sialkot.rates}
    assert {"Wheat", "Cotton", "Rice", "Maize", "Mustard", "Potato", "Chickpea"}.issubset(sialkot_crops)
    for r in res_sialkot.rates:
        assert r.mandi_name == "Sialkot"
        assert r.province == "Punjab"

    # Sukkur (Sindh)
    res_sukkur = MandiService.get_prices(market="Sukkur")
    assert res_sukkur.total_records >= 7
    sukkur_crops = {r.crop for r in res_sukkur.rates}
    assert {"Wheat", "Cotton", "Rice", "Maize", "Mustard", "Potato", "Chickpea"}.issubset(sukkur_crops)
    for r in res_sukkur.rates:
        assert r.mandi_name == "Sukkur"
        assert r.province == "Sindh"


