'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { loadSavedItem } from '@/lib/storage';
import { API_BASE_URL } from '@/lib/api';
import {
  Sprout,
  Bot,
  LandPlot,
  CloudSun,
  Coins,
  Droplets,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Scale,
  Bug,
  Landmark,
  CheckCircle2,
  Wind,
  Droplet,
  Sliders,
  Bell,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface WeatherData {
  district: string;
  temperature_c?: number;
  humidity_percent?: number;
  wind_speed_kph?: number;
  condition?: string;
  rain_probability?: number;
  agricultural_warnings?: string[];
  irrigation_advice?: string;
}

interface CropRecommendation {
  crop_name: string;
  suitability_score: number;
  reasoning: string;
  expected_yield_maunds_per_acre: number;
  water_requirement: string;
}

interface ProfitData {
  gross_revenue_pkr: number;
  total_cost_pkr: number;
  net_profit_pkr: number;
  profit_margin_percent?: number;
  break_even_yield_maunds_per_acre?: number;
}

export default function Dashboard() {
  const [district, setDistrict] = useState<string>('Multan');
  const [acres, setAcres] = useState<number>(5.0);
  const [season, setSeason] = useState<string>('Kharif');
  const [currentCrop, setCurrentCrop] = useState<string>('Cotton');
  const [soilType, setSoilType] = useState<string>('Loam (Mera)');
  const [waterAccess, setWaterAccess] = useState<string>('Canal + Tube Well');

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [recommendedCrops, setRecommendedCrops] = useState<CropRecommendation[]>([]);
  const [profit, setProfit] = useState<ProfitData | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load saved farm profile on mount
  useEffect(() => {
    const saved = loadSavedItem<any>('kd_dashboard_profile', null);
    if (saved) {
      if (saved.district) setDistrict(saved.district);
      if (saved.acres) setAcres(Number(saved.acres));
      if (saved.season) setSeason(saved.season);
      if (saved.crop) setCurrentCrop(saved.crop);
      if (saved.soil) setSoilType(saved.soil);
      if (saved.water) setWaterAccess(saved.water);
    }
  }, []);

  // Fetch real backend data whenever farm profile parameters change
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      const apiUrl = API_BASE_URL;

      try {
        // 1. Fetch Real Weather Data
        try {
          const wRes = await fetch(`${apiUrl}/api/weather/${district}`);
          if (wRes.ok) {
            const wData = await wRes.json();
            setWeather({
              district: wData.district || district,
              temperature_c: wData.current?.temperature_c ?? 32,
              humidity_percent: wData.current?.relative_humidity_percent ?? 45,
              wind_speed_kph: wData.current?.wind_speed_kmh ?? 12,
              condition: wData.current?.weather_description ?? 'Partly Cloudy',
              rain_probability: wData.forecast_days?.[0]?.precipitation_probability_percent ?? 15,
              agricultural_warnings: wData.agricultural_warnings || [],
              irrigation_advice: wData.crop_stage_advisories?.[0] || 'Standard irrigation schedule recommended.',
            });

            if (wData.agricultural_warnings && wData.agricultural_warnings.length > 0) {
              setAlerts(wData.agricultural_warnings);
            } else {
              setAlerts([
                `Optimal spraying conditions in ${district} during early morning hours.`,
                `Pre-irrigation (Rauni) recommended prior to Kharif sowing.`
              ]);
            }
          }
        } catch (e) {
          console.warn('Weather fetch fallback:', e);
        }

        // 2. Fetch Real Crop Recommendations
        try {
          const cRes = await fetch(`${apiUrl}/api/agriculture/recommend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              district: district,
              season: season,
              land_acres: acres,
              soil_type: soilType,
              water_availability: waterAccess.toLowerCase().includes('limited') ? 'Limited' : 'Adequate',
            }),
          });
          if (cRes.ok) {
            const cData = await cRes.json();
            if (cData.recommended_crops) {
              setRecommendedCrops(cData.recommended_crops.slice(0, 3));
            }
          }
        } catch (e) {
          console.warn('Crop rec fetch fallback:', e);
        }

        // 3. Fetch Real Profit Estimate
        try {
          const pRes = await fetch(`${apiUrl}/api/tools/profit-estimator`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              crop: currentCrop.toLowerCase(),
              acres: acres,
              district: district,
            }),
          });
          if (pRes.ok) {
            const pData = await pRes.json();
            setProfit({
              gross_revenue_pkr: pData.expected_gross_revenue_pkr,
              total_cost_pkr: pData.total_input_cost_pkr,
              net_profit_pkr: pData.net_margin_pkr,
              profit_margin_percent: pData.return_on_investment_percent,
              break_even_yield_maunds_per_acre: pData.break_even_yield_maunds_per_acre,
            });
          }
        } catch (e) {
          console.warn('Profit fetch fallback:', e);
        }

      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [district, acres, season, currentCrop, soilType, waterAccess]);

  const quickActions = [
    {
      title: 'AI Farmer Assistant',
      urdu: 'اے آئی مشیر',
      desc: 'Ask multi-agent agronomy, pest, mandi rate & profit questions',
      icon: Bot,
      href: '/assistant',
      badge: 'Agent System',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      iconBg: 'bg-emerald-100 text-emerald-800',
    },
    {
      title: 'Pest Doctor Clinic',
      urdu: 'امراض و کیڑے',
      desc: 'Diagnose leaf symptoms with Punjab Ext. & PARC verified sprays',
      icon: Bug,
      href: '/pest-doctor',
      badge: 'PARC Verified',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      iconBg: 'bg-amber-100 text-amber-800',
    },
    {
      title: 'Fertilizer Calculator',
      urdu: 'کھاد کا حساب',
      desc: 'Exact DAP, Urea & SOP bag dosage calculated by soil deficit',
      icon: Scale,
      href: '/fertilizer',
      badge: 'Soil Specific',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
      iconBg: 'bg-teal-100 text-teal-800',
    },
    {
      title: 'Mandi Rates Benchmark',
      urdu: 'منڈی ریٹس',
      desc: 'Daily AMIS wholesale prices for Multan, Faisalabad, Lahore',
      icon: TrendingUp,
      href: '/market',
      badge: 'AMIS Live',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      iconBg: 'bg-blue-100 text-blue-800',
    },
    {
      title: 'Crop Suitability Engine',
      urdu: 'فصل انتخاب',
      desc: 'Find highest yield crop for your specific soil and water profile',
      icon: Sprout,
      href: '/crops',
      badge: 'Zone Grounded',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      iconBg: 'bg-emerald-100 text-emerald-800',
    },
    {
      title: 'Govt Schemes & Subsidies',
      urdu: 'حکومتی اسکیمیں',
      desc: 'Kisan Card 150k interest-free loans & solar tubewell subsidies',
      icon: Landmark,
      badge: 'Govt Punjab',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      iconBg: 'bg-purple-100 text-purple-800',
      href: '/schemes',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
        {/* Top Banner: Farm Profile & Overview */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs flex-shrink-0">
              <Sprout className="w-7 h-7" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  {isLoading ? 'Syncing...' : 'Active Farm Profile'}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  South Punjab Agro-Ecological Zone
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-2.5 mt-1.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  Kisan Dost Farm Dashboard
                </h1>
                <span className="font-urdu text-emerald-700 font-bold text-lg sm:text-xl">
                  (کسان ڈیش بورڈ)
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 flex flex-wrap items-center gap-2">
                <span>Managed by <strong className="text-slate-800">Muhammad Abdullah</strong></span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-800 font-medium">Grounded in Dept. of Agriculture Punjab data</span>
              </p>
            </div>
          </div>

          {/* Farm Specs Capsule & Action */}
          <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 border border-slate-200 p-2 rounded-2xl w-full lg:w-auto">
            <div className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs flex-1 sm:flex-initial min-w-[70px]">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">District</span>
              <span className="font-bold text-slate-900">{district}</span>
            </div>
            <div className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs flex-1 sm:flex-initial min-w-[70px]">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Land Area</span>
              <span className="font-bold text-emerald-800">{acres} Acres</span>
            </div>
            <div className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs flex-1 sm:flex-initial min-w-[70px]">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Current Crop</span>
              <span className="font-bold text-slate-900">{currentCrop}</span>
            </div>
            <div className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs flex-1 sm:flex-initial min-w-[70px]">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Season</span>
              <span className="font-bold text-slate-900">{season}</span>
            </div>
            <Link
              href="/demo"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black transition shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>Demo Mode</span>
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs ml-auto sm:ml-0"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </Link>
          </div>
        </div>

        {/* 4 Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Cultivated Land Area */}
          <div className="bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-5 shadow-xs transition flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Cultivated Land
              </span>
              <div className="text-2xl font-black text-slate-900">
                {acres} <span className="text-sm font-semibold text-slate-500">Acres</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{soilType}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center">
              <LandPlot className="w-6 h-6" />
            </div>
          </div>

          {/* Metric 2: Live Weather */}
          <div className="bg-white border border-slate-200/90 hover:border-sky-300 rounded-2xl p-5 shadow-xs transition flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Weather in {district}
              </span>
              <div className="text-2xl font-black text-slate-900 flex items-baseline gap-2">
                <span>{weather?.temperature_c ?? '--'}°C</span>
                <span className="text-xs font-semibold text-sky-700 px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200">
                  {weather?.condition ?? 'Checking...'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-sky-600" /> {weather?.humidity_percent ?? 45}%
                </span>
                <span className="flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-slate-400" /> {weather?.wind_speed_kph ?? 12} km/h
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 text-sky-700 flex items-center justify-center">
              <CloudSun className="w-6 h-6" />
            </div>
          </div>

          {/* Metric 3: Estimated Net Profit */}
          <div className="bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-5 shadow-xs transition flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Est. Net Profit ({currentCrop})
              </span>
              <div className="text-2xl font-black text-emerald-800">
                PKR {profit && profit.net_profit_pkr != null ? profit.net_profit_pkr.toLocaleString() : '---'}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  +{profit?.profit_margin_percent ?? 148}% ROI
                </span>
                <span className="text-slate-500">5 Ac Model</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
          </div>

          {/* Metric 4: Water & Irrigation */}
          <div className="bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl p-5 shadow-xs transition flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Irrigation Status
              </span>
              <div className="text-base font-bold text-slate-900 truncate max-w-[160px]">
                {waterAccess}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-blue-700 font-semibold">
                <Droplet className="w-3.5 h-3.5 text-blue-600" />
                <span>Rain Chance: {weather?.rain_probability ?? 15}%</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center">
              <Droplets className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Center Section: Farm Alerts & Advisories + Optimal Crops */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Farm Alerts & Advisories (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                    <Bell className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Farm Alerts &amp; Advisories</h3>
                    <p className="text-[11px] text-slate-500 font-urdu">زرعی انتباہ اور مشورے</p>
                  </div>
                </div>
                <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Active
                </span>
              </div>

              <div className="space-y-3">
                {alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-amber-50/70 border-l-4 border-l-amber-500 border border-amber-200/70 text-xs text-amber-950 flex items-start gap-2.5"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="leading-relaxed font-medium">{alert}</div>
                  </div>
                ))}

                <div className="p-3.5 rounded-xl bg-emerald-50/70 border-l-4 border-l-emerald-600 border border-emerald-200/70 text-xs text-emerald-950 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="leading-relaxed font-medium">
                    <strong className="text-emerald-900">Pest Doctor Alert:</strong> Whitefly scouting active in cotton zones. Check 5 plants per acre twice weekly. Spray flonicamid if economic threshold is reached.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Source: Punjab Agri Ext. &amp; Open-Meteo</span>
              <Link
                href="/weather"
                className="text-xs font-bold text-emerald-800 hover:text-emerald-900 inline-flex items-center gap-1 group"
              >
                <span>Full Weather Forecast</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Optimal Crops for District (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                    <Sprout className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Optimal Crops for {district} ({season})
                    </h3>
                    <p className="text-[11px] text-slate-500 font-urdu">موزوں ترین فصلیں برائے ملتان</p>
                  </div>
                </div>
                <Link
                  href="/crops"
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-900 inline-flex items-center gap-1 group"
                >
                  <span>Crop Advisor</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {recommendedCrops.length > 0 ? (
                  recommendedCrops.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50/50 hover:border-emerald-300 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            {c.crop_name}
                          </span>
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded">
                            {c.suitability_score}% Match
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {c.reasoning || `High agro-zone suitability for ${district} soils.`}
                        </p>
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-slate-200/80 text-xs space-y-1">
                        <div className="flex justify-between text-slate-500">
                          <span>Expected Yield:</span>
                          <span className="font-bold text-slate-800">{c.expected_yield_maunds_per_acre} mnds/ac</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Water Need:</span>
                          <span className="font-semibold text-blue-700">{c.water_requirement}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  [
                    { name: 'Cotton (کپاس)', score: 94, yield: '28-34', water: 'Moderate-High', desc: 'Prime cotton belt suitability with high export lint quality.' },
                    { name: 'Wheat (گندم)', score: 91, yield: '40-48', water: 'Canal 4-5 turns', desc: 'Guaranteed government support price with high yield potential.' },
                    { name: 'Maize (مکئی)', score: 87, yield: '75-90', water: 'Regular irrigation', desc: 'Fast turnaround grain cycle with steady poultry demand.' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50/50 hover:border-emerald-300 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-900">{item.name}</span>
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded">
                            {item.score}% Match
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-slate-200/80 text-xs space-y-1">
                        <div className="flex justify-between text-slate-500">
                          <span>Expected:</span>
                          <span className="font-bold text-slate-800">{item.yield} mnds/ac</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Water:</span>
                          <span className="font-semibold text-blue-700">{item.water}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>Soil: Sandy Loam to Clay Loam compatible</span>
              <span className="text-emerald-800 font-medium">Punjab Agri Research Council (PARC)</span>
            </div>
          </div>
        </div>

        {/* Specialized Farm Services (Quick Actions Grid) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <span>⚡ Specialized Farm Services</span>
                <span className="font-urdu text-emerald-700 font-bold text-sm">(فوری زرعی خدمات)</span>
              </h3>
              <p className="text-xs text-slate-500">Grounded tools and multi-agent assistance for your farm</p>
            </div>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">6 Specialist Modules</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <Link
                  key={idx}
                  href={action.href}
                  className="bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md p-5 rounded-2xl transition-all duration-200 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${action.iconBg} group-hover:scale-105 transition-transform`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${action.badgeColor}`}>
                        {action.badge}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800 transition-colors">
                        {action.title}
                      </h4>
                      <span className="font-urdu text-xs text-emerald-700 font-semibold">{action.urdu}</span>
                    </div>

                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {action.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-800 font-bold">
                    <span>Open Module</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform text-emerald-700" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
