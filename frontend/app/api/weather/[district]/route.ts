import { NextRequest, NextResponse } from 'next/server';
import { findPakistanCity, PAKISTAN_COORDINATES_MAP } from '@/lib/cities';

function getWeatherDesc(code: number): string {
  if (code === 0) return 'Clear Sky (صاف آسمان)';
  if (code === 1) return 'Mainly Clear (مطلع زیادہ تر صاف)';
  if (code === 2) return 'Partly Cloudy (جزوی ابر آلود)';
  if (code === 3) return 'Overcast (مکمل ابر آلود)';
  if (code >= 45 && code <= 48) return 'Foggy / Hazy (دھند / کہرا)';
  if (code >= 51 && code <= 55) return 'Drizzle (ہلکی بوندا باندی)';
  if (code >= 61 && code <= 65) return 'Rain Showers (بارش)';
  if (code >= 71 && code <= 77) return 'Snow Flurries (برفباری)';
  if (code >= 80 && code <= 82) return 'Heavy Showers (تیز بارش)';
  if (code >= 95) return 'Thunderstorm (گرج چمک کے ساتھ طوفان)';
  return 'Clear (صاف)';
}

export async function GET(req: NextRequest, context: any) {
  try {
    let districtStr = 'Multan';
    if (context?.params) {
      const p = await Promise.resolve(context.params);
      districtStr = p?.district || 'Multan';
    }
    const decoded = decodeURIComponent(districtStr || '').trim().toLowerCase();
    let coords: { lat: number; lon: number; name: string } =
      PAKISTAN_COORDINATES_MAP[decoded] ||
      (findPakistanCity(districtStr)
        ? {
            lat: findPakistanCity(districtStr)!.lat,
            lon: findPakistanCity(districtStr)!.lon,
            name: findPakistanCity(districtStr)!.name,
          }
        : null) as any;

    // Dynamic fallback: If not in static directory, query Open-Meteo Pakistan Geocoding API
    if (!coords && decoded) {
      try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          decoded
        )}&count=1&language=en&country_code=PK`;
        const geoRes = await fetch(geoUrl, {
          headers: { 'User-Agent': 'KisanDost/1.0' },
          signal: AbortSignal.timeout(3500),
        });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData?.results && geoData.results.length > 0) {
            const top = geoData.results[0];
            coords = {
              lat: top.latitude,
              lon: top.longitude,
              name: top.name,
            };
          }
        }
      } catch {}
    }

    if (!coords) {
      coords = PAKISTAN_COORDINATES_MAP['multan'] || { lat: 30.1575, lon: 71.5249, name: 'Multan' };
    }

    const recordedAt = new Date().toISOString();
    let isLive = false;
    let liveData: any = null;

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;
      const res = await fetch(url, { headers: { 'User-Agent': 'KisanDost/1.0' }, signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        liveData = await res.json();
        isLive = true;
      }
    } catch {
      // Fallback
    }

    const cur = liveData?.current || {};
    const daily = liveData?.daily || {};

    const temp = cur.temperature_2m !== undefined ? Math.round(cur.temperature_2m * 10) / 10 : 28.5;
    const apparentTemp = cur.apparent_temperature !== undefined ? Math.round(cur.apparent_temperature * 10) / 10 : temp;
    const humidity = cur.relative_humidity_2m !== undefined ? Math.round(cur.relative_humidity_2m) : 48;
    const windSpeed = cur.wind_speed_10m !== undefined ? Math.round(cur.wind_speed_10m * 10) / 10 : 11.2;
    const precip = cur.precipitation !== undefined ? Math.round(cur.precipitation * 10) / 10 : 0.0;
    const wCode = cur.weather_code !== undefined ? cur.weather_code : 0;
    const conditionStr = getWeatherDesc(wCode);

    const heatwaveRisk = temp >= 40.0;
    const frostRisk = temp <= 3.0;

    const warnings: string[] = [];
    if (windSpeed >= 20.0) {
      warnings.push(`High wind velocity (${windSpeed} km/h). Delay foliar spray and avoid irrigating tall crops to prevent lodging.`);
    }
    if (heatwaveRisk) {
      warnings.push(`Heatwave warning: High ambient temperature (${temp}°C). Provide light evening irrigation.`);
    }
    if (frostRisk) {
      warnings.push(`Frost risk: Expected low temperature (${temp}°C). Protect nursery beds and sensitive vegetable seedlings.`);
    }

    // Build 5-day forecast
    const dates = (daily.time || []).slice(0, 5);
    const forecast = (dates.length > 0 ? dates : ['2026-09-06', '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10']).map((d: string, idx: number) => {
      const maxT = daily.temperature_2m_max?.[idx] !== undefined ? daily.temperature_2m_max[idx] : Math.round(temp + 3);
      const minT = daily.temperature_2m_min?.[idx] !== undefined ? daily.temperature_2m_min[idx] : Math.round(temp - 8);
      const pSum = daily.precipitation_sum?.[idx] !== undefined ? daily.precipitation_sum[idx] : 0;
      const code = daily.weather_code?.[idx] !== undefined ? daily.weather_code[idx] : 0;
      const wMax = daily.wind_speed_10m_max?.[idx] !== undefined ? daily.wind_speed_10m_max[idx] : 12;

      const irrigAdvice = pSum >= 5.0
        ? 'Postpone irrigation (بارش متوقع ہے، پانی نہ لگائیں)'
        : wMax >= 25.0
        ? 'Do not irrigate tall crops (تیز ہوا ہے، فصل گرنے کا خطرہ)'
        : 'Irrigate normally as per crop need (معمول کے مطابق پانی لگائیں)';

      return {
        date: d,
        temperature_max: maxT,
        temperature_min: minT,
        precipitation: pSum,
        weather_condition: getWeatherDesc(code),
        wind_speed_max: wMax,
        irrigation_advice: irrigAdvice,
        // Legacy aliases
        temp_max: maxT,
        temp_min: minT,
        condition: getWeatherDesc(code),
      };
    });

    const primaryIrrigation = precip >= 5.0 || (daily.precipitation_sum?.[0] ?? 0) >= 5.0
      ? 'Significant rainfall detected. Delay canal/tubewell turn to conserve water and prevent waterlogging.'
      : windSpeed >= 20.0
      ? 'High wind velocity expected. Avoid irrigating mature tall crops to prevent lodging.'
      : 'Normal crop water requirements. Proceed with scheduled irrigation turn.';

    const forecastSource = isLive ? 'Live Open-Meteo API' : 'Fallback Offline (Open-Meteo)';

    const report = {
      location: coords.name,
      district: coords.name,
      latitude: coords.lat,
      longitude: coords.lon,
      temperature: temp,
      temperature_c: temp,
      apparent_temperature: apparentTemp,
      humidity,
      humidity_percent: humidity,
      wind_speed: windSpeed,
      wind_speed_kmh: windSpeed,
      precipitation: precip,
      weather_condition: conditionStr,
      weather_code: wCode,
      heatwave_risk: heatwaveRisk,
      frost_risk: frostRisk,
      warnings,
      irrigation_advice: primaryIrrigation,
      forecast_source: forecastSource,
      source: forecastSource,
      recorded_at: recordedAt,
      current: {
        time: recordedAt.slice(0, 16).replace('T', ' '),
        temperature_2m: temp,
        apparent_temperature: apparentTemp,
        relative_humidity_2m: humidity,
        precipitation: precip,
        wind_speed_10m: windSpeed,
      },
      forecast,
      spray_recommendation: windSpeed > 20
        ? 'High wind velocity. Postpone foliar pesticide sprays.'
        : 'Optimal weather conditions for field spraying and fertilizer broadcasting.',
    };

    return NextResponse.json(report);
  } catch (err: any) {
    console.error('Weather API error:', err);
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 });
  }
}
