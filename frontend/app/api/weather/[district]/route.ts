import { NextRequest, NextResponse } from 'next/server';

const DISTRICT_COORDS: Record<string, { lat: number; lon: number; name: string }> = {
  multan: { lat: 30.1575, lon: 71.5249, name: 'Multan' },
  lahore: { lat: 31.5204, lon: 74.3587, name: 'Lahore' },
  faisalabad: { lat: 31.4504, lon: 73.1350, name: 'Faisalabad' },
  bahawalpur: { lat: 29.3544, lon: 71.6911, name: 'Bahawalpur' },
  rawalpindi: { lat: 33.5651, lon: 73.0169, name: 'Rawalpindi' },
  gujranwala: { lat: 32.1877, lon: 74.1945, name: 'Gujranwala' },
  sargodha: { lat: 32.0836, lon: 72.6711, name: 'Sargodha' },
  sahiwal: { lat: 30.6682, lon: 73.1114, name: 'Sahiwal' },
  khanewal: { lat: 30.3017, lon: 71.9321, name: 'Khanewal' },
  vehari: { lat: 30.0419, lon: 72.3528, name: 'Vehari' },
  lodhran: { lat: 29.5405, lon: 71.6336, name: 'Lodhran' },
  jhang: { lat: 31.2781, lon: 72.3317, name: 'Jhang' },
  okara: { lat: 30.8081, lon: 73.4458, name: 'Okara' },
  pakpattan: { lat: 30.3410, lon: 73.3866, name: 'Pakpattan' },
  sheikhupura: { lat: 31.7131, lon: 73.9783, name: 'Sheikhupura' },
  kasur: { lat: 31.1179, lon: 74.4408, name: 'Kasur' },
  attock: { lat: 33.7667, lon: 72.3667, name: 'Attock' },
  chakwal: { lat: 32.9328, lon: 72.8631, name: 'Chakwal' },
  mianwali: { lat: 32.5839, lon: 71.5370, name: 'Mianwali' },
  bhakkar: { lat: 31.6253, lon: 71.0657, name: 'Bhakkar' },
  layyah: { lat: 30.9613, lon: 70.9390, name: 'Layyah' },
  muzaffargarh: { lat: 30.0744, lon: 71.1847, name: 'Muzaffargarh' },
  'd.g. khan': { lat: 30.0561, lon: 70.6348, name: 'D.G. Khan' },
  rajanpur: { lat: 29.1035, lon: 70.3250, name: 'Rajanpur' },
  'rahim yar khan': { lat: 28.4195, lon: 70.3024, name: 'Rahim Yar Khan' },
  karachi: { lat: 24.8607, lon: 67.0011, name: 'Karachi' },
  hyderabad: { lat: 25.3960, lon: 68.3578, name: 'Hyderabad' },
  sukkur: { lat: 27.7052, lon: 68.8574, name: 'Sukkur' },
  peshawar: { lat: 34.0151, lon: 71.5249, name: 'Peshawar' },
  quetta: { lat: 30.1798, lon: 66.9750, name: 'Quetta' },
  islamabad: { lat: 33.6844, lon: 73.0479, name: 'Islamabad' },
};

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
    const coords = DISTRICT_COORDS[decoded] || DISTRICT_COORDS['multan'];

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
