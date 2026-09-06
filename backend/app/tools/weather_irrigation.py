"""Weather & Irrigation Tool.
Gives real-time weather forecasts and crop stage irrigation advice via Open-Meteo.
"""
from backend.app.models.schemas import WeatherAdvisoryReport
from backend.app.services.weather_service import WeatherService


async def run_weather_irrigation(district: str) -> WeatherAdvisoryReport:
    data = await WeatherService.get_forecast(district)
    return WeatherAdvisoryReport(
        district=data["district"],
        temperature_c=data["temperature_c"],
        humidity_percent=data["humidity_percent"],
        wind_speed_kmh=data["wind_speed_kmh"],
        next_3_days_precipitation_mm=data["next_3_days_precipitation_mm"],
        heatwave_risk=data["heatwave_risk"],
        frost_risk=data["frost_risk"],
        irrigation_advice=data["irrigation_advice"],
        forecast_source=data["forecast_source"],
    )
