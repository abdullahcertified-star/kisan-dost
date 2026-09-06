'use client';

import React, { useEffect, useState } from 'react';
import { fetchWeather } from '@/lib/api';

interface WeatherWidgetProps {
  district: string;
}

export default function WeatherWidget({ district }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetchWeather(district)
      .then((data) => {
        setWeather(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Weather load error:', err);
        setLoading(false);
      });
  }, [district]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm animate-pulse flex items-center justify-between">
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
      </div>
    );
  }

  if (!weather) return null;

  const tempVal =
    weather.temperature !== undefined
      ? weather.temperature
      : weather.temperature_c !== undefined
      ? weather.temperature_c
      : weather.current?.temperature_2m ?? '--';

  const humidityVal =
    weather.humidity !== undefined
      ? weather.humidity
      : weather.humidity_percent !== undefined
      ? weather.humidity_percent
      : weather.current?.relative_humidity_2m ?? '--';

  const windVal =
    weather.wind_speed !== undefined
      ? weather.wind_speed
      : weather.wind_speed_kmh !== undefined
      ? weather.wind_speed_kmh
      : weather.current?.wind_speed_10m ?? '--';

  const rainVal =
    weather.next_3_days_precipitation_mm !== undefined
      ? weather.next_3_days_precipitation_mm
      : Array.isArray(weather.forecast) && weather.forecast.length > 0
      ? Math.round(weather.forecast.slice(0, 3).reduce((acc: number, f: any) => acc + (f.precipitation || 0), 0) * 10) / 10
      : (weather.precipitation ?? 0);

  return (
    <div className="bg-gradient-to-r from-sky-900 to-teal-900 text-white rounded-xl p-4 shadow-md mb-6 border border-sky-700/50">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-700/60 pb-2.5 mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🌦️</span>
          <div>
            <h4 className="text-base font-bold flex items-center space-x-1">
              <span>{weather.district || district} Weather Forecast</span>
              <span className="text-xs text-sky-200 font-normal">({weather.forecast_source || 'Live Open-Meteo API'})</span>
            </h4>
            <p className="text-xs text-sky-200">
              Open-Meteo Real-Time Agro-Meteorology {weather.weather_condition ? `• ${weather.weather_condition}` : ''}
            </p>
          </div>
        </div>

        {/* Risk Badges */}
        <div className="flex items-center space-x-2">
          {weather.heatwave_risk && (
            <span className="bg-amber-500/90 text-slate-900 text-xs font-bold px-2.5 py-0.5 rounded-full animate-bounce">
              ⚠️ Heatwave Risk
            </span>
          )}
          {weather.frost_risk && (
            <span className="bg-blue-400 text-slate-900 text-xs font-bold px-2.5 py-0.5 rounded-full animate-bounce">
              ❄️ Frost Warning
            </span>
          )}
          {!weather.heatwave_risk && !weather.frost_risk && (
            <span className="bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-medium">
              ✅ Favorable Weather
            </span>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-3">
        <div className="bg-sky-950/40 p-2 rounded-lg border border-sky-600/30">
          <span className="text-xs text-sky-300 block">Temperature (درجہ حرارت)</span>
          <span className="text-lg font-extrabold">{tempVal}°C</span>
        </div>
        <div className="bg-sky-950/40 p-2 rounded-lg border border-sky-600/30">
          <span className="text-xs text-sky-300 block">Humidity (نمی)</span>
          <span className="text-lg font-extrabold">{humidityVal}%</span>
        </div>
        <div className="bg-sky-950/40 p-2 rounded-lg border border-sky-600/30">
          <span className="text-xs text-sky-300 block">Wind (ہوا)</span>
          <span className="text-lg font-extrabold">{windVal} km/h</span>
        </div>
        <div className="bg-sky-950/40 p-2 rounded-lg border border-sky-600/30">
          <span className="text-xs text-sky-300 block">3-Day Rain (متوقع بارش)</span>
          <span className="text-lg font-extrabold text-amber-300">{rainVal} mm</span>
        </div>
      </div>

      {/* Actionable Irrigation Advice */}
      <div className="bg-sky-950/60 p-3 rounded-lg border border-sky-500/30 text-xs leading-relaxed flex items-start space-x-2">
        <span className="text-base">💧</span>
        <div>
          <span className="font-bold text-sky-300 block mb-0.5">Irrigation Guidance (آبپاشی کا مشورہ):</span>
          <p className="text-sky-100">{weather.irrigation_advice || 'Optimal weather conditions. Proceed with standard irrigation schedule.'}</p>
        </div>
      </div>
    </div>
  );
}
