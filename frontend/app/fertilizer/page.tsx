'use client';

import React from 'react';
import Link from 'next/link';
import SaaSLayout from '@/components/SaaSLayout';
import FertilizerCalculator from '@/components/FertilizerCalculator';

export default function FertilizerPage() {
  return (
    <SaaSLayout
      title="Fertilizer & N-P-K Calculator"
      subtitle="Deterministic nutrient dosage, bag counts, and cost estimates based on PARC & Punjab Agri research"
      badge="PARC Verified"
    >
      {/* Navigation Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-semibold transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-slate-600 font-medium">Fertilizer Calculator (کھاد کیلکولیٹر)</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/advisor"
            className="px-3 py-1.5 font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            🌾 Crop Advisor
          </Link>
          <Link
            href="/weather"
            className="px-3 py-1.5 font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            🌦️ Live Weather
          </Link>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-sky-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-emerald-700/50 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-semibold">
            <span>🌾</span>
            <span>100% Deterministic Agronomy Math</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Fertilizer &amp; N-P-K Nutrient Calculator
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            Calculate exact nutrient requirements (Nitrogen, Phosphorus, Potassium), bag counts for DAP, Urea, and SOP, and realistic market cost estimates for major Pakistani crops based on PARC and Punjab Agriculture research benchmarks.
          </p>
        </div>
        <div className="absolute right-6 bottom-4 text-8xl opacity-10 select-none pointer-events-none hidden sm:block">
          🧪
        </div>
      </div>

      {/* Interactive Fertilizer Calculator */}
      <FertilizerCalculator initialCrop="Wheat" initialAcres={5.0} initialSoil="Loam (Mera)" />
    </SaaSLayout>
  );
}
