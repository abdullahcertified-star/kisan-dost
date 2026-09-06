import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from backend.app.config import settings
from backend.app.data.datasets import DISTRICT_COORDINATES
from backend.app.models.schemas import WeatherReport, DailyForecastItem, CurrentWeatherMetrics


WMO_WEATHER_CODES = {
    0: "Clear sky (صاف آسمان)",
    1: "Mainly clear (مطلع زیادہ تر صاف)",
    2: "Partly cloudy (جزوی ابر آلود)",
    3: "Overcast (مکمل ابر آلود)",
    45: "Foggy (دھند)",
    48: "Depositing rime fog (شدید دھند)",
    51: "Light drizzle (ہلکی بوندا باندی)",
    53: "Moderate drizzle (درمیانی بوندا باندی)",
    55: "Dense drizzle (تیز بوندا باندی)",
    61: "Slight rain (ہلکی بارش)",
    63: "Moderate rain (درمیانی بارش)",
    65: "Heavy rain (تیز موسلادھار بارش)",
    71: "Slight snow (ہلکی برف باری)",
    73: "Moderate snow (درمیانی برف باری)",
    75: "Heavy snow (شدید برف باری)",
    80: "Rain showers (بارش کی پھوار)",
    81: "Moderate rain showers (تیز پھوار)",
    82: "Violent rain showers (شدید بارش کی پھوار)",
    95: "Thunderstorm (گرج چمک کے ساتھ طوفان)",
    96: "Thunderstorm with slight hail (طوفان مع ژالہ باری)",
    99: "Thunderstorm with heavy hail (شدید طوفان مع ژالہ باری)",
}


class LocationNotFoundError(ValueError):
    """Raised when a specified city or district cannot be resolved."""
    pass


def get_weather_desc(code: int) -> str:
    return WMO_WEATHER_CODES.get(code, "Clear / Variable (معتدل موسم)")


class WeatherService:
    @staticmethod
    async def get_coordinates(district: str) -> Dict[str, Any]:
        """
        Resolve Pakistani district/city to latitude/longitude using Open-Meteo Geocoding.
        Queries Open-Meteo Geocoding API live first for accurate real-time coordinates.
        Falls back to curated Pakistani coordinates only if network/API is completely offline.
        Raises LocationNotFoundError if the location does not exist.
        """
        cleaned = district.strip().lower()
        query_name = district.strip()

        # 1. Query Open-Meteo Geocoding API live
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(
                    settings.GEOCODING_API_URL,
                    params={"name": query_name, "count": 1, "country": "PK", "language": "en"}
                )
                if res.status_code == 200:
                    data = res.json()
                    results = data.get("results")
                    if results and len(results) > 0:
                        first = results[0]
                        return {
                            "lat": round(float(first["latitude"]), 4),
                            "lon": round(float(first["longitude"]), 4),
                            "name": first.get("name", query_name.title()),
                            "province": first.get("admin1", "Pakistan")
                        }
                    else:
                        # Geocoding succeeded, but 0 matches found in Pakistan
                        raise LocationNotFoundError(
                            f"Location '{district}' could not be found. Please check spelling or enter a valid Pakistani district."
                        )
                elif res.status_code == 404:
                    raise LocationNotFoundError(
                        f"Location '{district}' could not be found."
                    )
                else:
                    res.raise_for_status()
        except LocationNotFoundError:
            raise
        except (httpx.TimeoutException, httpx.HTTPError, Exception) as e:
            # Fallback only on genuine network failure/timeout if pre-indexed
            if cleaned in DISTRICT_COORDINATES:
                match = DISTRICT_COORDINATES[cleaned]
                return {
                    "lat": match["lat"],
                    "lon": match["lon"],
                    "name": query_name.title(),
                    "province": match.get("province", "Pakistan")
                }
            raise LocationNotFoundError(
                f"Location '{district}' could not be resolved due to network timeout. Please try again."
            )

        raise LocationNotFoundError(f"Location '{district}' could not be resolved.")

    @staticmethod
    async def get_comprehensive_weather(district: str) -> WeatherReport:
        """
        Retrieve live current weather and 7-day forecast from Open-Meteo API.
        Extracts exact current hour telemetry and 7-day daily forecast.
        Generates agricultural weather warnings and irrigation schedule.
        Never crashes; returns resilient local fallback on network/API failure.
        """
        coords = await WeatherService.get_coordinates(district)
        lat = coords["lat"]
        lon = coords["lon"]
        location_name = coords["name"]

        temp: Optional[float] = None
        apparent_temp: Optional[float] = None
        humidity: Optional[float] = None
        wind: Optional[float] = None
        precip: Optional[float] = None
        weather_code: Optional[int] = None
        forecast_items: List[DailyForecastItem] = []
        warnings: List[str] = []
        source = "Live Open-Meteo API"
        recorded_at: Optional[str] = None
        is_live = False

        try:
            params = {
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
                "hourly": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max",
                "timezone": "Asia/Karachi",
                "forecast_days": 7,
            }

            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(settings.WEATHER_API_URL, params=params)
                if res.status_code == 200:
                    data = res.json()
                    cur = data.get("current", {})
                    hourly = data.get("hourly", {})
                    daily = data.get("daily", {})

                    recorded_at = cur.get("time")

                    # Extract live current hour metrics directly
                    if "temperature_2m" in cur and cur["temperature_2m"] is not None:
                        temp = round(float(cur["temperature_2m"]), 1)
                    if "apparent_temperature" in cur and cur["apparent_temperature"] is not None:
                        apparent_temp = round(float(cur["apparent_temperature"]), 1)
                    else:
                        apparent_temp = temp
                    if "relative_humidity_2m" in cur and cur["relative_humidity_2m"] is not None:
                        humidity = round(float(cur["relative_humidity_2m"]), 1)
                    if "wind_speed_10m" in cur and cur["wind_speed_10m"] is not None:
                        wind = round(float(cur["wind_speed_10m"]), 1)
                    if "precipitation" in cur and cur["precipitation"] is not None:
                        precip = round(float(cur["precipitation"]), 1)
                    if "weather_code" in cur and cur["weather_code"] is not None:
                        weather_code = int(cur["weather_code"])

                    # If any metric was absent from current, map dynamically from exact current hour in hourly series
                    h_times = hourly.get("time", [])
                    target_time = recorded_at
                    h_idx = -1
                    if target_time and target_time in h_times:
                        h_idx = h_times.index(target_time)
                    elif len(h_times) > 0:
                        now_hour = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:00")
                        if now_hour in h_times:
                            h_idx = h_times.index(now_hour)

                    if h_idx >= 0:
                        if temp is None and "temperature_2m" in hourly and h_idx < len(hourly["temperature_2m"]):
                            temp = round(float(hourly["temperature_2m"][h_idx]), 1)
                        if apparent_temp is None and "apparent_temperature" in hourly and h_idx < len(hourly["apparent_temperature"]):
                            apparent_temp = round(float(hourly["apparent_temperature"][h_idx]), 1)
                        if humidity is None and "relative_humidity_2m" in hourly and h_idx < len(hourly["relative_humidity_2m"]):
                            humidity = round(float(hourly["relative_humidity_2m"][h_idx]), 1)
                        if wind is None and "wind_speed_10m" in hourly and h_idx < len(hourly["wind_speed_10m"]):
                            wind = round(float(hourly["wind_speed_10m"][h_idx]), 1)
                        if precip is None and "precipitation" in hourly and h_idx < len(hourly["precipitation"]):
                            precip = round(float(hourly["precipitation"][h_idx]), 1)
                        if weather_code is None and "weather_code" in hourly and h_idx < len(hourly["weather_code"]):
                            weather_code = int(hourly["weather_code"][h_idx])

                    # Extract live 7-day daily forecast items
                    time_list = daily.get("time", [])
                    max_temps = daily.get("temperature_2m_max", [])
                    min_temps = daily.get("temperature_2m_min", [])
                    precips = daily.get("precipitation_sum", [])
                    codes = daily.get("weather_code", [])
                    winds = daily.get("wind_speed_10m_max", [])

                    for i in range(len(time_list)):
                        d_date = time_list[i]
                        d_max = round(float(max_temps[i]), 1) if i < len(max_temps) else (temp + 2.0 if temp is not None else 32.0)
                        d_min = round(float(min_temps[i]), 1) if i < len(min_temps) else (temp - 6.0 if temp is not None else 20.0)
                        d_precip = round(float(precips[i]), 1) if i < len(precips) else 0.0
                        d_code = int(codes[i]) if i < len(codes) else (weather_code or 0)
                        d_wind = round(float(winds[i]), 1) if i < len(winds) else 10.0

                        # Daily irrigation advice
                        if d_precip >= 5.0:
                            d_irrig = "Postpone irrigation (بارش متوقع ہے، پانی نہ لگائیں)"
                        elif d_wind >= 25.0:
                            d_irrig = "Do not irrigate tall crops (تیز ہوا ہے، فصل گرنے کا خطرہ)"
                        else:
                            d_irrig = "Irrigate normally as per crop need (معمول کے مطابق پانی لگائیں)"

                        forecast_items.append(
                            DailyForecastItem(
                                date=d_date,
                                temperature_max=d_max,
                                temperature_min=d_min,
                                precipitation=d_precip,
                                weather_condition=get_weather_desc(d_code),
                                wind_speed_max=d_wind,
                                irrigation_advice=d_irrig,
                            )
                        )

                    is_live = True
                    source = "Live Open-Meteo API"
                else:
                    source = f"Fallback Offline (Open-Meteo HTTP {res.status_code})"
        except Exception as e:
            source = f"Fallback Offline ({type(e).__name__})"

        # Emergency offline fallback ONLY if live API was completely unreachable
        if not is_live:
            if temp is None:
                temp = 28.0
            if humidity is None:
                humidity = 45.0
            if wind is None:
                wind = 10.0
            if precip is None:
                precip = 0.0
            if weather_code is None:
                weather_code = 0
            if not forecast_items:
                for day_offset in range(7):
                    forecast_items.append(
                        DailyForecastItem(
                            date=f"Day +{day_offset}",
                            temperature_max=32.0,
                            temperature_min=20.0,
                            precipitation=0.0,
                            weather_condition="Clear sky (صاف آسمان)",
                            wind_speed_max=12.0,
                            irrigation_advice="Irrigate normally as per crop need (معمول کے مطابق پانی لگائیں)",
                        )
                    )

        # Calculate 7-day totals & maximums for Agricultural Risk Assessment
        total_7day_rain = sum(f.precipitation for f in forecast_items)
        max_week_temp = max((f.temperature_max for f in forecast_items), default=temp if temp is not None else 32.0)
        min_week_temp = min((f.temperature_min for f in forecast_items), default=temp if temp is not None else 20.0)
        max_week_wind = max((f.wind_speed_max for f in forecast_items), default=wind if wind is not None else 10.0)

        heatwave_risk = max_week_temp >= 40.0 or (temp is not None and temp >= 40.0)
        frost_risk = min_week_temp <= 3.5 or (temp is not None and temp <= 3.5)

        # Agricultural Warnings Evaluation
        if heatwave_risk:
            warnings.append(
                f"🚨 **شدید گرمی کی لہر (Heatwave Alert)**: درجہ حرارت {max_week_temp:.1f}°C تک جانے کا امکان ہے۔ "
                "کپاس اور سبزیوں میں پھول گرنے سے بچانے کے لیے شام کے وقت ہلکا پانی لگائیں۔"
            )
        if frost_risk:
            warnings.append(
                f"❄️ **کورے کا انتباہ (Frost Warning)**: رات کا درجہ حرارت {min_week_temp:.1f}°C تک گر سکتا ہے۔ "
                "گندم اور آلو کی فصل کو کورے سے بچانے کے لیے مغرب کے وقت ہلکا پانی دیں۔"
            )
        if total_7day_rain >= 20.0:
            warnings.append(
                f"🌧️ **موسلادھار بارش کا الرٹ (Heavy Rain Warning)**: آئندہ 7 دنوں میں مجموعی طور پر {total_7day_rain:.1f} mm بارش متوقع ہے۔ "
                "کھالے اور نالیاں صاف رکھیں تاکہ پانی کھڑا نہ ہو اور گندم کی کنگی یا جڑوں کے گلنے کا خطرہ نہ ہو۔"
            )
        elif total_7day_rain >= 8.0 or (precip is not None and precip > 0.0):
            warnings.append(
                f"🌦️ **بارش کی پیشگوئی (Rain Advisory)**: آئندہ دنوں میں {total_7day_rain:.1f} mm بارش کا امکان ہے۔ "
                "نہری یا ٹیوب ویل کا پانی لگانے میں 48 گھنٹے کی تاخیر کریں۔"
            )
        if max_week_wind >= 28.0 or (wind is not None and wind >= 28.0):
            warnings.append(
                f"💨 **تیز ہوا اور آندھی (High Wind Alert)**: ہوا کی رفتار {max_week_wind:.1f} km/h تک پہنچ سکتی ہے۔ "
                "قد آور فصلوں (گندم، کماد، مکئی) کو تیز ہوا میں پانی ہرگز نہ لگائیں ورنہ فصل گر (Lodge) جائے گی۔"
            )
        if humidity is not None and temp is not None and humidity >= 70.0 and temp >= 28.0:
            warnings.append(
                f"🔬 **کیڑوں اور بیماریوں کا خطرہ (Pest Risk)**: ہوا میں زیادہ نمی ({humidity:.0f}%) اور گرمی ({temp:.1f}°C) کی وجہ سے سفید مکھی (Whitefly) "
                "اور فنگس کے پھیلاؤ کا خطرہ ہے۔ فصل کا روزانہ معائنہ کریں۔"
            )

        # Primary actionable irrigation advice
        if (precip is not None and precip >= 5.0) or total_7day_rain >= 15.0:
            irrigation_advice = "Heavy rainfall detected or expected. POSTPONE canal and tubewell irrigation. Ensure field drainage channels are clear."
        elif (precip is not None and precip > 0.0) or total_7day_rain >= 8.0:
            irrigation_advice = "Rainfall expected. Delay canal/tubewell irrigation by 24-48 hours to conserve water."
        elif (wind is not None and wind >= 25.0) or (max_week_wind >= 25.0 and any(f.wind_speed_max >= 25.0 for f in forecast_items[:2])):
            irrigation_advice = "High wind expected in next 48h. Avoid irrigating tall crops (wheat, maize, sugarcane) to prevent lodging (gandham girna)."
        elif heatwave_risk:
            irrigation_advice = "Heatwave conditions detected. Apply light evening irrigation to reduce soil temperature and maintain moisture."
        elif frost_risk:
            irrigation_advice = "Frost risk tonight. Apply light dusk irrigation to create a protective thermal vapor layer."
        else:
            irrigation_advice = "Optimal weather conditions. Proceed with standard irrigation schedule according to vegetative or grain development stage."

        final_temp = temp if temp is not None else 28.0
        final_apparent_temp = apparent_temp if apparent_temp is not None else final_temp
        final_humidity = humidity if humidity is not None else 45.0
        final_wind = wind if wind is not None else 10.0
        final_precip = precip if precip is not None else 0.0
        final_time = recorded_at or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M")

        current_metrics = CurrentWeatherMetrics(
            time=final_time,
            temperature_2m=final_temp,
            apparent_temperature=final_apparent_temp,
            relative_humidity_2m=final_humidity,
            precipitation=final_precip,
            wind_speed_10m=final_wind,
        )

        next_3_days_rain = sum(f.precipitation for f in forecast_items[:3]) if forecast_items else final_precip

        return WeatherReport(
            location=location_name,
            district=location_name,
            latitude=lat,
            longitude=lon,
            temperature=final_temp,
            temperature_c=final_temp,
            apparent_temperature=final_apparent_temp,
            humidity=final_humidity,
            humidity_percent=final_humidity,
            wind_speed=final_wind,
            wind_speed_kmh=final_wind,
            precipitation=final_precip,
            next_3_days_precipitation_mm=round(next_3_days_rain, 1),
            weather_condition=get_weather_desc(weather_code if weather_code is not None else 0),
            weather_code=weather_code if weather_code is not None else 0,
            current=current_metrics,
            forecast=forecast_items,
            warnings=warnings,
            irrigation_advice=irrigation_advice,
            heatwave_risk=heatwave_risk,
            frost_risk=frost_risk,
            forecast_source=source,
            recorded_at=recorded_at,
        )

    @staticmethod
    async def get_forecast(district: str) -> Dict[str, Any]:
        """Backward-compatible helper returning legacy summary dictionary."""
        report = await WeatherService.get_comprehensive_weather(district)
        next_3_days_rain = sum(f.precipitation for f in report.forecast[:3])
        return {
            "district": report.district,
            "latitude": report.latitude,
            "longitude": report.longitude,
            "temperature_c": report.temperature,
            "humidity_percent": report.humidity,
            "wind_speed_kmh": report.wind_speed,
            "next_3_days_precipitation_mm": round(next_3_days_rain, 1),
            "heatwave_risk": report.heatwave_risk,
            "frost_risk": report.frost_risk,
            "irrigation_advice": report.irrigation_advice,
            "forecast_source": report.forecast_source,
        }
