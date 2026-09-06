'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  fetchCropAdvisor,
  fetchFertilizerPlan,
  fetchPestDiagnosis,
  fetchMandiPrices,
  fetchProfitEstimate,
  fetchGovtSchemes,
} from '@/lib/api';

interface AgronomyToolkitProps {
  district: string;
  acres: number;
  crop: string;
  soil: string;
  season?: string;
  water?: string;
}

export default function AgronomyToolkit({
  district,
  acres,
  crop,
  soil,
  season = 'Rabi',
  water = 'Limited'
}: AgronomyToolkitProps) {
  const [activeTab, setActiveTab] = useState<'crop' | 'fertilizer' | 'pest' | 'mandi' | 'profit' | 'schemes'>('crop');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Tool outputs state
  const [cropPlan, setCropPlan] = useState<any>(null);
  const [fertPlan, setFertPlan] = useState<any>(null);
  const [pestPlan, setPestPlan] = useState<any>(null);
  const [mandiReport, setMandiReport] = useState<any>(null);
  const [profitPlan, setProfitPlan] = useState<any>(null);
  const [govtReport, setGovtReport] = useState<any>(null);

  // Custom pest symptoms state
  const [symptomsInput, setSymptomsInput] = useState<string>('cotton leaves curling, tiny white insects');

  // Load active tab data
  useEffect(() => {
    setError(null);
    setLoading(true);

    if (activeTab === 'crop') {
      fetchCropAdvisor({ district, soil_type: soil, season, land_acres: acres, water_availability: water })
        .then(setCropPlan)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    } else if (activeTab === 'fertilizer') {
      fetchFertilizerPlan({ crop, acres })
        .then(setFertPlan)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    } else if (activeTab === 'pest') {
      fetchPestDiagnosis({ crop, symptoms: symptomsInput, acres })
        .then(setPestPlan)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    } else if (activeTab === 'mandi') {
      fetchMandiPrices(crop, district)
        .then(setMandiReport)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    } else if (activeTab === 'profit') {
      fetchProfitEstimate({ crop, acres })
        .then(setProfitPlan)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    } else if (activeTab === 'schemes') {
      fetchGovtSchemes('Punjab', acres)
        .then(setGovtReport)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [activeTab, district, acres, crop, soil, season, water]);

  const runCustomPestDiagnosis = () => {
    setLoading(true);
    fetchPestDiagnosis({ crop, symptoms: symptomsInput, acres })
      .then(setPestPlan)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const tabs = [
    { id: 'crop', label: 'Crop Advisor', icon: '🌾', urdu: 'فصل کا مشورہ' },
    { id: 'fertilizer', label: 'Fertilizer Plan', icon: '⚖️', urdu: 'کھاد کا حساب' },
    { id: 'pest', label: 'Pest Doctor', icon: '🔬', urdu: 'بیماری و سپرے' },
    { id: 'mandi', label: 'Mandi Rates', icon: '📈', urdu: 'منڈی ریٹس' },
    { id: 'profit', label: 'Profit Budget', icon: '💰', urdu: 'سیزن بجٹ' },
    { id: 'schemes', label: 'Govt Schemes', icon: '🏛️', urdu: 'کسان کارڈ' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-5 flex flex-col h-[700px] overflow-hidden">
      {/* Header & Tabs */}
      <div className="border-b border-slate-200 pb-3 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-slate-800 text-lg flex items-center space-x-2">
            <span>🛠️ Agricultural Decision Toolkit</span>
          </h3>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
            Deterministic + Verified Data
          </span>
        </div>

        {/* Tab Buttons */}
        <div className="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === t.id
                  ? 'bg-emerald-800 text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              <span className="opacity-75 text-[10px]">({t.urdu})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pr-1">
        {loading && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm">Calculating agronomic data...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
            ⚠️ Error loading data: {error}
          </div>
        )}

        {/* TAB 1: CROP ADVISOR */}
        {!loading && activeTab === 'crop' && cropPlan && (
          <div className="space-y-4">
            <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-xs leading-relaxed text-emerald-900">
              <span className="font-bold block mb-1">Agronomy Summary for {cropPlan.district}:</span>
              {cropPlan.overall_agronomy_summary}
            </div>

            <div className="space-y-3">
              {cropPlan.top_recommendations.map((rec: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-emerald-500 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-900 text-base">{rec.crop_name}</h4>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                      {rec.suitability_score}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-2">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-500 block">Avg Yield</span>
                      <span className="font-bold text-slate-800">{rec.expected_yield_maunds_per_acre} maunds/acre</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-500 block">Total Yield</span>
                      <span className="font-bold text-slate-800">{rec.total_expected_yield_maunds} maunds</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-500 block">Est. Cost</span>
                      <span className="font-bold text-slate-800">PKR {rec.estimated_cost_pkr?.toLocaleString()}</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-emerald-300 bg-emerald-50/50">
                      <span className="text-emerald-700 font-bold block">Net Profit</span>
                      <span className="font-extrabold text-emerald-900 text-sm">
                        PKR {rec.net_profit_pkr?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {rec.reasons && rec.reasons.length > 0 && (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded-lg mb-1.5 border border-emerald-200/50">
                      <strong>✅ Key Reason:</strong> {rec.reasons[0]}
                    </div>
                  )}
                  {rec.risks && rec.risks.length > 0 && (
                    <div className="text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded-lg mb-2 border border-amber-200/50">
                      <strong>⚠️ Watchpoint:</strong> {rec.risks[0]}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>🗓️ Sowing: {rec.sowing_window}</span>
                    <span>💧 Water: {rec.water_requirement}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: FERTILIZER CALCULATOR */}
        {!loading && activeTab === 'fertilizer' && fertPlan && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-900 text-sm">
                  Recommended Fertilizer Plan ({fertPlan.acres} Acres of {fertPlan.crop}):
                </h4>
                <Link
                  href="/fertilizer"
                  className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-2.5 py-1 rounded-lg transition"
                >
                  Open Full Calculator ↗
                </Link>
              </div>

              {/* Elemental NPK Requirements */}
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 font-bold block">Nitrogen (N)</span>
                  <span className="text-sm font-extrabold text-emerald-950">{fertPlan.nitrogen_requirement_kg || Math.round(fertPlan.acres * 50)} kg</span>
                </div>
                <div className="bg-teal-50/60 p-2 rounded-lg border border-teal-200">
                  <span className="text-[10px] text-teal-800 font-bold block">Phosphorus (P)</span>
                  <span className="text-sm font-extrabold text-teal-950">{fertPlan.phosphorus_requirement_kg || Math.round(fertPlan.acres * 35)} kg</span>
                </div>
                <div className="bg-amber-50/60 p-2 rounded-lg border border-amber-200">
                  <span className="text-[10px] text-amber-800 font-bold block">Potassium (K)</span>
                  <span className="text-sm font-extrabold text-amber-950">{fertPlan.potassium_requirement_kg || Math.round(fertPlan.acres * 25)} kg</span>
                </div>
              </div>

              {/* Bags Allocation */}
              <div className="grid grid-cols-3 gap-3 text-center mb-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 block">Urea (یوریا)</span>
                  <span className="text-2xl font-extrabold text-emerald-700">{fertPlan.urea_bags}</span>
                  <span className="text-xs text-slate-500 block mt-1">Bags (PKR {fertPlan.urea_cost_pkr?.toLocaleString()})*</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 block">DAP (ڈی اے پی)</span>
                  <span className="text-2xl font-extrabold text-teal-700">{fertPlan.dap_bags}</span>
                  <span className="text-xs text-slate-500 block mt-1">Bags (PKR {fertPlan.dap_cost_pkr?.toLocaleString()})*</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 block">SOP (پوٹاش)</span>
                  <span className="text-2xl font-extrabold text-indigo-700">{fertPlan.sop_bags}</span>
                  <span className="text-xs text-slate-500 block mt-1">Bags (PKR {fertPlan.sop_cost_pkr?.toLocaleString()})*</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-800 text-white rounded-xl flex items-center justify-between font-bold text-sm">
                <div>
                  <span>Est. Total Fertilizer Cost:</span>
                  <div className="text-[10px] text-emerald-200 font-normal">⚠️ Based on regional Punjab/Sindh market estimates</div>
                </div>
                <span className="text-lg">PKR {(fertPlan.estimated_total_cost_pkr || fertPlan.total_cost_pkr)?.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h5 className="font-bold text-slate-800 text-xs mb-2">Application Schedule &amp; Timings (کھاد کے مراحل):</h5>
              <div className="space-y-2 text-xs">
                {(fertPlan.application_schedule_en && fertPlan.application_schedule_en.length > 0
                  ? fertPlan.application_schedule_en
                  : fertPlan.application_schedule
                ).map((itemEn: string, i: number) => {
                  const itemUr = fertPlan.application_schedule_ur?.[i];
                  return (
                    <div key={i} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-0.5">
                      <div className="flex items-start space-x-2">
                        <span className="text-emerald-700 font-bold">✓</span>
                        <span className="font-semibold text-slate-800">{itemEn}</span>
                      </div>
                      {itemUr && (
                        <div className="pl-4 text-slate-500 text-[11px] font-normal">
                          {itemUr}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PEST DOCTOR & GUARDRAIL */}
        {!loading && activeTab === 'pest' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-3 rounded-xl flex items-center justify-between shadow-xs">
              <div>
                <span className="font-bold text-xs block">🔬 Dedicated Pest Doctor Clinic Available</span>
                <span className="text-[11px] text-emerald-100">Bilingual symptom analysis, PARC knowledge base &amp; safety guardrails</span>
              </div>
              <a
                href="/pest-doctor"
                className="bg-white text-emerald-900 font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-50 transition flex-shrink-0"
              >
                Open Clinic →
              </a>
            </div>

            {/* Custom Input */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-1">Describe Symptoms (علامات لکھیں):</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={symptomsInput}
                  onChange={(e) => setSymptomsInput(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={runCustomPestDiagnosis}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow"
                >
                  Diagnose
                </button>
              </div>
            </div>

            {pestPlan && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-bold text-base text-rose-800 flex items-center space-x-1">
                    <span>🔬 {pestPlan.pest_or_disease}</span>
                  </h4>
                  <span className="text-xs bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded">
                    Safe Dosage Validated
                  </span>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs space-y-1">
                  <div className="font-bold text-amber-900">🛡️ Pesticide Safety Guardrail:</div>
                  <div className="text-slate-800 font-medium">
                    • Chemical: <span className="font-bold">{pestPlan.chemical_treatment}</span>
                  </div>
                  <div className="text-slate-800 font-medium">
                    • Safe Dosage: <span className="font-bold text-emerald-800">{pestPlan.safe_dosage_ml_per_acre} ml/acre</span> (Max threshold: {pestPlan.max_safe_limit_ml_per_acre} ml)
                  </div>
                  <div className="text-slate-800 font-medium">
                    • Water Volume: <span className="font-bold">{pestPlan.water_liters_per_acre} Liters/acre</span>
                  </div>
                  <div className="text-slate-800 font-medium">
                    • Total Chemical for {acres} Acres: <span className="font-bold">{pestPlan.total_chemical_needed_ml} ml</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                  <span className="font-bold text-emerald-900 block mb-1">🌿 Organic / Bio Alternative:</span>
                  <p className="text-emerald-800">{pestPlan.organic_alternative}</p>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
                  <span className="font-bold block text-slate-800 mb-0.5">⚠️ Handling Precautions:</span>
                  {pestPlan.safety_warning} (Pre-Harvest Interval: {pestPlan.phi_days} days).
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MANDI RATES */}
        {!loading && activeTab === 'mandi' && mandiReport && (
          <div className="space-y-4">
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-900">
              <span className="font-bold block mb-0.5">Market Advisory:</span>
              {mandiReport.best_market_advice}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-900 font-bold">
                  <tr>
                    <th className="p-2.5 rounded-l-lg">Mandi (مارکیٹ)</th>
                    <th className="p-2.5">Min (PKR)</th>
                    <th className="p-2.5">Max (PKR)</th>
                    <th className="p-2.5">Avg Rate</th>
                    <th className="p-2.5 rounded-r-lg">Arrival (Maunds)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {mandiReport.rates.map((r: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">{r.mandi_name}</td>
                      <td className="p-2.5">{r.min_price_pkr}</td>
                      <td className="p-2.5">{r.max_price_pkr}</td>
                      <td className="p-2.5 font-extrabold text-emerald-700">PKR {r.avg_price_pkr}</td>
                      <td className="p-2.5">{r.arrival_maunds?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2">
              <Link
                href="/market"
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 transition shadow-sm"
              >
                <span>📈 View Full Mandi Price Hub & Multi-Market Charts</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        )}

        {/* TAB 5: PROFIT ESTIMATOR */}
        {!loading && activeTab === 'profit' && profitPlan && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block">Total Input Cost</span>
                <span className="text-lg font-bold text-slate-900">PKR {profitPlan.total_input_cost_pkr?.toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block">Gross Revenue</span>
                <span className="text-lg font-bold text-slate-900">PKR {profitPlan.expected_gross_revenue_pkr?.toLocaleString()}</span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-300">
                <span className="text-xs text-emerald-700 font-bold block">Net Profit</span>
                <span className="text-lg font-extrabold text-emerald-900">PKR {profitPlan.net_margin_pkr?.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <h4 className="font-bold text-slate-800 text-sm mb-2">Cost Breakdown ({profitPlan.acres} Acres):</h4>
              <div className="flex justify-between py-1 border-b">
                <span>Seed Cost (بیج کا خرچ):</span>
                <span className="font-semibold">PKR {profitPlan.seed_cost_pkr?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Land Preparation (زمین کی تیاری):</span>
                <span className="font-semibold">PKR {profitPlan.land_prep_cost_pkr?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Fertilizers (کھاد):</span>
                <span className="font-semibold">PKR {profitPlan.fertilizer_cost_pkr?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Pesticides & Spray (سپرے و ادویات):</span>
                <span className="font-semibold">PKR {profitPlan.pesticide_spray_cost_pkr?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Irrigation & Fuel (آبپاشی و ڈیزل):</span>
                <span className="font-semibold">PKR {profitPlan.irrigation_diesel_electricity_pkr?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Harvesting & Threshing (کٹائی):</span>
                <span className="font-semibold">PKR {profitPlan.harvesting_cost_pkr?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 pt-2 font-bold text-emerald-800">
                <span>Break-Even Yield (کم از کم پیداوار):</span>
                <span>{profitPlan.break_even_yield_maunds_per_acre} Maunds / Acre</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/profit"
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 transition shadow-sm"
              >
                <span>💰 Open Full Deterministic Profit & Sensitivity Calculator</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        )}

        {/* TAB 6: GOVT SCHEMES */}
        {!loading && activeTab === 'schemes' && govtReport && (
          <div className="space-y-3">
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-900">
              <span className="font-bold block mb-0.5">Eligibility Summary:</span>
              {govtReport.recommendation_summary}
            </div>

            {govtReport.matched_schemes.map((s: any, idx: number) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm text-emerald-900">{s.title}</h4>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                    {s.province}
                  </span>
                </div>
                <p className="text-slate-700 font-medium">🎁 <span className="font-bold">Benefit:</span> {s.benefit}</p>
                <p className="text-slate-600">📋 <span className="font-bold">Eligibility:</span> {s.eligibility}</p>
                <p className="text-slate-600">📝 <span className="font-bold">How to Apply:</span> {s.how_to_apply}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
