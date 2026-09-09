'use client';

import React, { useState, useEffect } from 'react';
import SaaSLayout from '@/components/SaaSLayout';
import Link from 'next/link';
import { fetchWeather } from '@/lib/api';
import { WeatherReport } from '@/types';
import { loadSavedItem, saveItem } from '@/lib/storage';

import { PAKISTAN_CITIES, findPakistanCity } from '@/lib/cities';

const PROVINCES = [
  'All Pakistan',
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad',
  'Azad Kashmir',
  'Gilgit-Baltistan',
] as const;

export default function WeatherPage() {
  const [selectedCity, setSelectedCity] = useState<string>('Multan');
  const [searchInput, setSearchInput] = useState<string>('Multan');
  const [selectedProvince, setSelectedProvince] = useState<string>('All Pakistan');
  const [weather, setWeather] = useState<WeatherReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadWeather = (city: string) => {
    setLoading(true);
    setError(null);
    fetchWeather(city)
      .then((data: WeatherReport) => {
        setWeather(data);
        setSelectedCity(city);
        setSearchInput(city);
        saveItem('kd_weather_city', city);
      })
      .catch((err: any) => {
        setError(err.message || 'Failed to load weather forecast');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    const initialCity = loadSavedItem<string>('kd_weather_city', 'Multan');
    setSelectedCity(initialCity);
    setSearchInput(initialCity);
    loadWeather(initialCity);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const match = findPakistanCity(searchInput.trim());
      const targetName = match ? match.name : searchInput.trim();
      loadWeather(targetName);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const filteredCities = selectedProvince === 'All Pakistan'
    ? PAKISTAN_CITIES.filter((c) => c.isPopular)
    : PAKISTAN_CITIES.filter((c) => c.province === selectedProvince);

  return (
    <SaaSLayout
      title="Agro-Weather Radar"
      subtitle="Live Open-Meteo meteorological telemetry and agricultural irrigation advisory"
      badge="Live Radar"
    >
        {/* Header & City Selector Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <Link
              href="/"
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center space-x-1 mb-1"
            >
              <span>← Back to Agronomy Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center space-x-2">
              <span>🌦️ Agro-Weather & 5-Day Forecast</span>
              <span className="text-sm font-normal text-slate-500 hidden sm:inline">(موسمی پیشگوئی)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Live Open-Meteo meteorological radar and agricultural irrigation advice for Pakistani farming districts.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
            <input
              type="text"
              list="pakistan-cities-list"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search any Pakistani city (e.g. Quetta, Sukkur, Swat)..."
              className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs w-64 sm:w-80"
            />
            <datalist id="pakistan-cities-list">
              {PAKISTAN_CITIES.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.urduName} — {c.province}
                </option>
              ))}
            </datalist>
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-xl shadow transition whitespace-nowrap cursor-pointer"
            >
              Check Weather
            </button>
          </form>
        </div>

        {/* Province / Region Selector Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar text-xs">
          <span className="font-bold text-slate-500 whitespace-nowrap mr-1">Region:</span>
          {PROVINCES.map((prov) => (
            <button
              key={prov}
              type="button"
              onClick={() => setSelectedProvince(prov)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedProvince === prov
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {prov}
            </button>
          ))}
        </div>

        {/* Quick City Chips for Selected Province / Popular */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
            {selectedProvince === 'All Pakistan' ? 'Featured Mandis:' : `${selectedProvince} Cities:`}
          </span>
          {filteredCities.map((city) => (
            <button
              key={city.id}
              onClick={() => {
                loadWeather(city.name);
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center space-x-1 ${
                selectedCity.toLowerCase() === city.name.toLowerCase() ||
                selectedCity.toLowerCase() === city.id.toLowerCase()
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200'
              }`}
            >
              <span>{city.name}</span>
              <span className="text-[10px] opacity-75">({city.urduName})</span>
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="p-5 bg-red-50 rounded-2xl border border-red-200 text-red-800 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-2">
              <span className="text-xl">⚠️</span>
              <div>
                <span className="font-bold block">Could not load live weather data</span>
                <span className="text-xs text-red-600">{error}</span>
              </div>
            </div>
            <button
              onClick={() => loadWeather(selectedCity)}
              className="bg-red-700 hover:bg-red-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-pulse h-48 flex items-center justify-center">
              <div className="text-slate-400 text-sm flex items-center space-x-2">
                <div className="w-6 h-6 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Fetching Open-Meteo satellite & radar telemetry for {selectedCity}...</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Weather Content */}
        {!loading && weather && (
          <div className="space-y-6">
            {/* Hero Current Weather Card */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-sky-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-emerald-700/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-700/60 pb-5 mb-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                      {weather.location}
                    </h2>
                    <span className="text-xs bg-emerald-800/80 border border-emerald-500/40 text-emerald-200 px-2.5 py-0.5 rounded-full">
                      Lat: {weather.latitude}° | Lon: {weather.longitude}°
                    </span>
                    {((weather.forecast_source || weather.source || '') as string).includes('Live') ? (
                      <span className="inline-flex items-center space-x-1.5 text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2.5 py-0.5 rounded-full font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Live Radar Telemetry</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-xs bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-medium">
                        <span>Offline Fallback</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-emerald-200 mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{weather.weather_condition}</span>
                    <span>•</span>
                    <span className="text-xs text-emerald-300/80">Source: {weather.forecast_source}</span>
                    {weather.recorded_at && (
                      <>
                        <span>•</span>
                        <span className="text-xs text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                          Observed: {weather.recorded_at.replace('T', ' ')} PKT
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="flex items-baseline justify-end space-x-2">
                      <span className="text-4xl sm:text-5xl font-black tracking-tight">{weather.temperature}°C</span>
                    </div>
                    <span className="text-xs text-emerald-300 block font-medium">
                      Current Temperature (موجودہ)
                    </span>
                    {weather.apparent_temperature !== undefined && (
                      <span className="inline-block mt-1 text-xs bg-amber-400/20 text-amber-200 border border-amber-300/30 px-2.5 py-0.5 rounded-full font-semibold">
                        Feels like {weather.apparent_temperature}°C (محسوس شدہ)
                      </span>
                    )}
                    {weather.forecast && weather.forecast.length > 0 && (
                      <div className="mt-2 text-xs text-emerald-200 bg-emerald-950/70 border border-emerald-500/40 rounded-lg px-2.5 py-1">
                        Today Max: <span className="font-bold text-white">{weather.forecast[0].temperature_max}°C</span> | Night Min: <span className="font-bold text-white">{weather.forecast[0].temperature_min}°C</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Current Weather Box (Live Open-Meteo Current Telemetry) */}
              {weather.current && (
                <div className="current-weather-box bg-black/35 backdrop-blur-md rounded-xl p-4 border border-emerald-500/40 mb-5 text-sm text-emerald-100 shadow-inner">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-700/50 pb-2 mb-3">
                    <h3 className="font-bold text-white text-base">
                      Current Weather ({weather.current.time})
                    </h3>
                    {weather.forecast && weather.forecast.length > 0 && (
                      <div className="text-xs bg-emerald-800/80 border border-emerald-500/50 text-white px-2.5 py-1 rounded-md font-semibold">
                        Today Daily Range: Max {weather.forecast[0].temperature_max}°C / Min {weather.forecast[0].temperature_min}°C
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                    <p className="bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-500/20">
                      Temperature: <strong className="text-white text-sm">{weather.current.temperature_2m}°C</strong>{' '}
                      <span className="text-amber-300 font-semibold">(Feels like: {weather.current.apparent_temperature}°C)</span>
                    </p>
                    <p className="bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-500/20">
                      Humidity: <strong className="text-white text-sm">{weather.current.relative_humidity_2m}%</strong>
                    </p>
                    <p className="bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-500/20">
                      Precipitation: <strong className="text-white text-sm">{weather.current.precipitation} mm</strong>
                    </p>
                    <p className="bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-500/20">
                      Wind Speed: <strong className="text-white text-sm">{weather.current.wind_speed_10m} km/h</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* 4 Core Current Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-5">
                <div className="bg-black/25 backdrop-blur-xs p-3 rounded-xl border border-emerald-600/30">
                  <span className="text-[11px] text-emerald-300 uppercase block font-semibold">Humidity (نمی)</span>
                  <span className="text-xl font-extrabold">{weather.humidity}%</span>
                </div>
                <div className="bg-black/25 backdrop-blur-xs p-3 rounded-xl border border-emerald-600/30">
                  <span className="text-[11px] text-emerald-300 uppercase block font-semibold">Wind Speed (ہوا کی رفتار)</span>
                  <span className="text-xl font-extrabold">{weather.wind_speed} km/h</span>
                </div>
                <div className="bg-black/25 backdrop-blur-xs p-3 rounded-xl border border-emerald-600/30">
                  <span className="text-[11px] text-emerald-300 uppercase block font-semibold">Current Rain (بارش)</span>
                  <span className="text-xl font-extrabold text-amber-300">{weather.precipitation} mm</span>
                </div>
                <div className="bg-black/25 backdrop-blur-xs p-3 rounded-xl border border-emerald-600/30">
                  <span className="text-[11px] text-emerald-300 uppercase block font-semibold">Risk Index</span>
                  <span className="text-sm font-bold block mt-1">
                    {weather.heatwave_risk ? (
                      <span className="text-amber-400">🔥 Heatwave Alert</span>
                    ) : weather.frost_risk ? (
                      <span className="text-blue-300">❄️ Frost Alert</span>
                    ) : (
                      <span className="text-emerald-300">✅ Favorable</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Primary Actionable Irrigation Guidance */}
              <div className="bg-emerald-950/70 border border-emerald-500/40 rounded-xl p-4 text-xs sm:text-sm leading-relaxed flex items-start space-x-3">
                <span className="text-2xl">💧</span>
                <div>
                  <span className="font-bold text-emerald-300 block mb-0.5">
                    Field Irrigation Advisory (آبپاشی کا حتمی مشورہ):
                  </span>
                  <p className="text-emerald-100">{weather.irrigation_advice}</p>
                </div>
              </div>
            </div>

            {/* Agricultural Weather Warnings Card */}
            {weather.warnings && weather.warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center space-x-2">
                  <span>⚠️</span>
                  <span>Active Agricultural Weather Advisories & Warnings (زرعی انتباہ)</span>
                </h3>
                <div className="space-y-2.5">
                  {weather.warnings.map((w, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-xl border border-amber-200 text-xs sm:text-sm text-slate-800 leading-relaxed shadow-2xs"
                    >
                      {w}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5-Day Forecast Grid */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                    <span>📅</span>
                    <span>5-Day Agricultural Forecast (آئندہ 5 دن کا تخمینہ)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    24-hour daily outlook: Maximum day heat, night minimums, and total expected rainfall.
                  </p>
                </div>
                <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-medium self-start sm:self-auto">
                  5-Day Outlook &amp; Rain Sums
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {weather.forecast.slice(0, 5).map((day, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl p-3.5 border flex flex-col justify-between text-xs transition ${
                      idx === 0
                        ? 'bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-400 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between border-b pb-1.5 mb-2">
                        <span className="font-bold text-slate-800 text-xs">
                          {idx === 0 ? 'Today (24h Day)' : formatDate(day.date)}
                        </span>
                        {day.precipitation >= 5.0 && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                            Rain
                          </span>
                        )}
                      </div>

                      {/* Condition */}
                      <p className="text-[11px] text-slate-600 mb-2 font-medium line-clamp-2" title={day.weather_condition}>
                        {day.weather_condition.split('(')[0]}
                      </p>

                      {/* Day Max / Night Min Temps */}
                      <div className="bg-white/80 border border-slate-200 rounded-lg p-1.5 mb-2">
                        <div className="flex items-center justify-between text-[11px] mb-0.5">
                          <span className="text-slate-500 font-medium">Day Max:</span>
                          <span className="text-sm font-black text-slate-900">{day.temperature_max}°C</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Night Min:</span>
                          <span className="text-xs font-semibold text-slate-600">{day.temperature_min}°C</span>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="space-y-1 text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/80 mb-2">
                        <div className="flex justify-between">
                          <span>24h Rain:</span>
                          <span className="font-bold text-slate-800">{day.precipitation} mm</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Max Wind:</span>
                          <span className="font-bold text-slate-800">{day.wind_speed_max} km/h</span>
                        </div>
                      </div>
                    </div>

                    {/* Daily Irrigation Advice Badge */}
                    <div
                      className={`text-[10px] font-bold p-1.5 rounded text-center ${
                        day.precipitation >= 5.0
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : day.wind_speed_max >= 25.0
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {day.precipitation >= 5.0
                        ? '⛔ No Irrigation'
                        : day.wind_speed_max >= 25.0
                        ? '⚠️ High Wind'
                        : '✅ Safe to Irrigate'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SaaSLayout>
  );
}
