'use client';

import React, { useState, useEffect } from 'react';
import { FertilizerPlan, FertilizerInput } from '@/types';
import { loadSavedItem, saveItem, clearItem } from '@/lib/storage';

interface FertilizerCalculatorProps {
  initialCrop?: string;
  initialAcres?: number;
  initialSoil?: string;
}

const SUPPORTED_CROPS = [
  { id: 'Wheat', nameUr: 'گندم', icon: '🌾', benchmark: 40 },
  { id: 'Chickpea', nameUr: 'چنا', icon: '🌱', benchmark: 18 },
  { id: 'Mustard', nameUr: 'سرسوں / کینولا', icon: '🌼', benchmark: 22 },
  { id: 'Rice', nameUr: 'دھان / چاول', icon: '🍚', benchmark: 40 },
  { id: 'Cotton', nameUr: 'کپاس', icon: '☁️', benchmark: 25 },
  { id: 'Maize', nameUr: 'مکئی', icon: '🌽', benchmark: 60 },
  { id: 'Potato', nameUr: 'آلو', icon: '🥔', benchmark: 250 },
];

const SOIL_OPTIONS = [
  { id: 'Loam (Mera)', labelEn: 'Loam (Mera)', labelUr: 'زرخیز میرا', badge: '1.0x (Standard)' },
  { id: 'Sandy Loam (ریتلی میرا)', labelEn: 'Sandy Loam (Retli Mera)', labelUr: 'ریتلی میرا', badge: '+10% Fertilizer (Leaching Risk)' },
  { id: 'Clay Loam (پکی میرا)', labelEn: 'Clay Loam (Paki Mera)', labelUr: 'پکی میرا / چکنی', badge: '-5% Nitrogen (High Retention)' },
];

export const LAND_UNITS = [
  { id: 'acre', labelEn: 'Acres', labelUr: 'ایکڑ', toAcres: 1.0, quickOptions: [1, 2.5, 5, 10, 20] },
  { id: 'kanal', labelEn: 'Kanal', labelUr: 'کنال', toAcres: 0.125, quickOptions: [4, 8, 16, 24, 40] },
  { id: 'marla', labelEn: 'Marla', labelUr: 'مرلہ', toAcres: 1 / 160, quickOptions: [20, 40, 80, 160, 320] },
  { id: 'khet', labelEn: 'Khet / Killa', labelUr: 'کھیت / قلعہ', toAcres: 1.0, quickOptions: [1, 2, 4, 8, 12] },
  { id: 'murabba', labelEn: 'Murabba', labelUr: 'مربع', toAcres: 25.0, quickOptions: [0.5, 1, 2, 4, 10] },
  { id: 'bigha', labelEn: 'Bigha', labelUr: 'بیگھہ', toAcres: 0.5, quickOptions: [2, 4, 8, 10, 20] },
];

export default function FertilizerCalculator({
  initialCrop = 'Wheat',
  initialAcres = 5.0,
  initialSoil = 'Loam (Mera)',
}: FertilizerCalculatorProps) {
  const [crop, setCrop] = useState<string>(initialCrop);
  const [acres, setAcres] = useState<number | string>(initialAcres);
  const [landUnit, setLandUnit] = useState<string>('acre');
  const [soilType, setSoilType] = useState<string>(initialSoil);
  const [targetYield, setTargetYield] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [plan, setPlan] = useState<FertilizerPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRestored, setIsRestored] = useState<boolean>(false);

  const selectedCropInfo = SUPPORTED_CROPS.find((c) => c.id.toLowerCase() === crop.toLowerCase()) || SUPPORTED_CROPS[0];
  const activeUnit = LAND_UNITS.find((u) => u.id === landUnit) || LAND_UNITS[0];

  const parsedArea = typeof acres === 'string' ? parseFloat(acres) : acres;
  const effectiveAcres = (!isNaN(parsedArea) && parsedArea > 0)
    ? roundDec(parsedArea * activeUnit.toAcres, 3)
    : 0;

  // Restore saved state from previous navigation
  useEffect(() => {
    const saved = loadSavedItem<any>('kd_fertilizer_state', null);
    if (saved) {
      if (saved.crop) setCrop(saved.crop);
      if (saved.acres !== undefined) setAcres(saved.acres);
      if (saved.landUnit) setLandUnit(saved.landUnit);
      if (saved.soilType) setSoilType(saved.soilType);
      if (saved.targetYield !== undefined) setTargetYield(saved.targetYield);
      if (saved.plan) setPlan(saved.plan);
    }
    setIsRestored(true);
  }, []);

  const calculatePlan = async () => {
    if (acres === '' || isNaN(parsedArea)) {
      return;
    }
    if (effectiveAcres <= 0) {
      setError('Cultivated land must be greater than 0. (زمین کا رقبہ 0 سے زیادہ ہونا چاہیے)');
      return;
    }

    setLoading(true);
    setError(null);

    const payload: FertilizerInput = {
      crop,
      acres: effectiveAcres,
      soil_type: soilType,
      target_yield: targetYield ? Number(targetYield) : null,
      preferred_language: 'english',
    };

    try {
      const res = await fetch('http://127.0.0.1:8000/api/fertilizer/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = `Calculation failed: ${res.statusText}`;
        try {
          const errData = await res.json();
          if (errData?.detail) {
            if (Array.isArray(errData.detail)) {
              msg = errData.detail.map((d: any) => d.msg || d.message).join(', ');
            } else if (typeof errData.detail === 'string') {
              msg = errData.detail;
            }
          }
        } catch {}
        throw new Error(msg);
      }

      const data: FertilizerPlan = await res.json();
      setPlan(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error calculating fertilizer';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Recalculate on input changes once restored
  useEffect(() => {
    if (isRestored && effectiveAcres > 0) {
      calculatePlan();
    }
  }, [crop, acres, soilType, landUnit, isRestored]);

  // Persist state across navigations
  useEffect(() => {
    if (!isRestored) return;
    saveItem('kd_fertilizer_state', {
      crop,
      acres,
      landUnit,
      soilType,
      targetYield,
      plan,
    });
  }, [crop, acres, landUnit, soilType, targetYield, plan, isRestored]);

  const handleReset = () => {
    setCrop('Wheat');
    setAcres(5.0);
    setLandUnit('acre');
    setSoilType('Loam (Mera)');
    setTargetYield('');
    clearItem('kd_fertilizer_state');
  };

  return (
    <div className="space-y-6">
      {/* Input Form Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-5 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                Deterministic Agronomy Calculation
              </span>
              <span className="text-xs text-slate-500 font-medium">PARC &amp; Dept. of Agriculture Benchmarks</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
              <span>Farm Parameters &amp; Requirements</span>
              <span className="text-sm font-normal text-slate-500">(فارم کے کوائف)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Select your crop, cultivated area, and soil texture to generate precise N-P-K nutrient allocations and bag counts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              title="Reset parameters to defaults"
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-300 transition text-xs sm:text-sm"
            >
              ↺ Reset Defaults
            </button>
            <button
              onClick={calculatePlan}
              disabled={loading}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Calculating...</span>
                </>
              ) : (
                <>
                  <span>🔄 Recalculate</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Crop Selector */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">
              🌾 Select Crop (فصل کا انتخاب):
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SUPPORTED_CROPS.map((c) => {
                const isSelected = crop.toLowerCase() === c.id.toLowerCase();
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCrop(c.id);
                      setTargetYield('');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 text-xs font-semibold cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-lg">{c.icon}</span>
                    <div>
                      <div className="font-bold text-slate-900">{c.id}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{c.nameUr}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cultivated Land & Unit Selector */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs sm:text-sm font-bold text-slate-700">
                  🌱 Cultivated Land (رقبہ):
                </label>
                {effectiveAcres > 0 && (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    ≈ {effectiveAcres} Acres ({roundDec(effectiveAcres * 8, 1)} Kanals)
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  placeholder="e.g. 5"
                  value={acres}
                  onChange={(e) => setAcres(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {activeUnit.quickOptions.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAcres(val)}
                    className={`px-2 py-1 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                      Number(acres) === val
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {val} {activeUnit.labelEn}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">
                🏜️ Soil Texture (مٹی کی قسم):
              </label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {SOIL_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.labelEn} — {s.labelUr} ({s.badge})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Target Yield & Price Notice */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2">
              🎯 Target Yield (ہدف پیداوار - Optional):
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder={`Standard: ${selectedCropInfo.benchmark} maunds`}
                value={targetYield}
                onChange={(e) => setTargetYield(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="inline-flex items-center px-3 bg-slate-100 border border-slate-300 rounded-xl text-slate-700 text-xs font-bold whitespace-nowrap">
                Maunds/Ac
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              Standard average yield for <strong>{selectedCropInfo.id} ({selectedCropInfo.nameUr})</strong> is ~<strong>{selectedCropInfo.benchmark} maunds/acre</strong>. If you enter a higher target, fertilizer dosage is adjusted proportionally.
            </p>

            {/* Price Estimate Alert */}
            <div className="mt-3.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
              <span className="text-base flex-shrink-0">⚠️</span>
              <div className="text-[11px] leading-relaxed">
                <strong>Market Price Estimates:</strong> All product costs reflect current retail survey benchmarks (Urea ~PKR 4,600, DAP ~PKR 12,800, SOP ~PKR 14,500). Actual dealer rates may vary by district.
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2">
            <span>❌</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Plan Results Display */}
      {plan && (
        <div className="space-y-6">
          {/* Key Output Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* DAP Bags Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-teal-800 text-xs font-bold uppercase tracking-wider">
                    Phosphorus (DAP)
                  </span>
                  <span className="text-[10px] bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded border border-teal-200">
                    ڈی اے پی
                  </span>
                </div>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 flex items-baseline gap-2">
                  {plan.dap_bags}
                  <span className="text-sm font-semibold text-slate-500">Bags</span>
                </div>
                <div className="text-xs text-slate-600 mt-1.5">
                  50 kg Bag • Est. Cost: <strong className="text-slate-900">PKR {plan.dap_cost_pkr.toLocaleString()}</strong>*
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Timing: Basal / At Sowing</span>
                <span className="font-semibold text-teal-700">بجائی کے وقت</span>
              </div>
            </div>

            {/* Urea Bags Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-800 text-xs font-bold uppercase tracking-wider">
                    Nitrogen (Urea)
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                    یوریا
                  </span>
                </div>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 flex items-baseline gap-2">
                  {plan.urea_bags}
                  <span className="text-sm font-semibold text-slate-500">Bags</span>
                </div>
                <div className="text-xs text-slate-600 mt-1.5">
                  50 kg Bag • Est. Cost: <strong className="text-slate-900">PKR {plan.urea_cost_pkr.toLocaleString()}</strong>*
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Timing: Irrigation Splits</span>
                <span className="font-semibold text-emerald-700">اقساط میں</span>
              </div>
            </div>

            {/* SOP Bags Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-amber-800 text-xs font-bold uppercase tracking-wider">
                    Potassium (SOP)
                  </span>
                  <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200">
                    پوٹاش
                  </span>
                </div>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 flex items-baseline gap-2">
                  {plan.sop_bags}
                  <span className="text-sm font-semibold text-slate-500">Bags</span>
                </div>
                <div className="text-xs text-slate-600 mt-1.5">
                  {plan.sop_bags > 0 ? (
                    <>50 kg Bag • Est. Cost: <strong className="text-slate-900">PKR {plan.sop_cost_pkr.toLocaleString()}</strong>*</>
                  ) : (
                    'Optional / minimal requirement for this crop'
                  )}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Grain Weight &amp; Filling</span>
                <span className="font-semibold text-amber-700">دانے کا وزن</span>
              </div>
            </div>

            {/* Total Estimated Cost Card */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-2xl p-5 shadow-md relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                    Est. Total Cost
                  </span>
                  <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded">
                    تخمینہ
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white mt-2">
                  PKR {plan.estimated_total_cost_pkr.toLocaleString()}
                </div>
                <div className="text-xs text-emerald-100 mt-1">
                  Avg: <strong>PKR {Math.round(plan.estimated_total_cost_pkr / plan.acres).toLocaleString()}</strong> / acre
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/20 text-[11px] text-emerald-200">
                Total for {acres} {activeUnit.labelEn} ({activeUnit.labelUr}) {landUnit !== 'acre' ? `(≈ ${plan.acres} Acres)` : ''} of {plan.crop} ({plan.crop_ur})
              </div>
            </div>
          </div>

          {/* Pure Elemental N-P-K Nutrition Breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>📊 Elemental N-P-K Nutrient Requirements</span>
                <span className="text-xs font-normal text-slate-500">(خالص غذائی عناصر کی ضرورت)</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">Total pure active kilograms</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Nitrogen */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-slate-800">Nitrogen (N)</span>
                  <span className="text-base font-extrabold text-emerald-800">{plan.nitrogen_requirement_kg} kg</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '100%' }}></div>
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  From DAP: <strong>{roundDec((plan.dap_bags * 9.0), 1)} kg N</strong> | From Urea: <strong>{roundDec((plan.urea_bags * 23.0), 1)} kg N</strong>
                </div>
              </div>

              {/* Phosphorus */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-slate-800">Phosphorus (P)</span>
                  <span className="text-base font-extrabold text-teal-800">{plan.phosphorus_requirement_kg} kg</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-600 h-full rounded-full" style={{ width: '100%' }}></div>
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  100% supplied via DAP (at 23 kg P<sub>2</sub>O<sub>5</sub> per 50 kg bag)
                </div>
              </div>

              {/* Potassium */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-slate-800">Potassium (K)</span>
                  <span className="text-base font-extrabold text-amber-800">{plan.potassium_requirement_kg} kg</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: plan.potassium_requirement_kg > 0 ? '100%' : '0%' }}></div>
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  {plan.potassium_requirement_kg > 0 ? 'Supplied via SOP (at 25 kg K2O per bag)' : 'Minimal baseline requirement'}
                </div>
              </div>
            </div>
          </div>

          {/* Application Schedule & Agronomy Guidance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timeline */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                  <span>🗓️ Application Schedule &amp; Timings</span>
                  <span className="text-xs font-normal text-slate-500">(کھاد کے مراحل)</span>
                </h3>
                <div className="space-y-3">
                  {(plan.application_schedule_en && plan.application_schedule_en.length > 0
                    ? plan.application_schedule_en
                    : plan.application_schedule
                  ).map((stepEn, idx) => {
                    const stepUr = plan.application_schedule_ur?.[idx];
                    return (
                      <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="text-slate-800 font-bold text-xs sm:text-sm leading-relaxed">
                            {stepEn}
                          </p>
                        </div>
                        {stepUr && (
                          <div className="pl-9 text-slate-500 text-xs leading-relaxed font-normal">
                            {stepUr}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Agronomic Advice & Safety Notice */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                  <span>🌾 Agronomic Advisory</span>
                  <span className="text-xs font-normal text-slate-500">(زرعی رہنمائی)</span>
                </h3>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-xs sm:text-sm leading-relaxed mb-3 font-medium">
                  {plan.agronomic_advice_english}
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs leading-relaxed">
                  <span className="font-bold text-slate-800 block mb-1">Urdu Guidance (اردو رہنمائی):</span>
                  {plan.agronomic_advice_urdu}
                </div>
              </div>

              {/* Strict Pesticide Safety Notice */}
              <div className="mt-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                <span className="text-xl flex-shrink-0">🛡️</span>
                <div className="text-xs text-rose-900 leading-relaxed">
                  <strong>Safety Notice:</strong> {plan.safety_notice}
                  <br />
                  <span className="text-rose-700 text-[11px] mt-0.5 block">
                    For insect, weed, or fungal treatment, always use the dedicated <strong>Pest Doctor</strong> module for safe dosages and pre-harvest intervals.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function roundDec(val: number, dec: number): number {
  const factor = Math.pow(10, dec);
  return Math.round(val * factor) / factor;
}
