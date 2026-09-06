import pytest
from unittest.mock import patch
import httpx
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.services.weather_service import WeatherService, LocationNotFoundError
from backend.app.tools.weather import get_weather
from backend.app.models.schemas import WeatherReport


@pytest.mark.anyio
async def test_weather_multan():
    """Verify Multan returns live weather telemetry, coordinates, and 7-day forecast."""
    report = await get_weather("Multan")
    assert isinstance(report, WeatherReport)
    assert "Multan" in report.location or "Multan" in report.district
    assert 28.0 <= report.latitude <= 32.0
    assert 70.0 <= report.longitude <= 73.0
    assert report.temperature is not None
    assert report.humidity >= 0.0
    assert report.wind_speed >= 0.0
    assert len(report.forecast) == 7
    assert isinstance(report.warnings, list)
    assert report.weather_condition != ""


@pytest.mark.anyio
async def test_weather_faisalabad():
    """Verify Faisalabad returns live weather telemetry and 7-day forecast."""
    report = await get_weather("Faisalabad")
    assert isinstance(report, WeatherReport)
    assert "Faisalabad" in report.location
    assert 30.5 <= report.latitude <= 32.5
    assert 72.0 <= report.longitude <= 74.0
    assert len(report.forecast) == 7
    assert report.temperature is not None


@pytest.mark.anyio
async def test_weather_lahore():
    """Verify Lahore returns live weather telemetry and 7-day forecast."""
    report = await get_weather("Lahore")
    assert isinstance(report, WeatherReport)
    assert "Lahore" in report.location
    assert 31.0 <= report.latitude <= 32.0
    assert 73.5 <= report.longitude <= 75.0
    assert len(report.forecast) == 7
    assert report.temperature is not None


@pytest.mark.anyio
async def test_invalid_location_returns_controlled_error():
    """Verify invalid locations return a controlled HTTP 404 error rather than crashing."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Query a completely fictional/invalid location
        res = await client.get("/api/weather/xyz_nonexistent_location_99999")
        assert res.status_code == 404
        data = res.json()
        assert "detail" in data
        assert "not found" in data["detail"].lower() or "could not be found" in data["detail"].lower()

        # Same for tool endpoint
        res_tool = await client.get("/api/tools/weather/xyz_nonexistent_location_99999")
        assert res_tool.status_code == 404


@pytest.mark.anyio
async def test_open_meteo_timeout_simulation_does_not_crash_fastapi():
    """
    Simulate Open-Meteo timeout:
    Verify that an API network timeout does NOT crash FastAPI and returns a resilient fallback report.
    """
    orig_get = httpx.AsyncClient.get

    async def mock_timeout_get(self, url, *args, **kwargs):
        if "open-meteo.com" in str(url):
            raise httpx.TimeoutException("Simulated Open-Meteo Network Timeout")
        return await orig_get(self, url, *args, **kwargs)

    with patch.object(httpx.AsyncClient, "get", new=mock_timeout_get):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.get("/api/weather/Multan")
            # FastAPI remains alive, returning 200 OK with resilient fallback data
            assert res.status_code == 200
            data = res.json()
            assert data["location"] == "Multan"
            assert "Fallback" in data["forecast_source"]
            assert len(data["forecast"]) == 7
            assert data["temperature"] is not None
            assert data["irrigation_advice"] is not None


@pytest.mark.anyio
async def test_open_meteo_500_failure_simulation():
    """
    Simulate Open-Meteo HTTP 500 server error:
    Verify application handles external API errors gracefully without crashing.
    """
    orig_get = httpx.AsyncClient.get

    async def mock_500_get(self, url, *args, **kwargs):
        if "open-meteo.com" in str(url):
            return httpx.Response(
                status_code=500,
                request=httpx.Request("GET", str(url))
            )
        return await orig_get(self, url, *args, **kwargs)

    with patch.object(httpx.AsyncClient, "get", new=mock_500_get):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.get("/api/weather/Lahore")
            assert res.status_code == 200
            data = res.json()
            assert data["location"] == "Lahore"
            assert "Fallback" in data["forecast_source"]
            assert len(data["forecast"]) == 7


@pytest.mark.anyio
async def test_current_weather_payload_attributes():
    """
    Verify current weather object exists and maps exact Open-Meteo fields:
    temperature_2m, apparent_temperature, relative_humidity_2m, precipitation, wind_speed_10m.
    """
    report = await get_weather("Faisalabad")
    assert report.current is not None
    assert hasattr(report.current, "temperature_2m")
    assert hasattr(report.current, "apparent_temperature")
    assert hasattr(report.current, "relative_humidity_2m")
    assert hasattr(report.current, "precipitation")
    assert hasattr(report.current, "wind_speed_10m")
    assert isinstance(report.current.temperature_2m, float)
    assert isinstance(report.current.apparent_temperature, float)
    assert isinstance(report.current.relative_humidity_2m, float)
    assert isinstance(report.current.precipitation, float)
    assert isinstance(report.current.wind_speed_10m, float)

