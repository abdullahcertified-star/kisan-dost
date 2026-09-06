'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import SaaSLayout from '@/components/SaaSLayout';
import { fetchMarketPrices } from '@/lib/api';
import { MandiPrice, MandiPricesResponse } from '@/types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { loadSavedItem, saveItem, clearItem } from '@/lib/storage';

export default function MarketPage() {
  const [data, setData] = useState<MandiPricesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCrop, setSelectedCrop] = useState<string>('All Crops');
  const [selectedMarket, setSelectedMarket] = useState<string>('All Markets');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'price_desc' | 'price_asc' | 'arrivals_desc' | 'name'>('price_desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [isRestored, setIsRestored] = useState<boolean>(false);

  useEffect(() => {
    document.title = 'Mandi Market Rates (منڈی کے ریٹس) | Kisan Dost';
    const saved = loadSavedItem<any>('kd_market_state', null);
    if (saved) {
      if (saved.crop) setSelectedCrop(saved.crop);
      if (saved.market) setSelectedMarket(saved.market);
      if (typeof saved.search === 'string') setSearchQuery(saved.search);
      if (saved.sort) setSortBy(saved.sort);
      if (saved.view) setViewMode(saved.view);
    }
    setIsRestored(true);
  }, []);

  // Persist filters on changes
  useEffect(() => {
    if (!isRestored) return;
    saveItem('kd_market_state', {
      crop: selectedCrop,
      market: selectedMarket,
      search: searchQuery,
      sort: sortBy,
      view: viewMode,
    });
  }, [selectedCrop, selectedMarket, searchQuery, sortBy, viewMode, isRestored]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchMarketPrices(selectedCrop, selectedMarket)
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load mandi prices.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCrop, selectedMarket]);

  // Client-side text search & sorting filter
  const filteredRates = useMemo(() => {
    if (!data?.rates || !Array.isArray(data.rates)) return [];
    let list = [...data.rates];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) => {
        const crop = (r.crop || '').toLowerCase();
        const cropUr = r.crop_ur || '';
        const mandi = (r.mandi_name || '').toLowerCase();
        const province = (r.province || '').toLowerCase();
        return (
          crop.includes(q) ||
          cropUr.includes(q) ||
          mandi.includes(q) ||
          province.includes(q)
        );
      });
    }

    // Sort order
    if (sortBy === 'price_desc') {
      list.sort((a, b) => (b.avg_price_pkr || 0) - (a.avg_price_pkr || 0));
    } else if (sortBy === 'price_asc') {
      list.sort((a, b) => (a.avg_price_pkr || 0) - (b.avg_price_pkr || 0));
    } else if (sortBy === 'arrivals_desc') {
      list.sort(
        (a, b) =>
          (b.arrival_volume_maunds ?? b.arrival_maunds ?? 0) -
          (a.arrival_volume_maunds ?? a.arrival_maunds ?? 0)
      );
    } else if (sortBy === 'name') {
      list.sort((a, b) => (a.mandi_name || '').localeCompare(b.mandi_name || ''));
    }

    return list;
  }, [data, searchQuery, sortBy]);

  // Chart data: Prepare comparison of Min, Avg, Max prices
  const priceChartData = useMemo(() => {
    return filteredRates.slice(0, 10).map((r) => ({
      name: `${r.mandi_name || 'Mandi'} (${r.crop || ''})`,
      mandi: r.mandi_name || 'Mandi',
      crop: r.crop || '',
      Min: r.min_price_pkr || 0,
      Avg: r.avg_price_pkr || 0,
      Max: r.max_price_pkr || 0,
    }));
  }, [filteredRates]);

  // Chart data: Arrival volumes
  const arrivalChartData = useMemo(() => {
    return filteredRates
      .filter((r) => {
        const vol = r.arrival_volume_maunds ?? r.arrival_maunds ?? 0;
        return vol > 0;
      })
      .slice(0, 8)
      .map((r) => ({
        name: `${r.mandi_name || 'Mandi'}`,
        crop: r.crop || '',
        Arrivals: r.arrival_volume_maunds ?? r.arrival_maunds ?? 0,
      }));
  }, [filteredRates]);

  // Key KPI stats
  const stats = useMemo(() => {
    if (filteredRates.length === 0) return null;
    const avgPrices = filteredRates.map((r) => r.avg_price_pkr || 0);
    const maxItem = filteredRates.reduce((prev, curr) =>
      (curr.avg_price_pkr || 0) > (prev.avg_price_pkr || 0) ? curr : prev
    );
    const minItem = filteredRates.reduce((prev, curr) =>
      (curr.avg_price_pkr || 0) < (prev.avg_price_pkr || 0) ? curr : prev
    );
    const overallAvg = Math.round(
      avgPrices.reduce((a, b) => a + b, 0) / avgPrices.length
    );
    const totalArrivals = filteredRates.reduce(
      (acc, r) => acc + (r.arrival_volume_maunds ?? r.arrival_maunds ?? 0),
      0
    );

    return {
      highest: maxItem,
      lowest: minItem,
      average: overallAvg,
      totalArrivals,
      count: filteredRates.length,
    };
  }, [filteredRates]);

  const cropOptions = useMemo(() => {
    if (data?.crops_available && data.crops_available.length > 0) {
      return ['All Crops', ...data.crops_available];
    }
    return [
      'All Crops',
      'Wheat',
      'Cotton',
      'Rice',
      'Maize',
      'Mustard',
      'Potato',
      'Chickpea',
    ];
  }, [data]);

  const marketOptions = useMemo(() => {
    if (data?.markets_available && data.markets_available.length > 0) {
      return ['All Markets', ...data.markets_available];
    }
    return [
      'All Markets',
      'Jhang',
      'Sialkot',
      'Sukkur',
      'Faisalabad',
      'Multan',
      'Lahore',
      'Gujranwala',
      'Sahiwal',
      'Okara',
      'Rawalpindi',
      'Bahawalpur',
      'Sargodha',
      'Hyderabad',
      'Peshawar',
      'Quetta',
    ];
  }, [data]);

  // Popular quick city pills
  const popularCities = [
    'All Markets',
    'Jhang',
    'Sialkot',
    'Sukkur',
    'Faisalabad',
    'Multan',
    'Lahore',
    'Gujranwala',
    'Sahiwal',
    'Okara',
    'Rawalpindi',
    'Hyderabad',
  ];

  // Quick crop pills
  const popularCrops = [
    { name: 'All Crops', label: 'All Crops (تمام فصلیں)' },
    { name: 'Wheat', label: 'Wheat (گندم)' },
    { name: 'Cotton', label: 'Cotton (کپاس)' },
    { name: 'Rice', label: 'Rice (چاول)' },
    { name: 'Maize', label: 'Maize (مکئی)' },
    { name: 'Mustard', label: 'Mustard (سرسوں)' },
    { name: 'Potato', label: 'Potato (آلو)' },
    { name: 'Chickpea', label: 'Chickpea (چنا)' },
  ];

  // Share rate via WhatsApp
  const shareViaWhatsApp = (r: MandiPrice) => {
    const arrivals = (r.arrival_volume_maunds ?? r.arrival_maunds ?? 0).toLocaleString();
    const msg = 
`🌾 *Kisan Dost Mandi Benchmark Update*
📍 *Market:* ${r.mandi_name} (${r.province})
🌱 *Crop:* ${r.crop} (${r.crop_ur})
💰 *Average Rate:* PKR ${r.avg_price_pkr.toLocaleString()} / 40 kg
📊 *Spread:* PKR ${r.min_price_pkr.toLocaleString()} - ${r.max_price_pkr.toLocaleString()}
🚚 *Daily Inflow:* ${arrivals} Maunds
⚠️ *Notice:* ${r.price_type} (AMIS Official Benchmark)
📲 Check full prices on Kisan Dost: http://localhost:3000/market`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Copy rate details to clipboard
  const copyRateDetails = (r: MandiPrice) => {
    const text = `${r.mandi_name}: ${r.crop} (${r.crop_ur}) - Avg PKR ${r.avg_price_pkr}/maund (Spread: PKR ${r.min_price_pkr} - ${r.max_price_pkr})`;
    navigator.clipboard.writeText(text);
    setCopiedNotification(`Copied ${r.mandi_name} (${r.crop}) rates!`);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  return (
    <SaaSLayout
      title="Mandi Wholesale Rates"
      subtitle="AMIS Pakistan daily wholesale benchmarks across 48+ mandis"
      badge="336 Live Records"
    >
        {/* Floating Toast Notification */}
        {copiedNotification && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center space-x-2 border border-slate-700 animate-bounce">
            <span>📋</span>
            <span>{copiedNotification}</span>
          </div>
        )}

        {/* Hero Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-sky-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-emerald-700/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 mb-2 border border-emerald-500/30">
              <span>🏛️ Agricultural Produce Market Committee (AMIS Pakistan)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Mandi Market Rates (منڈی کے ریٹس)
            </h1>
            <p className="text-sm text-emerald-100/90 mt-1 max-w-2xl">
              Official reference benchmark rates across 48+ Pakistani market centers: Jhang, Sialkot, Sukkur, Faisalabad, Multan, Lahore, and provincial mandis.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/profit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-lg flex items-center space-x-2 border border-emerald-400/40"
            >
              <span>💰</span>
              <span>Open Profit Calculator</span>
            </Link>
          </div>
        </div>

        {/* Mandatory Data Quality Notice */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-sm text-xs sm:text-sm text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-start space-x-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-bold text-amber-950">
                Data Notice: Reference price / last updated (مستند حوالہ جاتی قیمت)
              </p>
              <p className="text-amber-800 text-xs mt-0.5">
                All commodity prices are official reference benchmarks compiled from Punjab and provincial Market Committees. They are strictly reference values, not intraday live auction tickers. Actual rates depend on moisture, crop grading, and spot bidding.
              </p>
            </div>
          </div>
          <div className="shrink-0 bg-amber-100 text-amber-900 px-3 py-1 rounded-lg text-xs font-bold border border-amber-300">
            Last DB Sync: {data?.last_database_update || 'Sept 2026'}
          </div>
        </div>

        {/* MERGED UNIFIED SEARCH & FILTER HUB */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          {/* Row 1: Search, Dropdowns, and Sort */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Quick Search */}
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Quick Search (تلاش)</span>
                {searchQuery && (
                  <span className="text-[10px] text-emerald-700 font-bold">Filtering live</span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search city, crop, province..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-7 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs">🔍</span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-sm font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Crop Select Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Crop (فصل منتخب کریں)
              </label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              >
                {cropOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Market Select Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Market / City ({marketOptions.length - 1} Mandis)
              </label>
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              >
                {marketOptions.map((m) => (
                  <option key={m} value={m}>
                    {m === 'All Markets' ? '📍 All Markets (تمام منڈیاں)' : m}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sort By (ترتیب دیں)
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="price_desc">Highest Rate First (زیادہ ریٹ)</option>
                <option value="price_asc">Lowest Rate First (کم ریٹ)</option>
                <option value="arrivals_desc">Highest Daily Arrivals (زیادہ آمد)</option>
                <option value="name">Market Name (الف بائی ترتیب)</option>
              </select>
            </div>
          </div>

          {/* Row 2: One-Tap Quick Crop Pills */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700 flex items-center space-x-1.5">
                <span>🌾</span>
                <span>Quick Select Crop:</span>
              </span>
              {(selectedCrop !== 'All Crops' || selectedMarket !== 'All Markets' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCrop('All Crops');
                    setSelectedMarket('All Markets');
                    setSearchQuery('');
                    clearItem('kd_market_state');
                  }}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-0.5 rounded-md transition"
                >
                  Reset All Filters ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {popularCrops.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setSelectedCrop(c.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                    selectedCrop === c.name
                      ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-600/30'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: One-Tap Quick City Pills */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-xs font-extrabold text-slate-700 flex items-center space-x-1.5">
              <span>📍</span>
              <span>Quick Select Market (شہرو منڈی):</span>
            </span>

            <div className="flex flex-wrap gap-1.5">
              {popularCities.map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMarket(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    selectedMarket === m
                      ? 'bg-sky-800 text-white shadow-sm ring-2 ring-sky-600/30'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {m === 'All Markets' ? '📍 All Mandis' : m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-600 text-sm font-semibold">
              Fetching verified Mandi price benchmarks...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-sm font-medium">
            ⚠️ Error: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* KPI Summary Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-medium text-slate-500 block">
                    Highest Paying Mandi
                  </span>
                  <span className="text-base sm:text-lg font-black text-emerald-700 block mt-1">
                    PKR {stats.highest.avg_price_pkr.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-600 truncate block">
                    {stats.highest.mandi_name} ({stats.highest.crop})
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-medium text-slate-500 block">
                    Lowest Benchmark Rate
                  </span>
                  <span className="text-base sm:text-lg font-black text-amber-700 block mt-1">
                    PKR {stats.lowest.avg_price_pkr.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-600 truncate block">
                    {stats.lowest.mandi_name} ({stats.lowest.crop})
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-medium text-slate-500 block">
                    Regional Average Rate
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-900 block mt-1">
                    PKR {stats.average.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    Per 40 kg Maund (من)
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-medium text-slate-500 block">
                    Total Daily Arrivals Tracked
                  </span>
                  <span className="text-base sm:text-lg font-black text-sky-700 block mt-1">
                    {stats.totalArrivals.toLocaleString()} Maunds
                  </span>
                  <span className="text-xs text-slate-500 block">
                    Across {stats.count} market points
                  </span>
                </div>
              </div>
            )}

            {/* Recharts Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Price Comparison (Min, Avg, Max) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <div className="mb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <span>📊</span>
                    <span>Mandi Price Spread (PKR / Maund)</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Compares Min, Average, and Max reference rates across regional grain hubs.
                  </p>
                </div>
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={priceChartData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="mandi"
                        tick={{ fontSize: 11 }}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="Min" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Avg" fill="#047857" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Max" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Daily Arrival Volumes */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <div className="mb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <span>🚚</span>
                    <span>Market Arrivals Volume (Maunds / Day)</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Indicator of market liquidity and commodity supply inflow.
                  </p>
                </div>
                <div className="w-full h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={arrivalChartData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="Arrivals" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* View Mode Toggle & Rates Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Mandi Benchmark Rates List (منڈی ریٹ لسٹ)
                </h3>
                <p className="text-xs text-slate-500">
                  Showing {filteredRates.length} regulated market rates (Standard Unit: 40 kg Maund / من).
                </p>
              </div>

              {/* View Toggle */}
              <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                    viewMode === 'cards'
                      ? 'bg-white text-slate-900 shadow'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🎴</span>
                  <span>Card View</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                    viewMode === 'table'
                      ? 'bg-white text-slate-900 shadow'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>📋</span>
                  <span>Table View</span>
                </button>
              </div>
            </div>

            {/* CARD VIEW */}
            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRates.length === 0 ? (
                  <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
                    No mandi prices found matching the selected filter criteria.
                  </div>
                ) : (
                  filteredRates.map((r, idx) => {
                    const arrivals = (r.arrival_volume_maunds ?? r.arrival_maunds ?? 0).toLocaleString();
                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-black text-slate-900 text-base flex items-center space-x-1.5">
                                <span>📍 {r.mandi_name}</span>
                              </h4>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {r.province || 'Punjab'} Province
                              </span>
                            </div>

                            <span className="bg-emerald-50 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-lg border border-emerald-200">
                              {r.crop}
                              <span className="block text-[10px] text-emerald-600 font-normal">
                                {r.crop_ur || ''}
                              </span>
                            </span>
                          </div>

                          {/* Rate display */}
                          <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                            <div className="flex items-baseline justify-between">
                              <span className="text-xs text-slate-500 font-medium">Avg Benchmark:</span>
                              <span className="text-xl font-black text-emerald-700">
                                PKR {(r.avg_price_pkr || 0).toLocaleString()}
                              </span>
                            </div>

                            {/* Spread Meter */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                                <span>Min: PKR {(r.min_price_pkr || 0).toLocaleString()}</span>
                                <span>Max: PKR {(r.max_price_pkr || 0).toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                                <div className="bg-amber-400 w-1/3"></div>
                                <div className="bg-emerald-600 w-1/3"></div>
                                <div className="bg-sky-500 w-1/3"></div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                            <span>🚚 Daily Arrivals:</span>
                            <span className="font-bold text-slate-800">{arrivals} Maunds</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center space-x-2">
                          <Link
                            href={`/profit?crop=${encodeURIComponent(r.crop)}&price=${r.avg_price_pkr}&mandi=${encodeURIComponent(r.mandi_name)}`}
                            className="flex-1 text-center py-2 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm transition flex items-center justify-center space-x-1"
                          >
                            <span>💰</span>
                            <span>Estimate Profit</span>
                          </Link>

                          <button
                            onClick={() => shareViaWhatsApp(r)}
                            title="Share on WhatsApp"
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition text-sm"
                          >
                            💬
                          </button>

                          <button
                            onClick={() => copyRateDetails(r)}
                            title="Copy details"
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition text-sm"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TABLE VIEW */}
            {viewMode === 'table' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Mandi / Market</th>
                        <th className="p-3">Crop (فصل)</th>
                        <th className="p-3">Min Price</th>
                        <th className="p-3">Avg Rate (اوسط)</th>
                        <th className="p-3">Max Price</th>
                        <th className="p-3">Daily Arrivals</th>
                        <th className="p-3">Price Verification Label</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRates.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500">
                            No mandi prices found matching the selected filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredRates.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition">
                            <td className="p-3 font-extrabold text-slate-900">
                              {r.mandi_name}
                              <span className="block text-[10px] text-slate-400 font-normal">
                                {r.province || 'Punjab'}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-800">
                              {r.crop}
                              <span className="text-slate-500 text-[11px] block">
                                {r.crop_ur || ''}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 font-medium">
                              PKR {(r.min_price_pkr || 0).toLocaleString()}
                            </td>
                            <td className="p-3 font-black text-emerald-700 text-sm">
                              PKR {(r.avg_price_pkr || 0).toLocaleString()}
                            </td>
                            <td className="p-3 text-slate-600 font-medium">
                              PKR {(r.max_price_pkr || 0).toLocaleString()}
                            </td>
                            <td className="p-3 text-slate-700">
                              {(r.arrival_volume_maunds ?? r.arrival_maunds)
                                ? `${(r.arrival_volume_maunds ?? r.arrival_maunds)?.toLocaleString()} Maunds`
                                : 'Seasonal arrival'}
                            </td>
                            <td className="p-3">
                              <span className="inline-block bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px] border border-amber-200">
                                {r.price_type}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-1 whitespace-nowrap">
                              <button
                                onClick={() => shareViaWhatsApp(r)}
                                title="Share via WhatsApp"
                                className="inline-flex items-center text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded-lg border border-emerald-200 transition"
                              >
                                💬
                              </button>
                              <Link
                                href={`/profit?crop=${encodeURIComponent(r.crop)}&price=${r.avg_price_pkr}&mandi=${encodeURIComponent(r.mandi_name)}`}
                                className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition"
                              >
                                <span>Profit</span>
                                <span>→</span>
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </SaaSLayout>
  );
}
