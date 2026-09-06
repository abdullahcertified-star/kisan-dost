'use client';

import React, { useState, useEffect } from 'react';
import SaaSLayout from '@/components/SaaSLayout';
import { diagnosePestProblem, fetchPestDatabase } from '@/lib/api';
import { PestDiagnosis, PestDiagnosisRequest } from '@/types';
import { loadSavedItem, saveItem } from '@/lib/storage';

const QUICK_PRESETS = [
  {
    label: 'Cotton Whitefly (سفید مکھی)',
    crop: 'Cotton',
    symptoms: 'Tiny white moth-like flies fluttering under leaves, sticky honeydew secretion, and black sooty mold on foliage.',
    icon: '🪰',
  },
  {
    label: 'Cotton Pink Bollworm (گلابی سنڈی)',
    crop: 'Cotton',
    symptoms: 'Rosetted flowers failing to open, pinhead entry holes in young bolls, and small pink caterpillars inside green bolls.',
    icon: '🐛',
  },
  {
    label: 'Wheat Yellow Rust (گندم کا زرد زنگ)',
    crop: 'Wheat',
    symptoms: 'Bright yellow powdery pustules arranged in linear stripes along wheat leaf veins in cool humid weather.',
    icon: '🌾',
  },
  {
    label: 'Rice Blast (چاول کا بلاسٹ)',
    crop: 'Rice',
    symptoms: 'Spindle-shaped eye spots with gray or whitish centers and dark reddish-brown borders on rice leaves.',
    icon: '🍚',
  },
  {
    label: 'Rice Stem Borer (تنے کی سنڈی)',
    crop: 'Rice',
    symptoms: 'Dead hearts with drying central shoots during vegetative stage and white heads with empty chaffy grains at panicle stage.',
    icon: '🌾',
  },
  {
    label: 'Maize Fall Armyworm (لشکری سنڈی)',
    crop: 'Maize',
    symptoms: 'Extensive ragged pinholes and skeletonized leaves in maize whorl with heavy sawdust-like caterpillar frass.',
    icon: '🌽',
  },
  {
    label: 'Potato Late Blight (آلو کا پچھیتا جھلساؤ)',
    crop: 'Vegetables',
    symptoms: 'Water-soaked irregular blackish-brown lesions on leaves with white cottony mildew underneath during cold foggy weather.',
    icon: '🥔',
  },
  {
    label: 'Tomato Leaf Curl Virus (مروڑیا روگ)',
    crop: 'Vegetables',
    symptoms: 'Severe upward curling, cupping, and crinkling of tomato leaves with bushy stunted growth and flower drop.',
    icon: '🍅',
  },
  {
    label: 'Safety Test: Human Medical Query (طبی استفسار)',
    crop: 'All',
    symptoms: 'I have severe fever, body ache, cough, and chest pain. What antibiotic medicine should I take?',
    icon: '⚠️',
  },
];

export default function PestDoctorPage() {
  const [selectedCrop, setSelectedCrop] = useState<string>('Cotton');
  const [district, setDistrict] = useState<string>('Multan');
  const [acres, setAcres] = useState<number>(5.0);
  const [symptoms, setSymptoms] = useState<string>(
    'Tiny white moth-like flies fluttering under leaves, sticky honeydew secretion, and black sooty mold on foliage.'
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<PestDiagnosis | null>(null);

  // Knowledge base browser state
  const [kbPests, setKbPests] = useState<any[]>([]);
  const [kbLoading, setKbLoading] = useState<boolean>(false);
  const [kbFilterCrop, setKbFilterCrop] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'doctor' | 'database'>('doctor');

  // Restore previous inputs from storage
  useEffect(() => {
    const saved = loadSavedItem<any>('kd_pest_doctor_state', null);
    if (saved) {
      if (saved.crop) setSelectedCrop(saved.crop);
      if (saved.district) setDistrict(saved.district);
      if (saved.acres) setAcres(saved.acres);
      if (saved.symptoms) setSymptoms(saved.symptoms);
    }
  }, []);

  // Save inputs to storage
  useEffect(() => {
    saveItem('kd_pest_doctor_state', {
      crop: selectedCrop,
      district,
      acres,
      symptoms,
    });
  }, [selectedCrop, district, acres, symptoms]);

  // Load database on mount
  useEffect(() => {
    setKbLoading(true);
    fetchPestDatabase(kbFilterCrop === 'All' ? undefined : kbFilterCrop)
      .then((data) => setKbPests(data))
      .catch(() => setKbPests([]))
      .finally(() => setKbLoading(false));
  }, [kbFilterCrop]);

  const handleDiagnose = async (overrideSymptoms?: string, overrideCrop?: string) => {
    const sym = overrideSymptoms || symptoms;
    const crp = overrideCrop || selectedCrop;

    if (!sym || sym.trim().length < 5) {
      setError('Please provide a detailed symptom description (at least 5 characters).');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const payload: PestDiagnosisRequest = {
        crop: crp === 'All' ? undefined : crp,
        symptoms: sym,
        district,
        acres: Number(acres) || 5.0,
      };
      const result = await diagnosePestProblem(payload);
      setDiagnosis(result);
    } catch (err: any) {
      setError(err.message || 'Diagnostic failed. Please check network and try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    setSelectedCrop(preset.crop === 'All' ? 'Cotton' : preset.crop);
    setSymptoms(preset.symptoms);
    handleDiagnose(preset.symptoms, preset.crop);
  };

  return (
    <SaaSLayout
      title="Pest & Disease Doctor"
      subtitle="PARC & Punjab Extension verified IPM diagnostics and treatments"
      badge="Verified IPM"
    >
        {/* Page Header */}
        <div className="mb-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider bg-emerald-700/80 text-emerald-100 px-3 py-1 rounded-full border border-emerald-500/30">
                Phase 6 — Pest &amp; Disease Doctor
              </span>
              <span className="text-xs font-medium bg-amber-500/20 text-amber-200 px-3 py-1 rounded-full border border-amber-400/30">
                Zero Invented Dosages Guardrail
              </span>
              <span className="text-xs font-medium bg-teal-500/20 text-teal-200 px-3 py-1 rounded-full border border-teal-400/30">
                PARC &amp; Punjab Agri Verified Grounding
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Pest &amp; Disease Doctor (ڈاکٹر برائے کیڑے و بیماریاں)
            </h1>
            <p className="mt-2 text-sm sm:text-base text-emerald-100/90 max-w-3xl leading-relaxed">
              Diagnostic assistant powered by Google Gemini &amp; verified agronomic benchmarks. 
              Diagnose crop issues, review qualitative confidence &amp; alternatives, follow safe cultural first steps, 
              and access strictly verified chemical treatments with mandatory PPE and pollinator protection.
            </p>

            {/* Navigation Tabs */}
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setActiveTab('doctor')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 ${
                  activeTab === 'doctor'
                    ? 'bg-white text-emerald-950 shadow-md'
                    : 'bg-emerald-800/60 hover:bg-emerald-800 text-white border border-emerald-700/50'
                }`}
              >
                <span>🔬</span>
                <span>Symptom Diagnostic Tool (تشخیصی کلینک)</span>
              </button>
              <button
                onClick={() => setActiveTab('database')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 ${
                  activeTab === 'database'
                    ? 'bg-white text-emerald-950 shadow-md'
                    : 'bg-emerald-800/60 hover:bg-emerald-800 text-white border border-emerald-700/50'
                }`}
              >
                <span>📚</span>
                <span>Verified Knowledge Base (زرعی ڈیٹا بیس)</span>
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'doctor' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Form & Quick Presets (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Diagnostic Input Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h2 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                    <span>🔍</span>
                    <span>Farm Diagnostic Parameters</span>
                  </h2>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Bilingual AI
                  </span>
                </div>

                {/* Crop & District */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cultivated Crop (فصل):
                    </label>
                    <select
                      value={selectedCrop}
                      onChange={(e) => setSelectedCrop(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    >
                      <option value="Cotton">Cotton (کپاس)</option>
                      <option value="Wheat">Wheat (گندم)</option>
                      <option value="Rice">Rice (چاول / دھان)</option>
                      <option value="Maize">Maize (مکئی)</option>
                      <option value="Vegetables">Vegetables (آلو، ٹماٹر، سبزیاں)</option>
                      <option value="All">Other / Not Sure (تمام)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      District (ضلع):
                    </label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Multan, Faisalabad"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Acres */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cultivated Land (رقبہ ایکڑ میں):
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={acres}
                    onChange={(e) => setAcres(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                {/* Symptom Input Area */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Describe Observed Symptoms (فصل کی علامات اور بیماری بیان کریں):
                  </label>
                  <textarea
                    rows={4}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Describe what you see: leaf discoloration, curling, spots, wilting, caterpillar feeding, pests under leaves..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    💡 Supports English, Urdu (اردو), and Roman Urdu (e.g. 'patte peeley ho rahe hain, choti safed makkhi hai').
                  </p>
                </div>

                {/* Diagnose Button */}
                <button
                  onClick={() => handleDiagnose()}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Diagnosing with AI &amp; Knowledge Base...</span>
                    </>
                  ) : (
                    <>
                      <span>🔬</span>
                      <span>Run AI Pest Diagnosis (تشخیص کریں)</span>
                      <span>→</span>
                    </>
                  )}
                </button>

                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs">
                    ⚠️ {error}
                  </div>
                )}
              </div>

              {/* Quick Pakistani Agronomic Presets */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    ⚡ Quick Test Presets (مشہور بیماریاں)
                  </h3>
                  <span className="text-[10px] text-slate-400">Click to diagnose</span>
                </div>
                <div className="space-y-2">
                  {QUICK_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyPreset(p)}
                      className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition flex items-start space-x-2.5 text-xs group"
                    >
                      <span className="text-base flex-shrink-0 mt-0.5">{p.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 group-hover:text-emerald-900 truncate">
                          {p.label}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {p.symptoms}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Diagnostic Output Card (7 cols) */}
            <div className="lg:col-span-7">
              {!diagnosis && !loading && (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center text-slate-400 space-y-3 h-full min-h-[450px]">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center text-3xl">
                    🔬
                  </div>
                  <h3 className="font-bold text-slate-700 text-lg">No Diagnosis Generated Yet</h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md">
                    Select a crop, describe the visible plant symptoms or click one of the quick presets on the left to run an automated diagnosis grounded in verified agronomic data.
                  </p>
                </div>
              )}

              {loading && (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center text-slate-400 space-y-4 h-full min-h-[450px]">
                  <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Running Agricultural Pest &amp; Disease Diagnostic</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Correlating symptoms with PARC benchmarks and enforcing safety guardrails...
                    </p>
                  </div>
                </div>
              )}

              {diagnosis && !loading && (
                <div className="space-y-4">
                  {/* Case 1: Human Medical Query Intercepted */}
                  {diagnosis.is_medical_query_rejected ? (
                    <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center text-2xl flex-shrink-0">
                          🛑
                        </div>
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider bg-rose-200 text-rose-800 px-2 py-0.5 rounded">
                            Safety Intercept Active
                          </span>
                          <h2 className="text-lg font-bold text-rose-950 mt-1">
                            {diagnosis.primary_diagnosis}
                          </h2>
                        </div>
                      </div>

                      <div className="p-4 bg-white/80 rounded-xl border border-rose-200 text-xs sm:text-sm text-rose-900 leading-relaxed space-y-2">
                        <p className="font-semibold">{diagnosis.symptom_analysis}</p>
                        <p className="text-slate-700 pt-2 border-t border-rose-100">
                          {diagnosis.medical_rejection_notice}
                        </p>
                      </div>

                      <div className="p-3.5 bg-rose-100/70 rounded-xl text-xs text-rose-900 font-medium">
                        ⚠️ <strong>Mandatory Safety Rule:</strong> Under no circumstances should agricultural pesticides, insecticides, or plant chemicals ever be ingested or used on humans.
                      </div>
                    </div>
                  ) : (
                    /* Case 2: Valid Agricultural Diagnosis */
                    <>
                      {/* Top Summary Banner */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Primary Diagnosis (بنیادی تشخیص)
                            </span>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center space-x-2 mt-0.5">
                              <span>{diagnosis.primary_diagnosis}</span>
                            </h2>
                            <span className="text-xs text-slate-500 italic">
                              Scientific: {diagnosis.scientific_name} | {diagnosis.category}
                            </span>
                          </div>

                          {/* Confidence Badge */}
                          <div className="text-right">
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
                              Diagnostic Confidence
                            </span>
                            <span
                              className={`inline-block text-xs font-black px-3 py-1 rounded-full border shadow-2xs ${
                                diagnosis.confidence === 'High'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : diagnosis.confidence === 'Moderate'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-purple-100 text-purple-800 border-purple-300'
                              }`}
                            >
                              ⭐ {diagnosis.confidence} Confidence
                            </span>
                          </div>
                        </div>

                        {/* Symptom Analysis Narrative */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                          {diagnosis.symptom_analysis}
                        </div>

                        {/* Environmental Risk Factors */}
                        {diagnosis.risk_factors && diagnosis.risk_factors.length > 0 && (
                          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1.5">
                            <span className="font-bold text-amber-900 block">
                              ⚠️ Favorable Environmental Risk Factors (موافق موسمی حالات):
                            </span>
                            <ul className="list-disc pl-5 text-amber-950 space-y-0.5">
                              {diagnosis.risk_factors.map((rf, i) => (
                                <li key={i}>{rf}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Immediate Safe First Steps (Non-Chemical Management) */}
                      <div className="bg-emerald-50/60 rounded-2xl border border-emerald-200 p-5 shadow-xs space-y-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">🌿</span>
                          <h3 className="font-bold text-emerald-950 text-sm sm:text-base">
                            Safe Immediate First Steps (غیر کیمیائی فوری اقدامات)
                          </h3>
                        </div>
                        <p className="text-xs text-emerald-800">
                          Prioritize integrated pest management (IPM), cultural sanitation, and biological practices before applying toxic chemical sprays:
                        </p>
                        <div className="space-y-2">
                          {(diagnosis.non_chemical_management || []).map((step, idx) => (
                            <div
                              key={idx}
                              className="bg-white rounded-xl p-3 border border-emerald-200/70 text-xs sm:text-sm text-slate-800 flex items-start space-x-2.5 shadow-2xs"
                            >
                              <span className="text-emerald-700 font-bold text-base leading-none">✓</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Verified Treatment Information */}
                      {diagnosis.verified_treatment && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                              <span>💊</span>
                              <span>Verified Chemical Treatment Information (تصدیق شدہ کیمیائی علاج)</span>
                            </h3>
                            <span className="text-[11px] font-bold bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-md border border-teal-200">
                              PARC Verified
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                              <span className="text-slate-500 block">Recommended Active Ingredient:</span>
                              <span className="font-bold text-slate-900 text-sm block mt-0.5">
                                {diagnosis.verified_treatment.active_ingredient}
                              </span>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                              <span className="text-slate-500 block">Market Registered Trade Names:</span>
                              <span className="font-bold text-slate-800 text-sm block mt-0.5">
                                {diagnosis.verified_treatment.trade_names?.join(', ') || 'Consult local registered dealer'}
                              </span>
                            </div>

                            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 sm:col-span-2">
                              <span className="text-emerald-800 font-bold block">Verified Safe Dosage per Acre:</span>
                              <span className="font-black text-emerald-950 text-base block mt-0.5">
                                {diagnosis.verified_treatment.safe_dosage_per_acre || 'Refer strictly to registered bottle label'}
                              </span>
                              <span className="text-[11px] text-emerald-700 block mt-1">
                                Water Volume: {diagnosis.verified_treatment.water_volume_liters_per_acre || 100} Liters per Acre
                              </span>
                            </div>
                          </div>

                          {diagnosis.verified_treatment.application_instructions && (
                            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <strong>Application Protocol:</strong> {diagnosis.verified_treatment.application_instructions}
                            </div>
                          )}

                          {/* Mandatory Label Disclaimer & Safety Guardrail */}
                          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900 space-y-1.5">
                            <div className="font-bold text-amber-950 flex items-center space-x-1.5">
                              <span>🛡️</span>
                              <span>MANDATORY DOSAGE &amp; APPLICATION DISCLAIMER</span>
                            </div>
                            <p className="leading-relaxed">
                              {diagnosis.dosage_disclaimer}
                            </p>
                            <p className="text-[11px] text-amber-800 pt-1 border-t border-amber-200">
                              Source Attribution: {diagnosis.source}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Alternative Diagnostic Possibilities */}
                      {diagnosis.alternative_possibilities && diagnosis.alternative_possibilities.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                            <span>🔄</span>
                            <span>Alternative Diagnostic Possibilities (دیگر ممکنہ امراض و مسائل)</span>
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(diagnosis.alternative_possibilities || []).map((alt, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-900">{alt.pest_name}</span>
                                  <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded">
                                    {alt.likelihood}
                                  </span>
                                </div>
                                <p className="text-slate-600 text-[11px]">
                                  <strong>Distinguishing Feature:</strong> {alt.distinguishing_feature}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Handling Precautions, PPE & Pollinators */}
                      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <h3 className="font-bold text-sm flex items-center space-x-2 text-emerald-400">
                            <span>⚠️</span>
                            <span>Worker PPE &amp; Environmental Protection (حفاظتی ہدایات)</span>
                          </h3>
                          {diagnosis.phi_days && (
                            <span className="text-xs bg-amber-400 text-slate-950 font-bold px-2.5 py-0.5 rounded-full">
                              PHI: {diagnosis.phi_days} Days
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 text-xs text-slate-300">
                          {diagnosis.safety_notes?.map((note, i) => (
                            <div key={i} className="flex items-start space-x-2">
                              <span className="text-amber-400 font-bold mt-0.5">•</span>
                              <span>{note}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Knowledge Base Browser Section */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Verified Agricultural Pest &amp; Disease Knowledge Base
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Officially verified plant pathology records from the Pakistan Agricultural Research Council (PARC) and Provincial Agriculture Departments.
                </p>
              </div>

              {/* Crop Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-700">Filter Crop:</span>
                <select
                  value={kbFilterCrop}
                  onChange={(e) => setKbFilterCrop(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="All">All Crops (تمام)</option>
                  <option value="Cotton">Cotton (کپاس)</option>
                  <option value="Wheat">Wheat (گندم)</option>
                  <option value="Rice">Rice (چاول)</option>
                  <option value="Maize">Maize (مکئی)</option>
                  <option value="Vegetables">Vegetables (سبزیاں)</option>
                </select>
              </div>
            </div>

            {kbLoading ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Loading verified agricultural records...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kbPests.map((pest, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50/80 rounded-2xl border border-slate-200 p-5 space-y-3 hover:border-emerald-500 transition shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            {pest.crop}
                          </span>
                          <h3 className="font-extrabold text-slate-900 text-base mt-1">
                            {pest.pest_name}
                          </h3>
                        </div>
                        <span className="text-xs text-slate-500 italic bg-white px-2 py-0.5 rounded border border-slate-200">
                          {pest.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 italic mb-2">
                        Scientific: {pest.scientific_name}
                      </p>

                      {/* Symptoms */}
                      <div className="text-xs space-y-1 mb-3">
                        <span className="font-bold text-slate-700 block">Key Symptoms:</span>
                        <ul className="list-disc pl-4 text-slate-600 space-y-0.5">
                          {pest.symptoms?.slice(0, 3).map((s: string, sIdx: number) => (
                            <li key={sIdx}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Verified Treatment */}
                      {pest.verified_treatment && (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                          <div className="font-bold text-emerald-900 flex items-center justify-between">
                            <span>Verified Treatment:</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              PHI: {pest.phi_days || 14}d
                            </span>
                          </div>
                          <div className="text-slate-800 font-medium">
                            • Ingredient: {pest.verified_treatment.active_ingredient}
                          </div>
                          <div className="text-slate-800 font-medium">
                            • Safe Dosage: <span className="font-bold text-emerald-800">{pest.verified_treatment.safe_dosage_per_acre}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Source: Punjab Agri &amp; PARC</span>
                      <button
                        onClick={() => {
                          setSelectedCrop(pest.crop);
                          setSymptoms(pest.symptoms?.[0] || '');
                          setActiveTab('doctor');
                          handleDiagnose(pest.symptoms?.[0] || '', pest.crop);
                        }}
                        className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg transition shadow-2xs"
                      >
                        Diagnose This →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </SaaSLayout>
  );
}
