'use client';

import React, { useState, useEffect } from 'react';
import SaaSLayout from '@/components/SaaSLayout';
import { fetchCropRecommendations } from '@/lib/api';
import { CropPlan, CropRecommendation } from '@/types';
import { loadSavedItem, saveItem } from '@/lib/storage';

const DISTRICT_LIST = [
  'Multan', 'Faisalabad', 'Lahore', 'Sargodha', 'Bahawalpur',
  'Rahim Yar Khan', 'Sahiwal', 'Gujranwala', 'Sheikhupura', 'Okara',
  'Khanewal', 'Vehari', 'Muzaffargarh', 'D.G. Khan', 'Chakwal',
  'Hyderabad', 'Sukkur', 'Larkana', 'Peshawar', 'Mardan', 'Quetta'
];

const SOIL_TYPES = [
  'Loam (Mera - زرخیز میرا)',
  'Sandy Loam (ریتلی میرا)',
  'Clay Loam (پکی میرا)',
  'Silt Loam (درمیانی میرا)',
  'Saline / Marginal (شور زدہ)'
];

const WATER_LEVELS = [
  { value: 'Limited', label: 'Limited / Scarce (محدود پانی - 1 تا 2 پانیاں)', icon: '💧' },
  { value: 'Normal', label: 'Normal (معمول کے مطابق نہری + ٹیوب ویل)', icon: '💧💧' },
  { value: 'Abundant', label: 'Abundant (وافر پانی / نہر کے ہیڈ پر)', icon: '🌊' },
  { value: 'Rainfed', label: 'Rainfed / Barani (صرف بارش پر منحصر)', icon: '🌧️' },
];

const LAND_UNITS = [
  { id: 'acre', labelEn: 'Acres', labelUr: 'ایکڑ', toAcres: 1.0 },
  { id: 'kanal', labelEn: 'Kanal', labelUr: 'کنال', toAcres: 0.125 },
  { id: 'marla', labelEn: 'Marla', labelUr: 'مرلہ', toAcres: 1 / 160 },
  { id: 'khet', labelEn: 'Khet / Killa', labelUr: 'کھیت / قلعہ', toAcres: 1.0 },
  { id: 'murabba', labelEn: 'Murabba', labelUr: 'مربع', toAcres: 25.0 },
  { id: 'bigha', labelEn: 'Bigha', labelUr: 'بیگھہ', toAcres: 0.5 },
];

export default function CropAdvisorPage() {
  // Form State
  const [district, setDistrict] = useState<string>('Multan');
  const [province, setProvince] = useState<string>('Punjab');
  const [season, setSeason] = useState<string>('Rabi');
  const [soilType, setSoilType] = useState<string>('Loam (Mera - زرخیز میرا)');
  const [waterAvailability, setWaterAvailability] = useState<string>('Limited');
  const [landAcres, setLandAcres] = useState<number | string>(5.0);
  const [landUnit, setLandUnit] = useState<string>('acre');

  // Result State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<CropPlan | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<CropRecommendation | null>(null);
  const [isRestored, setIsRestored] = useState<boolean>(false);

  const activeUnit = LAND_UNITS.find((u) => u.id === landUnit) || LAND_UNITS[0];
  const parsedLand = typeof landAcres === 'string' ? parseFloat(landAcres) : landAcres;
  const effectiveAcres = (!isNaN(parsedLand) && parsedLand > 0)
    ? Math.round(parsedLand * activeUnit.toAcres * 1000) / 1000
    : 0;

  // Restore saved state from previous navigation
  useEffect(() => {
    const saved = loadSavedItem<any>('kd_advisor_state', null);
    if (saved) {
      if (saved.district) setDistrict(saved.district);
      if (saved.province) setProvince(saved.province);
      if (saved.season) setSeason(saved.season);
      if (saved.soilType) setSoilType(saved.soilType);
      if (saved.waterAvailability) setWaterAvailability(saved.waterAvailability);
      if (saved.landAcres !== undefined) setLandAcres(saved.landAcres);
      if (saved.landUnit) setLandUnit(saved.landUnit);
      if (saved.plan) setPlan(saved.plan);
      if (saved.selectedCrop) setSelectedCrop(saved.selectedCrop);
    }
    setIsRestored(true);
  }, []);

  // Persist state across navigations
  useEffect(() => {
    if (!isRestored) return;
    saveItem('kd_advisor_state', {
      district,
      province,
      season,
      soilType,
      waterAvailability,
      landAcres,
      landUnit,
      plan,
      selectedCrop,
    });
  }, [
    isRestored,
    district,
    province,
    season,
    soilType,
    waterAvailability,
    landAcres,
    landUnit,
    plan,
    selectedCrop,
  ]);

  // Load recommendations
  const handleRecommend = async (overrideParams?: {
    district?: string;
    season?: string;
    water?: string;
    acres?: number;
    soil?: string;
  }) => {
    setLoading(true);
    setError(null);

    const d = overrideParams?.district || district;
    const s = overrideParams?.season || season;
    const w = overrideParams?.water || waterAvailability;
    const a = overrideParams?.acres !== undefined ? overrideParams.acres : (effectiveAcres || 1.0);
    const soil = overrideParams?.soil || soilType;

    try {
      const result = await fetchCropRecommendations({
        district: d,
        province,
        season: s,
        soil_type: soil,
        water_availability: w,
        land_acres: a,
        preferred_language: 'urdu',
      });
      setPlan(result);
      if (result.recommendations && result.recommendations.length > 0) {
        setSelectedCrop(result.recommendations[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate crop recommendations.');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Test Scenario: "5 acres in Multan, Rabi season, limited water"
  const loadTestScenario = () => {
    setDistrict('Multan');
    setSeason('Rabi');
    setWaterAvailability('Limited');
    setLandAcres(5.0);
    setSoilType('Loam (Mera - زرخیز میرا)');
    handleRecommend({
      district: 'Multan',
      season: 'Rabi',
      water: 'Limited',
      acres: 5.0,
      soil: 'Loam (Mera - زرخیز میرا)',
    });
  };

  // Initial load
  useEffect(() => {
    handleRecommend();
  }, []);

  return (
    <SaaSLayout
      title="Crop Suitability Advisor"
      subtitle="Deterministic agro-ecological scoring engine grounded in Pakistani agricultural research"
      badge="Agro-Ecological"
    >
        {/* Header Title Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 mb-8">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-3xl">🌾</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Crop Advisor (فصل کا دانشمندانہ مشورہ)
              </h1>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Deterministic, agro-ecological scoring engine grounded in Pakistani agricultural research &amp; climatic benchmarks.
            </p>
          </div>

          {/* 1-Click Verification Button */}
          <button
            onClick={loadTestScenario}
            className="self-start md:self-auto bg-gradient-to-r from-amber-600 to-emerald-700 hover:from-amber-700 hover:to-emerald-800 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-md transition flex items-center space-x-2 border border-amber-400/40"
          >
            <span>🎯</span>
            <span>Test: 5 acres Multan (Rabi, Limited Water)</span>
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => handleRecommend()}
              className="bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-800"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Farm Parameters Form (4 Cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
            <h2 className="font-extrabold text-slate-900 text-base mb-4 flex items-center space-x-2 border-b border-slate-100 pb-3">
              <span>📋</span>
              <span>Farm Parameters (زمین کے کوائف)</span>
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRecommend();
              }}
              className="space-y-4 text-xs sm:text-sm"
            >
              {/* District */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  District (ضلع)
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {DISTRICT_LIST.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Season */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cropping Season (سیزن)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSeason('Summer')}
                    className={`py-2 px-2.5 rounded-xl font-bold border transition text-xs flex items-center justify-center space-x-1 ${
                      season === 'Summer' || season === 'Kharif'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>☀️</span>
                    <span>Summer (خریف)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeason('Winter')}
                    className={`py-2 px-2.5 rounded-xl font-bold border transition text-xs flex items-center justify-center space-x-1 ${
                      season === 'Winter' || season === 'Rabi'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>❄️</span>
                    <span>Winter (ربیع)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeason('Spring')}
                    className={`py-2 px-2.5 rounded-xl font-bold border transition text-xs flex items-center justify-center space-x-1 ${
                      season === 'Spring'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🌱</span>
                    <span>Spring (بہار)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeason('Autumn')}
                    className={`py-2 px-2.5 rounded-xl font-bold border transition text-xs flex items-center justify-center space-x-1 ${
                      season === 'Autumn'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🍂</span>
                    <span>Autumn (خزاں)</span>
                  </button>
                </div>
              </div>

              {/* Water Availability */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Water Availability (پانی کی دستیابی)
                </label>
                <select
                  value={waterAvailability}
                  onChange={(e) => setWaterAvailability(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {WATER_LEVELS.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Land Input & Unit Selector */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">
                    Cultivated Land (رقبہ)
                  </label>
                  {effectiveAcres > 0 && (
                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                      ≈ {effectiveAcres} Acres ({Math.round(effectiveAcres * 8 * 10) / 10} Kanals)
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0.01"
                    max="1000000"
                    step="any"
                    placeholder="e.g. 5"
                    value={landAcres}
                    onChange={(e) => setLandAcres(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                  <select
                    value={landUnit}
                    onChange={(e) => setLandUnit(e.target.value)}
                    className="bg-slate-100 border border-slate-300 rounded-xl px-2.5 py-2 text-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {LAND_UNITS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.labelEn} ({u.labelUr})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Soil Type */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Soil Classification (مٹی کی قسم)
                </label>
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {SOIL_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-md transition text-sm flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Evaluating Crop Suitability...</span>
                  </>
                ) : (
                  <>
                    <span>🔍 Calculate Recommendations</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Recommendations Dashboard (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {loading && !plan && (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-slate-600 text-sm font-medium">
                  Running deterministic agro-ecological rules engine for {district}...
                </p>
              </div>
            )}

            {plan && (
              <>
                {/* Hero Card: Primary Recommended Crop */}
                <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-sky-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-emerald-700/50 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-700/60 pb-5 mb-5">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs bg-amber-400/20 text-amber-300 border border-amber-300/40 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Top Match (بہترین انتخاب)
                        </span>
                        <span className="text-xs bg-emerald-800/80 text-emerald-200 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          {plan.district} • {plan.season}
                        </span>
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                        {plan.recommended_crop} ({plan.recommended_crop_urdu})
                      </h2>
                      <p className="text-xs sm:text-sm text-emerald-200 mt-1">
                        Allocated: <strong>{selectedCrop?.acreage_allocation || plan.land_acres} Acres</strong> | Water: <strong>{selectedCrop?.water_requirement}</strong>
                      </p>
                    </div>

                    {/* Suitability Score Gauge */}
                    <div className="text-left sm:text-right bg-black/25 backdrop-blur-xs p-4 rounded-xl border border-emerald-500/30">
                      <span className="text-xs text-emerald-300 block font-semibold">Suitability Score</span>
                      <div className="flex items-baseline space-x-1 sm:justify-end">
                        <span className="text-4xl sm:text-5xl font-black text-amber-300">
                          {selectedCrop?.suitability_score || plan.recommendations[0]?.suitability_score}
                        </span>
                        <span className="text-lg text-emerald-300 font-bold">/100</span>
                      </div>
                      <span className="text-[11px] text-emerald-200 block mt-0.5">
                        {selectedCrop?.suitability_label}
                      </span>
                    </div>
                  </div>

                  {/* 4 Key Metrics Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-6">
                    <div className="bg-black/25 backdrop-blur-xs p-3 rounded-xl border border-emerald-600/30">
                      <span className="text-[11px] text-emerald-300 uppercase block font-semibold">Acreage Allocation</span>
                      <span className="text-xl font-extrabold">{selectedCrop?.acreage_allocation || plan.land_acres} Acres</span>
                    </div>
                    <div className="bg-black/25 backdrop-blur-xs p-3 rounded-xl border border-emerald-600/30">
                      <span className="text-[11px] text-emerald-300 uppercase block font-semibold">Expected Yield</span>
                      <span className="text-xl font-extrabold text-amber-300">{selectedCrop?.total_expected_yield_maunds} Maunds</span>
                    </div>
                    <div className="bg-black/25 backdrop-blur-xs p-3 rounded-xl border border-emerald-600/30">
                      <span className="text-[11px] text-emerald-300 uppercase block font-semibold">Market Rate</span>
                      <span className="text-xl font-extrabold">PKR {(selectedCrop?.market_price_per_maund ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="bg-black/25 backdrop-blur-xs p-3 rounded-xl border border-emerald-600/30">
                      <span className="text-[11px] text-emerald-300 uppercase block font-semibold">Est. Net Profit</span>
                      <span className="text-xl font-extrabold text-emerald-400">PKR {(selectedCrop?.net_profit_pkr ?? 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Reasons & Risks Split */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Reasons */}
                    <div className="bg-emerald-950/70 border border-emerald-500/40 rounded-xl p-4 text-xs">
                      <h4 className="font-bold text-emerald-300 text-sm mb-2 flex items-center space-x-1.5">
                        <span>✅</span>
                        <span>Why This Crop? (انتخاب کی وجوہات)</span>
                      </h4>
                      <ul className="space-y-1.5 text-emerald-100">
                        {selectedCrop?.reasons.map((r, i) => (
                          <li key={i} className="flex items-start space-x-1.5">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Risks & Mitigation */}
                    <div className="bg-amber-950/60 border border-amber-500/40 rounded-xl p-4 text-xs">
                      <h4 className="font-bold text-amber-300 text-sm mb-2 flex items-center space-x-1.5">
                        <span>⚠️</span>
                        <span>Risks &amp; Watchpoints (اہم خطرات)</span>
                      </h4>
                      <ul className="space-y-1.5 text-amber-100">
                        {selectedCrop?.risks && selectedCrop.risks.length > 0 ? (
                          selectedCrop.risks.map((rk, i) => (
                            <li key={i} className="flex items-start space-x-1.5">
                              <span className="text-amber-400 font-bold">•</span>
                              <span>{rk}</span>
                            </li>
                          ))
                        ) : (
                          <li>Standard pest and irrigation management applies.</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Urdu Summary Footnote */}
                  <div className="mt-4 pt-3 border-t border-emerald-700/50 text-xs text-emerald-200 leading-relaxed font-medium">
                    {plan.summary_urdu}
                  </div>
                </div>

                {/* Candidate Crops Comparative Table */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                        <span>📊</span>
                        <span>Candidate Crops Suitability Matrix (تمام فصلی متبادل)</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Ranked deterministically based on season, water demand, and net profitability.
                      </p>
                    </div>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold">
                      {plan.recommendations.length} Evaluated
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {plan.recommendations.map((c, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedCrop(c)}
                        className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                          selectedCrop?.crop_name === c.crop_name
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-slate-900 text-sm">
                              {c.crop_name}
                            </span>
                            <span
                              className={`text-xs font-black px-2 py-0.5 rounded-full ${
                                c.suitability_score >= 85
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : c.suitability_score >= 70
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {c.suitability_score}/100
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 block mb-2 font-medium">
                            {c.crop_name_urdu} • {c.season}
                          </span>

                          <div className="text-xs text-slate-700 space-y-1 mb-3">
                            <p className="flex justify-between">
                              <span className="text-slate-500">Water:</span>
                              <span className="font-semibold">{c.water_requirement.split('(')[0]}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-slate-500">Net Profit:</span>
                              <span className="font-bold text-emerald-700">PKR {(c.net_profit_pkr ?? 0).toLocaleString()}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-slate-500">Duration:</span>
                              <span>{c.growing_duration_days} days</span>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="w-full text-center text-xs font-bold py-1.5 rounded-lg bg-white border border-slate-200 text-emerald-800 hover:bg-emerald-700 hover:text-white transition"
                        >
                          View Details (تفصیل دیکھیں)
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </SaaSLayout>
  );
}
