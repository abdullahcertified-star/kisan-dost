'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SaaSLayout from '@/components/SaaSLayout';
import { calculateProfit } from '@/lib/api';
import { ProfitInput, ProfitEstimate } from '@/types';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

import { loadSavedItem, saveItem, clearItem } from '@/lib/storage';

// Land unit conversion factors to standard acres
const LAND_UNITS: { [key: string]: { label: string; toAcres: number; urdu: string } } = {
  acres: { label: 'Acres (ایکڑ)', toAcres: 1.0, urdu: 'ایکڑ' },
  kanals: { label: 'Kanals (کنال)', toAcres: 0.125, urdu: 'کنال' }, // 8 kanals = 1 acre
  marlas: { label: 'Marlas (مرلہ)', toAcres: 0.00625, urdu: 'مرلہ' }, // 160 marlas = 1 acre
  khet: { label: 'Khet / Killa (کھیت / قلعہ)', toAcres: 1.0, urdu: 'قلعہ' }, // 1 killa = 1 acre
  murabba: { label: 'Murabba (مربع)', toAcres: 25.0, urdu: 'مربع' }, // 25 acres = 1 murabba
  bigha: { label: 'Bigha (بیگھہ)', toAcres: 0.5, urdu: 'بیگھہ' }, // 2 bigha = 1 acre
};

// Default agronomic benchmarks (per acre in PKR) to seed the calculator smoothly
const CROP_DEFAULTS: {
  [key: string]: {
    yieldPerAcre: number;
    mandiPrice: number;
    seedCost: number;
    fertCost: number;
    pestCost: number;
    irrigCost: number;
    laborCost: number;
    otherCost: number;
  };
} = {
  'Wheat (گندم)': {
    yieldPerAcre: 38.0,
    mandiPrice: 3900.0,
    seedCost: 7500.0,
    fertCost: 24000.0,
    pestCost: 5000.0,
    irrigCost: 12000.0,
    laborCost: 10000.0,
    otherCost: 4000.0,
  },
  'Cotton (کپاس)': {
    yieldPerAcre: 24.0,
    mandiPrice: 8200.0,
    seedCost: 12000.0,
    fertCost: 32000.0,
    pestCost: 28000.0,
    irrigCost: 18000.0,
    laborCost: 22000.0,
    otherCost: 6000.0,
  },
  'Rice (دھان / چاول)': {
    yieldPerAcre: 42.0,
    mandiPrice: 4200.0,
    seedCost: 6000.0,
    fertCost: 26000.0,
    pestCost: 14000.0,
    irrigCost: 28000.0,
    laborCost: 18000.0,
    otherCost: 5000.0,
  },
  'Maize (مکئی)': {
    yieldPerAcre: 75.0,
    mandiPrice: 2650.0,
    seedCost: 15000.0,
    fertCost: 34000.0,
    pestCost: 9000.0,
    irrigCost: 20000.0,
    laborCost: 14000.0,
    otherCost: 5000.0,
  },
  'Potato (آلو)': {
    yieldPerAcre: 250.0,
    mandiPrice: 1350.0,
    seedCost: 65000.0,
    fertCost: 48000.0,
    pestCost: 24000.0,
    irrigCost: 22000.0,
    laborCost: 25000.0,
    otherCost: 12000.0,
  },
  'Mustard / Canola (سرسوں / رایا)': {
    yieldPerAcre: 22.0,
    mandiPrice: 7100.0,
    seedCost: 4500.0,
    fertCost: 16000.0,
    pestCost: 4000.0,
    irrigCost: 8000.0,
    laborCost: 8000.0,
    otherCost: 3000.0,
  },
  'Chickpea / Gram (چنا)': {
    yieldPerAcre: 18.0,
    mandiPrice: 7600.0,
    seedCost: 6000.0,
    fertCost: 8000.0,
    pestCost: 5000.0,
    irrigCost: 4000.0,
    laborCost: 7000.0,
    otherCost: 3000.0,
  },
};

const PIE_COLORS = ['#059669', '#0284c7', '#d97706', '#dc2626', '#8b5cf6', '#64748b'];

function matchCropKey(name: string | null): string {
  if (!name) return 'Wheat (گندم)';
  const clean = name.trim().toLowerCase();
  for (const key of Object.keys(CROP_DEFAULTS)) {
    if (key.toLowerCase().includes(clean)) return key;
  }
  return 'Wheat (گندم)';
}

function ProfitCalculatorContent() {
  const searchParams = useSearchParams();
  const rawInitialCrop = searchParams.get('crop');
  const initialCrop = matchCropKey(rawInitialCrop);
  const initialPrice = searchParams.get('price');
  const initialMandi = searchParams.get('mandi');

  // Input states
  const [crop, setCrop] = useState<string>(initialCrop);
  const [landArea, setLandArea] = useState<string>('5');
  const [landUnit, setLandUnit] = useState<string>('acres');

  const initialBenchmark = CROP_DEFAULTS[initialCrop];
  const [yieldPerAcre, setYieldPerAcre] = useState<string>(
    initialBenchmark ? String(initialBenchmark.yieldPerAcre) : '38'
  );
  const [mandiPrice, setMandiPrice] = useState<string>(
    initialPrice || (initialBenchmark ? String(initialBenchmark.mandiPrice) : '3900')
  );

  // Per-acre costs
  const [seedCost, setSeedCost] = useState<string>(
    initialBenchmark ? String(initialBenchmark.seedCost) : '7500'
  );
  const [fertCost, setFertCost] = useState<string>(
    initialBenchmark ? String(initialBenchmark.fertCost) : '24000'
  );
  const [pestCost, setPestCost] = useState<string>(
    initialBenchmark ? String(initialBenchmark.pestCost) : '5000'
  );
  const [irrigCost, setIrrigCost] = useState<string>(
    initialBenchmark ? String(initialBenchmark.irrigCost) : '12000'
  );
  const [laborCost, setLaborCost] = useState<string>(
    initialBenchmark ? String(initialBenchmark.laborCost) : '10000'
  );
  const [otherCost, setOtherCost] = useState<string>(
    initialBenchmark ? String(initialBenchmark.otherCost) : '4000'
  );

  // Notice state for imported market rates
  const [mandiNotice, setMandiNotice] = useState<{
    mandi?: string;
    crop?: string;
    price?: number;
  } | null>(
    initialMandi
      ? {
          mandi: initialMandi,
          crop: rawInitialCrop || initialCrop,
          price: initialPrice ? parseFloat(initialPrice) : 3900,
        }
      : null
  );

  // Result state
  const [result, setResult] = useState<ProfitEstimate | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isRestored, setIsRestored] = useState<boolean>(false);

  // Convert entered area to standard acres
  const effectiveAcres = useMemo(() => {
    const rawVal = parseFloat(landArea) || 0;
    const factor = LAND_UNITS[landUnit]?.toAcres || 1.0;
    return Math.round(rawVal * factor * 1000) / 1000;
  }, [landArea, landUnit]);

  // Handle crop change & auto-populate standard benchmarks
  const handleCropChange = (newCrop: string) => {
    setCrop(newCrop);
    const benchmark = CROP_DEFAULTS[newCrop];
    if (benchmark) {
      setYieldPerAcre(String(benchmark.yieldPerAcre));
      setMandiPrice(String(benchmark.mandiPrice));
      setSeedCost(String(benchmark.seedCost));
      setFertCost(String(benchmark.fertCost));
      setPestCost(String(benchmark.pestCost));
      setIrrigCost(String(benchmark.irrigCost));
      setLaborCost(String(benchmark.laborCost));
      setOtherCost(String(benchmark.otherCost));
    }
  };

  // Reset to default benchmarks
  const handleResetToDefaults = () => {
    const defaultBenchmark = CROP_DEFAULTS['Wheat (گندم)'];
    setCrop('Wheat (گندم)');
    setLandArea('5');
    setLandUnit('acres');
    setYieldPerAcre(String(defaultBenchmark.yieldPerAcre));
    setMandiPrice(String(defaultBenchmark.mandiPrice));
    setSeedCost(String(defaultBenchmark.seedCost));
    setFertCost(String(defaultBenchmark.fertCost));
    setPestCost(String(defaultBenchmark.pestCost));
    setIrrigCost(String(defaultBenchmark.irrigCost));
    setLaborCost(String(defaultBenchmark.laborCost));
    setOtherCost(String(defaultBenchmark.otherCost));
    setMandiNotice(null);
    clearItem('kd_profit_state');
    
    // Recalculate with fresh defaults
    calculateProfit({
      crop: 'Wheat (گندم)',
      acres: 5.0,
      expected_yield_per_acre: defaultBenchmark.yieldPerAcre,
      mandi_price: defaultBenchmark.mandiPrice,
      seed_cost: defaultBenchmark.seedCost,
      fertilizer_cost: defaultBenchmark.fertCost,
      pesticide_cost: defaultBenchmark.pestCost,
      irrigation_cost: defaultBenchmark.irrigCost,
      labor_cost: defaultBenchmark.laborCost,
      other_costs: defaultBenchmark.otherCost,
    }).then(res => setResult(res)).catch(() => {});
  };

  // Run calculation
  const executeCalculation = async () => {
    if (effectiveAcres <= 0) {
      setError('Please enter an area greater than zero.');
      return;
    }

    setError(null);
    setLoading(true);

    const payload: ProfitInput = {
      crop,
      acres: effectiveAcres,
      expected_yield_per_acre: parseFloat(yieldPerAcre) || 0,
      mandi_price: parseFloat(mandiPrice) || 0,
      seed_cost: parseFloat(seedCost) || 0,
      fertilizer_cost: parseFloat(fertCost) || 0,
      pesticide_cost: parseFloat(pestCost) || 0,
      irrigation_cost: parseFloat(irrigCost) || 0,
      labor_cost: parseFloat(laborCost) || 0,
      other_costs: parseFloat(otherCost) || 0,
    };

    try {
      const res = await calculateProfit(payload);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate profit estimates.');
    } finally {
      setLoading(false);
    }
  };

  // Restore state or handle queryParams
  useEffect(() => {
    const rawCrop = searchParams.get('crop');
    const rawPrice = searchParams.get('price');
    const rawMandi = searchParams.get('mandi');

    if (rawCrop || rawPrice || rawMandi) {
      const matched = matchCropKey(rawCrop);
      setCrop(matched);

      const benchmark = CROP_DEFAULTS[matched];
      const parsedPrice = rawPrice ? parseFloat(rawPrice) : (benchmark?.mandiPrice || 3900);

      const yVal = benchmark ? String(benchmark.yieldPerAcre) : '38';
      const sVal = benchmark ? String(benchmark.seedCost) : '7500';
      const fVal = benchmark ? String(benchmark.fertCost) : '24000';
      const pVal = benchmark ? String(benchmark.pestCost) : '5000';
      const iVal = benchmark ? String(benchmark.irrigCost) : '12000';
      const lVal = benchmark ? String(benchmark.laborCost) : '10000';
      const oVal = benchmark ? String(benchmark.otherCost) : '4000';

      setYieldPerAcre(yVal);
      setMandiPrice(String(parsedPrice));
      setSeedCost(sVal);
      setFertCost(fVal);
      setPestCost(pVal);
      setIrrigCost(iVal);
      setLaborCost(lVal);
      setOtherCost(oVal);

      if (rawMandi) {
        setMandiNotice({
          mandi: rawMandi,
          crop: rawCrop || matched,
          price: parsedPrice,
        });
      }

      // Auto-calculate with incoming query params
      const eff = Math.round((parseFloat(landArea) || 5) * (LAND_UNITS[landUnit]?.toAcres || 1.0) * 1000) / 1000;
      if (eff > 0) {
        calculateProfit({
          crop: matched,
          acres: eff,
          expected_yield_per_acre: parseFloat(yVal) || 0,
          mandi_price: parsedPrice,
          seed_cost: parseFloat(sVal) || 0,
          fertilizer_cost: parseFloat(fVal) || 0,
          pesticide_cost: parseFloat(pVal) || 0,
          irrigation_cost: parseFloat(iVal) || 0,
          labor_cost: parseFloat(lVal) || 0,
          other_costs: parseFloat(oVal) || 0,
        })
          .then((res) => setResult(res))
          .catch(() => {});
      }
      setIsRestored(true);
    } else {
      // Restore previously saved state if available
      const saved = loadSavedItem<any>('kd_profit_state', null);
      if (saved) {
        if (saved.crop) setCrop(saved.crop);
        if (saved.landArea) setLandArea(saved.landArea);
        if (saved.landUnit) setLandUnit(saved.landUnit);
        if (saved.yieldPerAcre) setYieldPerAcre(saved.yieldPerAcre);
        if (saved.mandiPrice) setMandiPrice(saved.mandiPrice);
        if (saved.seedCost) setSeedCost(saved.seedCost);
        if (saved.fertCost) setFertCost(saved.fertCost);
        if (saved.pestCost) setPestCost(saved.pestCost);
        if (saved.irrigCost) setIrrigCost(saved.irrigCost);
        if (saved.laborCost) setLaborCost(saved.laborCost);
        if (saved.otherCost) setOtherCost(saved.otherCost);
        if (saved.mandiNotice) setMandiNotice(saved.mandiNotice);
        if (saved.result) {
          setResult(saved.result);
        } else {
          executeCalculation();
        }
      } else {
        executeCalculation();
      }
      setIsRestored(true);
    }
  }, [searchParams]);

  // Persist state changes whenever inputs update
  useEffect(() => {
    if (!isRestored) return;
    saveItem('kd_profit_state', {
      crop,
      landArea,
      landUnit,
      yieldPerAcre,
      mandiPrice,
      seedCost,
      fertCost,
      pestCost,
      irrigCost,
      laborCost,
      otherCost,
      mandiNotice,
      result,
    });
  }, [
    isRestored,
    crop,
    landArea,
    landUnit,
    yieldPerAcre,
    mandiPrice,
    seedCost,
    fertCost,
    pestCost,
    irrigCost,
    laborCost,
    otherCost,
    mandiNotice,
    result,
  ]);

  // Prepare Recharts Data
  const costBreakdownData = useMemo(() => {
    if (!result?.cost_breakdown) return [];
    return [
      { name: 'Seed (بیج)', value: result.cost_breakdown.seed },
      { name: 'Fertilizer (کھاد)', value: result.cost_breakdown.fertilizer },
      { name: 'Pesticides (سپرے)', value: result.cost_breakdown.pesticide },
      { name: 'Irrigation (پانی و ڈیزل)', value: result.cost_breakdown.irrigation },
      { name: 'Labor (مزدوری)', value: result.cost_breakdown.labor },
      { name: 'Other (دیگر اخراجات)', value: result.cost_breakdown.other },
    ].filter((item) => item.value > 0);
  }, [result]);

  const comparisonBarData = useMemo(() => {
    if (!result) return [];
    return [
      {
        metric: 'Financial Summary',
        GrossRevenue: result.gross_revenue,
        TotalCost: result.total_cost,
        NetProfit: result.net_profit,
      },
    ];
  }, [result]);

  return (
    <SaaSLayout
      title="Crop Profit & Budget Engine"
      subtitle="Deterministic financial revenues, itemized costs, net returns, and break-even yields"
      badge="Financial Engine"
    >
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-sky-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-emerald-700/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 mb-2 border border-emerald-500/30">
              <span>🧮 100% Deterministic Financial Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Crop Profit & Budget Calculator (فصل کا منافع اور بجٹ)
            </h1>
            <p className="text-sm text-emerald-100/90 mt-1 max-w-2xl">
              Calculate gross revenues, itemized crop costs, net returns, and break-even yields across any Pakistani land size.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={executeCalculation}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition shadow-lg flex items-center space-x-2 border border-emerald-400/40"
            >
              <span>🔄</span>
              <span>Recalculate Budget</span>
            </button>
          </div>
        </div>

        {/* Mandi Rate Import Banner */}
        {mandiNotice && (
          <div className="bg-emerald-50 border-2 border-emerald-500/50 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start sm:items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow">
                📍
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-emerald-950">
                  Imported Live Mandi Rate from {mandiNotice.mandi} ({mandiNotice.crop})
                </h3>
                <p className="text-xs text-emerald-800">
                  Rate automatically set to <span className="font-black text-emerald-950 text-sm">PKR {mandiNotice.price?.toLocaleString()}/maund</span>. Yield and standard input costs have been pre-filled below.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <Link
                href="/market"
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg border border-emerald-300 transition"
              >
                ← Back to Mandi Hub
              </Link>
              <button
                onClick={() => setMandiNotice(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition"
              >
                Dismiss ✕
              </button>
            </div>
          </div>
        )}

        {/* Input Form & Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Input Controls (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 border-b pb-2 flex items-center justify-between">
              <span>⚙️ Crop & Cost Parameters</span>
              <span className="text-xs font-normal text-slate-500">
                Customizable per acre
              </span>
            </h2>

            {/* Crop Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Crop (فصل کا انتخاب)
              </label>
              <select
                value={crop}
                onChange={(e) => handleCropChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Object.keys(CROP_DEFAULTS).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Land Area + Unit Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cultivated Land Size (رقبہ)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={landArea}
                  onChange={(e) => setLandArea(e.target.value)}
                  className="w-1/2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <select
                  value={landUnit}
                  onChange={(e) => setLandUnit(e.target.value)}
                  className="w-1/2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Object.entries(LAND_UNITS).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-emerald-800 font-medium mt-1">
                Standardized Area: {effectiveAcres.toLocaleString()} Standard Acres (ایکڑ)
              </p>
            </div>

            {/* Expected Yield & Mandi Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Yield / Acre (پیداوار فی ایکڑ)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={yieldPerAcre}
                    onChange={(e) => setYieldPerAcre(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-2 top-2 text-xs text-slate-500">
                    Maunds
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mandi Price (منڈی ریٹ فی من)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={mandiPrice}
                    onChange={(e) => setMandiPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-2 top-2 text-xs text-slate-500">
                    PKR
                  </span>
                </div>
              </div>
            </div>

            {/* Itemized Costs Per Acre */}
            <div className="pt-2 border-t space-y-2">
              <span className="text-xs font-extrabold text-slate-700 block">
                Itemized Production Costs Per Acre (اخراجات فی ایکڑ PKR):
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-600 block mb-0.5">Seed (بیج):</label>
                  <input
                    type="number"
                    value={seedCost}
                    onChange={(e) => setSeedCost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-600 block mb-0.5">Fertilizers (کھاد):</label>
                  <input
                    type="number"
                    value={fertCost}
                    onChange={(e) => setFertCost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-600 block mb-0.5">Pesticides (سپرے):</label>
                  <input
                    type="number"
                    value={pestCost}
                    onChange={(e) => setPestCost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-600 block mb-0.5">Irrigation (آبپاشی و ڈیزل):</label>
                  <input
                    type="number"
                    value={irrigCost}
                    onChange={(e) => setIrrigCost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-600 block mb-0.5">Labor (مزدوری):</label>
                  <input
                    type="number"
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="text-slate-600 block mb-0.5">Other / Misc (دیگر):</label>
                  <input
                    type="number"
                    value={otherCost}
                    onChange={(e) => setOtherCost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={executeCalculation}
                disabled={loading}
                className="flex-1 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-black rounded-xl text-sm transition shadow flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>🧮</span>
                <span>{loading ? 'Calculating...' : 'Calculate Profit & Margins'}</span>
              </button>
              <button
                onClick={handleResetToDefaults}
                title="Reset all inputs back to benchmark standards"
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm border border-slate-300 transition flex items-center justify-center space-x-1"
              >
                <span>↺</span>
                <span>Reset Defaults (دوبارہ شروع کریں)</span>
              </button>
            </div>
          </div>

          {/* Right Column: Dynamic KPIs & Visualizations (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-sm font-medium">
                ⚠️ {error}
              </div>
            )}

            {result && (
              <>
                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <span className="text-xs text-slate-500 font-medium block">
                      Expected Production
                    </span>
                    <span className="text-lg font-black text-slate-900 block mt-1">
                      {result.expected_production.toLocaleString()} Maunds
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({result.expected_yield_per_acre} maunds/acre)
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <span className="text-xs text-slate-500 font-medium block">
                      Gross Revenue
                    </span>
                    <span className="text-lg font-black text-slate-900 block mt-1">
                      PKR {result.gross_revenue.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      @ PKR {result.mandi_price}/maund
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <span className="text-xs text-slate-500 font-medium block">
                      Total Production Cost
                    </span>
                    <span className="text-lg font-black text-slate-700 block mt-1">
                      PKR {result.total_cost.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      PKR {result.cost_per_acre.toLocaleString()}/acre
                    </span>
                  </div>

                  <div
                    className={`p-4 rounded-2xl border shadow-sm text-center col-span-2 sm:col-span-1 ${
                      result.is_profitable
                        ? 'bg-emerald-50 border-emerald-300'
                        : 'bg-rose-50 border-rose-300'
                    }`}
                  >
                    <span
                      className={`text-xs font-bold block ${
                        result.is_profitable ? 'text-emerald-800' : 'text-rose-800'
                      }`}
                    >
                      Net Profit (خالص منافع)
                    </span>
                    <span
                      className={`text-xl font-black block mt-1 ${
                        result.is_profitable ? 'text-emerald-900' : 'text-rose-900'
                      }`}
                    >
                      PKR {result.net_profit.toLocaleString()}
                    </span>
                    <span
                      className={`text-[11px] font-bold ${
                        result.is_profitable ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      ROI: {result.return_on_investment_percent}%
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <span className="text-xs text-slate-500 font-medium block">
                      Profit Per Acre
                    </span>
                    <span
                      className={`text-lg font-black block mt-1 ${
                        result.is_profitable ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      PKR {result.profit_per_acre.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-400">Net margin / acre</span>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-300 shadow-sm text-center">
                    <span className="text-xs text-amber-800 font-bold block">
                      Break-Even Yield (کم از کم پیداوار)
                    </span>
                    <span className="text-lg font-black text-amber-950 block mt-1">
                      {result.break_even_yield} Maunds
                    </span>
                    <span className="text-[11px] text-amber-800">
                      Minimum required to cover costs
                    </span>
                  </div>
                </div>

                {/* Recharts Visualizations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Donut Chart: Cost Breakdown */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-xs font-extrabold text-slate-800 mb-1">
                      Cost Distribution ({result.acres} Acres)
                    </h3>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Total: PKR {result.total_cost.toLocaleString()}
                    </p>
                    <div className="w-full h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={costBreakdownData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {costBreakdownData.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any) => [
                              `PKR ${Number(value).toLocaleString()}`,
                              'Amount',
                            ]}
                          />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Bar Chart: Revenue vs Cost */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-xs font-extrabold text-slate-800 mb-1">
                      Revenue vs Total Cost vs Profit
                    </h3>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Macro financial comparison in PKR
                    </p>
                    <div className="w-full h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={comparisonBarData}
                          margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="metric" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip
                            formatter={(val: any) => [
                              `PKR ${Number(val).toLocaleString()}`,
                            ]}
                          />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                          <Bar
                            dataKey="GrossRevenue"
                            name="Gross Revenue"
                            fill="#059669"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="TotalCost"
                            name="Total Cost"
                            fill="#64748b"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="NetProfit"
                            name="Net Profit"
                            fill="#0284c7"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Sensitivity Analysis Scenario Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-xs text-slate-800">
                        Sensitivity & Market Fluctuation Analysis (مارکیٹ اتار چڑھاؤ کا جائزہ)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Deterministic forecast under price surges, drops, and yield shocks.
                      </p>
                    </div>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded">
                      Fixed Cost Baseline
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 text-slate-800 font-bold">
                        <tr>
                          <th className="p-2.5">Scenario</th>
                          <th className="p-2.5">Yield / Acre</th>
                          <th className="p-2.5">Mandi Price</th>
                          <th className="p-2.5">Gross Revenue</th>
                          <th className="p-2.5">Net Profit</th>
                          <th className="p-2.5">Profit / Acre</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {result.sensitivity_analysis.map((s, idx) => (
                          <tr
                            key={idx}
                            className={
                              s.scenario === 'Base Plan'
                                ? 'bg-emerald-50/70 font-semibold'
                                : 'hover:bg-slate-50'
                            }
                          >
                            <td className="p-2.5 font-bold">
                              {s.scenario === 'Base Plan' ? `🎯 ${s.scenario}` : s.scenario}
                            </td>
                            <td className="p-2.5">{s.yield_maunds_per_acre} Maunds</td>
                            <td className="p-2.5">PKR {s.mandi_price_pkr.toLocaleString()}</td>
                            <td className="p-2.5">PKR {s.gross_revenue_pkr.toLocaleString()}</td>
                            <td
                              className={`p-2.5 font-bold ${
                                s.net_profit_pkr >= 0
                                  ? 'text-emerald-700'
                                  : 'text-rose-700'
                              }`}
                            >
                              PKR {s.net_profit_pkr.toLocaleString()}
                            </td>
                            <td
                              className={`p-2.5 font-bold ${
                                s.profit_per_acre_pkr >= 0
                                  ? 'text-emerald-700'
                                  : 'text-rose-700'
                              }`}
                            >
                              PKR {s.profit_per_acre_pkr.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </SaaSLayout>
  );
}

export default function ProfitPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f4f7f5] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <ProfitCalculatorContent />
    </Suspense>
  );
}
