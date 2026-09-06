"""Weather Tool for Kisan Dost AI Agents and API.
Wraps the Open-Meteo WeatherService with robust error handling and structured output.
"""
from backend.app.models.schemas import WeatherReport, CurrentWeatherMetrics
from backend.app.services.weather_service import WeatherService


async def get_weather(district: str = "Multan") -> WeatherReport:
    """
    Retrieve live current weather, 7-day forecast, and agricultural weather warnings
    for a Pakistani city or district using Open-Meteo.
    
    Args:
        district: Name of Pakistani district or city (e.g. 'Multan', 'Faisalabad', 'Lahore').
        
    Returns:
        Structured WeatherReport model with location, coordinates, metrics, 7-day forecast, and warnings.
    """
    return await WeatherService.get_comprehensive_weather(district)
