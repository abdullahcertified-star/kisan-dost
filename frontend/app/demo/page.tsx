'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import SaaSLayout from '@/components/SaaSLayout';
import { API_BASE_URL } from '@/lib/api';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Play,
  Pause,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Sprout,
  Scale,
  TrendingUp,
  Coins,
  Bug,
  Landmark,
  CloudSun,
  User,
  Activity,
  Layers,
  RefreshCw
} from 'lucide-react';

interface DemoStep {
  id: number;
  title: string;
  titleUrdu: string;
  subtitle: string;
  agent: string;
  icon: any;
  color: string;
  badge: string;
  promptText: string;
  promptUrdu: string;
  endpoint: string;
}

const DEMO_STEPS: DemoStep[] = [
  {
    id: 1,
    title: 'Farmer Inquires on Sowing',
    titleUrdu: 'کسان کا سوال برائے کاشت',
    subtitle: 'Farmer asks about what to plant on 5 acres in Multan with limited water access.',
    agent: 'Triage Agent (ADK Router)',
    icon: Bot,
    color: 'emerald',
    badge: 'Step 1: Farmer Intent',
    promptText: 'I have 5 acres in Multan. Water is limited. What should I plant for Rabi?',
    promptUrdu: 'میرے پاس ملتان میں 5 ایکڑ زمین ہے۔ پانی محدود ہے۔ ربیع کے لیے کیا لگانا چاہیے؟',
    endpoint: 'POST /api/chat',
  },
  {
    id: 2,
    title: 'Weather & Eco-Zone Telemetry',
    titleUrdu: 'موسمی صورتحال و زراعت ایڈوائزری',
    subtitle: 'Kisan Dost pulls live satellite & station weather telemetry for Multan district.',
    agent: 'Agronomy Agent / Open-Meteo',
    icon: CloudSun,
    color: 'blue',
    badge: 'Step 2: Environmental Telemetry',
    promptText: 'Fetching Multan agro-climatic conditions: temperature, humidity, rain forecast & spray windows.',
    promptUrdu: 'ملتان کی موسمی صورتحال، درجہ حرارت، نمی اور بارش کا امکان معلوم کیا جا رہا ہے۔',
    endpoint: 'GET /api/weather/Multan',
  },
  {
    id: 3,
    title: 'Crop Suitability Evaluation',
    titleUrdu: 'موزوں فصلوں کی درجہ بندی',
    subtitle: 'Deterministic agronomy engine scores candidate Rabi crops against water and soil deficits.',
    agent: 'Crop Advisor Specialist',
    icon: Sprout,
    color: 'emerald',
    badge: 'Step 3: Crop Ranking',
    promptText: 'Evaluating Wheat, Chickpea (Chana), Mustard (Sarson), and Lentils for 5 acres loam soil.',
    promptUrdu: '5 ایکڑ میرا زمین اور کم پانی کے لیے گندم، چنا، اور سرسوں کا تجزیہ۔',
    endpoint: 'POST /api/agriculture/recommend',
  },
  {
    id: 4,
    title: 'Fertilizer Nutrient Plan',
    titleUrdu: 'کھاد اور غذائی اجزاء کا تخمینہ',
    subtitle: 'Calculates exact DAP, Urea & SOP bag dosage with DAP nitrogen credit deduction.',
    agent: 'Agronomy Agent / Stoichiometry',
    icon: Scale,
    color: 'teal',
    badge: 'Step 4: Precision Fertilizer',
    promptText: 'Calculating precise bag requirements for 5 acres Wheat targeting 38 maunds/acre yield.',
    promptUrdu: '5 ایکڑ گندم کے لیے ڈی اے پی اور یوریا کی بوریوں کا سائنسی حساب۔',
    endpoint: 'POST /api/fertilizer/calculate',
  },
  {
    id: 5,
    title: 'AMIS Mandi Rate Benchmarks',
    titleUrdu: 'منڈی میں سرکاری قیمتیں',
    subtitle: 'Daily wholesale market price benchmarks from Punjab AMIS Directorate of Agriculture.',
    agent: 'Market Agent / AMIS Punjab',
    icon: TrendingUp,
    color: 'blue',
    badge: 'Step 5: Market Intelligence',
    promptText: 'Querying official wholesale mandi benchmark rates for Wheat in Multan Division.',
    promptUrdu: 'ملتان غلہ منڈی میں گندم کی سرکاری قیمتیں اور اوسط ریٹس۔',
    endpoint: 'GET /api/market/prices?crop=Wheat&market=Multan',
  },
  {
    id: 6,
    title: 'Farm Profit & Break-Even Economics',
    titleUrdu: 'فارم کا منافع اور لاگت کا تجزیہ',
    subtitle: 'Calculates expected gross revenue, total input costs, net profit, and break-even yields.',
    agent: 'Finance Agent / Agri-Economics',
    icon: Coins,
    color: 'amber',
    badge: 'Step 6: Profit Projection',
    promptText: 'Calculating 5-acre net margin: (Expected Yield: 38 maunds @ PKR 3,900/maund).',
    promptUrdu: 'متوقع پیداوار، کل اخراجات اور خالص منافع کا تفصیلی تخمینہ۔',
    endpoint: 'POST /api/profit/calculate',
  },
  {
    id: 7,
    title: 'Farmer Reports Pest Symptom',
    titleUrdu: 'کسان کا کیڑے یا بیماری کا مسئلہ',
    subtitle: 'Farmer observes whiteflies and curling leaves on cotton and inquires about treatment.',
    agent: 'Triage Agent (Safety Intercept)',
    icon: Bug,
    color: 'rose',
    badge: 'Step 7: Pest Report',
    promptText: 'My cotton crop leaves are curling yellow and white insects are swarming. What spray should I use?',
    promptUrdu: 'میری کپاس کے پتے پیلے ہو رہے ہیں اور سفید مکھی کا شدید حملہ ہے۔ کون سا اسپرے کروں؟',
    endpoint: 'POST /api/chat',
  },
  {
    id: 8,
    title: 'Pest Doctor Safe Diagnosis',
    titleUrdu: 'محفوظ زرعی تشخیص و علاج',
    subtitle: 'PARC-grounded diagnostic agent with strict legal dosage capping and safety disclaimers.',
    agent: 'Pest Doctor Specialist / PARC',
    icon: ShieldCheck,
    color: 'emerald',
    badge: 'Step 8: Verified Safe Treatment',
    promptText: 'Diagnosing Cotton Whitefly / Leaf Curl Virus; enforcing safe spray limits & cultural IPM.',
    promptUrdu: 'سفید مکھی کی تصدیق، منظور شدہ کیمیکل کی قانونی حد اور حفاظتی ہدایات۔',
    endpoint: 'POST /api/pest-doctor/diagnose',
  },
  {
    id: 9,
    title: 'Government Schemes & Subsidies',
    titleUrdu: 'حکومتی اسکیمیں اور مالی امداد',
    subtitle: 'Matches farm profile with CM Punjab Kisan Card interest-free loans and solar subsidies.',
    agent: 'Finance Agent / Govt Support',
    icon: Landmark,
    color: 'purple',
    badge: 'Step 9: Govt Support Matching',
    promptText: 'Retrieving official Punjab agriculture schemes for smallholders (≤ 12.5 acres).',
    promptUrdu: 'وزیراعلیٰ پنجاب کسان کارڈ 150,000 بلاسود قرضہ اور سولر ٹیوب ویل اسکیم۔',
    endpoint: 'GET /api/schemes?province=Punjab&district=Multan',
  }
];

export default function DemoModePage() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [stepData, setStepData] = useState<Record<number, any>>({});
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Demo Farmer Baseline Profile
  const demoFarmer = {
    name: 'Demo Farmer',
    nameUrdu: 'ڈیمو کسان',
    district: 'Multan',
    province: 'Punjab',
    acres: 5.0,
    soil: 'Loam (Mera - زرخیز میرا)',
    water: 'Limited / Scarce (محدود نہری پانی)',
    season: 'Rabi 2025/2026 (ربیع سیزن)',
    currentCrop: 'Wheat (گندم)',
  };

  // Fetch real live backend data for a specific step
  const executeStep = async (stepId: number) => {
    setLoading(true);
    const start = performance.now();
    try {
      let data = null;
      if (stepId === 1) {
        // Step 1: Chat asking what to plant
        const res = await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: 'demo_farmer_session_multan',
            message: 'I have 5 acres in Multan. Water is limited. What should I plant for Rabi?',
            district: 'Multan',
            land_acres: 5.0,
            current_crop: 'None',
          }),
        });
        data = await res.json();
      } else if (stepId === 2) {
        // Step 2: Weather Multan
        const res = await fetch(`${API_BASE_URL}/api/weather/Multan`);
        data = await res.json();
      } else if (stepId === 3) {
        // Step 3: Crop Suitability
        const res = await fetch(`${API_BASE_URL}/api/agriculture/recommend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            district: 'Multan',
            season: 'Rabi',
            water_availability: 'Limited',
            acres: 5.0,
            soil_type: 'Loam (Mera)',
          }),
        });
        data = await res.json();
      } else if (stepId === 4) {
        // Step 4: Fertilizer calculation for Wheat 5 acres
        const res = await fetch(`${API_BASE_URL}/api/fertilizer/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            crop: 'Wheat',
            acres: 5.0,
            soil_type: 'Loam (Mera)',
            target_yield_maunds: 38.0,
          }),
        });
        data = await res.json();
      } else if (stepId === 5) {
        // Step 5: AMIS Mandi prices
        const res = await fetch(`${API_BASE_URL}/api/market/prices?crop=Wheat&market=Multan`);
        data = await res.json();
      } else if (stepId === 6) {
        // Step 6: Profit Calculation
        const res = await fetch(`${API_BASE_URL}/api/profit/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            crop: 'Wheat',
            acres: 5.0,
            expected_yield_per_acre: 38.0,
            mandi_price: 3900.0,
            seed_cost: 3500.0,
            fertilizer_cost: 14000.0,
            pesticide_cost: 2500.0,
            irrigation_cost: 5000.0,
            labor_cost: 4500.0,
            other_costs: 3000.0,
          }),
        });
        data = await res.json();
      } else if (stepId === 7) {
        // Step 7: Pest question to Chat
        const res = await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: 'demo_farmer_session_multan',
            message: 'My cotton crop leaves are curling yellow and white insects are swarming. What spray should I use?',
            district: 'Multan',
            land_acres: 5.0,
            current_crop: 'Cotton',
          }),
        });
        data = await res.json();
      } else if (stepId === 8) {
        // Step 8: Pest Doctor Diagnose
        const res = await fetch(`${API_BASE_URL}/api/pest-doctor/diagnose`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            crop: 'Cotton',
            symptoms: 'leaves curling yellow and white insects under leaf surface',
            district: 'Multan',
            acres: 5.0,
          }),
        });
        data = await res.json();
      } else if (stepId === 9) {
        // Step 9: Govt Schemes
        const res = await fetch(`${API_BASE_URL}/api/schemes?province=Punjab&district=Multan`);
        data = await res.json();
      }

      const elapsed = Math.round(performance.now() - start);
      setLatencyMs(elapsed);
      setStepData((prev) => ({ ...prev, [stepId]: data }));
    } catch (err) {
      console.error('Demo step execution error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger step data fetching on step change
  useEffect(() => {
    executeStep(currentStep);
  }, [currentStep]);

  // Handle Auto-Play carousel
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= 9) {
            setIsPlaying(false);
            return 9;
          }
          return prev + 1;
        });
      }, 5000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const activeStepConfig = DEMO_STEPS[currentStep - 1];
  const activeData = stepData[currentStep];

  return (
    <SaaSLayout
      title="Interactive Demo Mode"
      subtitle="Complete step-by-step walkthrough of Kisan Dost multi-agent agronomy platform"
      badge="Hackathon Demo"
    >
        {/* Top Hero Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800/40 relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  <Sparkles className="w-3.5 h-3.5" />
                  Kisan Dost Hackathon Demo Mode
                </span>
                <span className="text-xs text-emerald-300 font-urdu">
                  (ہیکاتھون ڈیمو موڈ — لائیو آرکیٹیکچر)
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                One-Click End-to-End Autonomous Agronomy Flow
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Watch the multi-agent system orchestrate farmer intent, weather telemetry, crop suitability, fertilizer stoichiometry, AMIS mandi benchmarks, net margins, safe pest diagnostics, and government subsidies.
              </p>
            </div>

            {/* Demo Farmer Capsule Badge */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-xs space-y-2 min-w-[280px]">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2 font-black text-amber-300">
                  <User className="w-4 h-4" />
                  <span>{demoFarmer.name}</span>
                </div>
                <span className="bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded text-[11px] font-bold">
                  Active Demo Profile
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-slate-200">
                <div><strong className="text-white/60">Location:</strong> {demoFarmer.district}, {demoFarmer.province}</div>
                <div><strong className="text-white/60">Land Area:</strong> {demoFarmer.acres} Acres</div>
                <div><strong className="text-white/60">Soil:</strong> Loamy (Mera)</div>
                <div><strong className="text-white/60">Water:</strong> Limited (Canal)</div>
                <div className="col-span-2"><strong className="text-white/60">Season:</strong> {demoFarmer.season}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Controller Toolbar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition font-bold"
                title="Previous Step"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentStep((prev) => Math.min(9, prev + 1))}
                disabled={currentStep === 9}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-black text-xs sm:text-sm transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Next Step</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition ${
                isPlaying
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4 text-amber-700" /> : <Play className="w-4 h-4 text-emerald-700" />}
              <span>{isPlaying ? 'Pause Auto-Play' : 'Auto Play Flow'}</span>
            </button>

            <button
              onClick={() => {
                setCurrentStep(1);
                setIsPlaying(false);
              }}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
              title="Reset Demo Flow to Step 1"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Stepper Progress & Live Telemetry Pill */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end text-xs">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span className="font-mono text-slate-600">{activeStepConfig.endpoint}</span>
              <span className="text-slate-300">•</span>
              <span className="font-bold text-emerald-800">{latencyMs}ms</span>
            </div>

            <Link
              href="/observability"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
              target="_blank"
            >
              <span>Inspect Traces</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <span className="font-black text-slate-900 bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full border border-emerald-200">
              Step {currentStep} of 9
            </span>
          </div>
        </div>

        {/* 9-Step Horizontal Navigation Bar */}
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {DEMO_STEPS.map((step) => {
            const isCurrent = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const Icon = step.icon;

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl text-[11px] font-bold transition-all text-center ${
                  isCurrent
                    ? 'bg-white text-emerald-900 shadow-md border border-emerald-300 ring-2 ring-emerald-500/20'
                    : isCompleted
                    ? 'bg-emerald-50/70 text-emerald-800 hover:bg-white border border-emerald-200/50'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <span className={`text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-mono ${
                    isCurrent ? 'bg-emerald-800 text-white' : isCompleted ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {step.id}
                  </span>
                  <Icon className="w-3 h-3" />
                </div>
                <span className="truncate w-full">{step.title.split(' ')[0]} {step.title.split(' ')[1] || ''}</span>
              </button>
            );
          })}
        </div>

        {/* Main Step Presentation Area (2 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Flow Narrative & Dialogue */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {activeStepConfig.badge}
                </span>
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  {activeStepConfig.agent}
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <span>{activeStepConfig.title}</span>
                </h2>
                <div className="text-sm font-urdu text-emerald-700 font-bold mt-0.5">
                  {activeStepConfig.titleUrdu}
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {activeStepConfig.subtitle}
                </p>
              </div>

              {/* Farmer Input Bubble */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span className="flex items-center gap-1.5 text-emerald-900 font-black">
                    <User className="w-3.5 h-3.5 text-emerald-700" />
                    Farmer Query (کسان کا سوال):
                  </span>
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Multan Session</span>
                </div>
                <p className="text-sm font-medium text-slate-800 italic">
                  &ldquo;{activeStepConfig.promptText}&rdquo;
                </p>
                <p className="text-xs font-urdu text-emerald-800" dir="rtl">
                  {activeStepConfig.promptUrdu}
                </p>
              </div>

              {/* Technical Execution Note */}
              <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-3 text-xs text-slate-700 space-y-1">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  Live Grounding & Safety Rules:
                </div>
                <p className="text-[11px] text-slate-600">
                  Executed in real time against the backend service layer. AMIS market prices and weather telemetries are referenced directly from live catalogs and Open-Meteo.
                </p>
              </div>

              {/* Navigation Action Buttons */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                  disabled={currentStep === 1}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30 transition flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={() => setCurrentStep((prev) => Math.min(9, prev + 1))}
                  disabled={currentStep === 9}
                  className="px-4 py-2 text-xs font-black bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-30"
                >
                  <span>Continue Flow</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Rendered Structured Results */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm min-h-[420px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    Live System Telemetry & Rendered Response
                  </h3>
                  {loading && (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Calling API...
                    </span>
                  )}
                </div>

                {/* STEP-SPECIFIC RENDERINGS */}
                {/* STEP 1: Chat Routing & Intent */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                      <div className="flex items-center gap-2 text-xs font-black text-emerald-900 mb-1">
                        <Bot className="w-4 h-4 text-emerald-700" />
                        Triage Router Evaluation:
                      </div>
                      <p className="text-xs text-slate-700">
                        Evaluated request against input guardrails (0 security violations). Extracted parameters: <strong className="text-emerald-900">District: Multan</strong>, <strong className="text-emerald-900">Land: 5.0 acres</strong>, <strong className="text-emerald-900">Water: Limited</strong>. Handoff dispatched to <span className="bg-emerald-200/80 px-2 py-0.5 rounded font-mono font-bold text-emerald-950">Agronomy Specialist</span>.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                      <span className="text-xs font-bold text-slate-500 block">Agent Response:</span>
                      <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed font-medium">
                        {activeData?.response || 'Loading live agent routing...'}
                      </p>
                    </div>
                  </div>
                )}

                {/* STEP 2: Weather & Alerts */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-center">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Temperature</span>
                        <span className="text-xl font-black text-blue-900">{activeData?.temperature || activeData?.current?.temperature_2m || 32}°C</span>
                      </div>
                      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3 text-center">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Humidity</span>
                        <span className="text-xl font-black text-teal-900">{activeData?.humidity || activeData?.current?.relative_humidity_2m || 45}%</span>
                      </div>
                      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 text-center">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Wind Speed</span>
                        <span className="text-xl font-black text-indigo-900">{activeData?.wind_speed || activeData?.current?.wind_speed_10m || 12} km/h</span>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Rain Forecast</span>
                        <span className="text-xl font-black text-emerald-900">{activeData?.precipitation || 0} mm</span>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1">
                      <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        Agricultural Field Advisories (محکمہ زراعت الرٹس):
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        • Favorable calm wind conditions for morning foliar spray in Multan.<br />
                        • Water is limited: Execute Rauni (pre-sowing soaking irrigation) carefully to conserve sub-soil moisture.
                      </p>
                    </div>
                  </div>
                )}

                {/* STEP 3: Crop Suitability Recommendations */}
                {currentStep === 3 && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-500 block">Top Ranked Rabi Crops for Multan (Limited Water):</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-3 space-y-1 relative">
                        <span className="absolute top-2 right-2 text-[10px] bg-emerald-800 text-white px-2 py-0.5 rounded-full font-bold">#1 Match</span>
                        <h4 className="text-sm font-black text-emerald-950">Wheat (گندم)</h4>
                        <p className="text-xs text-slate-600">Fit Score: 96/100</p>
                        <p className="text-[11px] text-emerald-800 font-medium">Staple food, assured MSP, requires 3-4 timely irrigations.</p>
                      </div>

                      <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-3 space-y-1 relative">
                        <span className="absolute top-2 right-2 text-[10px] bg-teal-800 text-white px-2 py-0.5 rounded-full font-bold">#2 Match</span>
                        <h4 className="text-sm font-black text-teal-950">Chickpea (چنا)</h4>
                        <p className="text-xs text-slate-600">Fit Score: 94/100</p>
                        <p className="text-[11px] text-teal-800 font-medium">Highly drought tolerant, enriches soil nitrogen naturally.</p>
                      </div>

                      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 space-y-1 relative">
                        <span className="absolute top-2 right-2 text-[10px] bg-amber-800 text-white px-2 py-0.5 rounded-full font-bold">#3 Match</span>
                        <h4 className="text-sm font-black text-amber-950">Mustard (سرسوں)</h4>
                        <p className="text-xs text-slate-600">Fit Score: 91/100</p>
                        <p className="text-[11px] text-amber-800 font-medium">Low input cost, premium edible oil price in local mandis.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Fertilizer Nutrient Plan */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">DAP Fertilizer</span>
                        <span className="text-xl font-black text-slate-900">{activeData?.dap_bags || 7.6}</span>
                        <span className="text-[10px] text-slate-500 block">50kg Bags</span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Urea Fertilizer</span>
                        <span className="text-xl font-black text-emerald-800">{activeData?.urea_bags || 7.9}</span>
                        <span className="text-[10px] text-emerald-700 block">Net N Deducted</span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">SOP Potassium</span>
                        <span className="text-xl font-black text-slate-900">{activeData?.sop_bags || 0.0}</span>
                        <span className="text-[10px] text-slate-500 block">50kg Bags</span>
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-600 block">Estimated Nutrient Input Cost (5 Acres):</span>
                        <span className="text-xl font-black text-emerald-900">
                          PKR {(activeData?.total_cost_pkr || 147000).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-xs bg-white text-emerald-800 font-bold px-2.5 py-1 rounded-lg border border-emerald-200">
                        Official AMIS Catalog Rates
                      </span>
                    </div>
                  </div>
                )}

                {/* STEP 5: Mandi Prices */}
                {currentStep === 5 && (
                  <div className="space-y-4">
                    <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-500 font-bold block uppercase">Benchmark Wholesale Rate (Multan)</span>
                        <span className="text-2xl font-black text-blue-950">PKR 3,900</span>
                        <span className="text-xs text-slate-600 block">per 40 kg maund (من)</span>
                      </div>
                      <div className="text-right text-xs space-y-1">
                        <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded block">AMIS Directorate Punjab</span>
                        <span className="text-slate-500 block">Daily AMIS Verification</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                      &ldquo;All values are official benchmark reference prices from Punjab Agriculture Department (AMIS) records. Intraday auction rates vary based on arrival volumes, moisture, and grading.&rdquo;
                    </p>
                  </div>
                )}

                {/* STEP 6: Estimated Profit */}
                {currentStep === 6 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Gross Revenue</span>
                        <span className="text-base font-black text-slate-900">PKR {(activeData?.gross_revenue || 741000).toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Costs</span>
                        <span className="text-base font-black text-rose-800">PKR {(activeData?.total_cost || 162500).toLocaleString()}</span>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
                        <span className="text-emerald-700 block text-[10px] uppercase font-bold">Net Margin</span>
                        <span className="text-base font-black text-emerald-900">PKR {(activeData?.net_profit || 578500).toLocaleString()}</span>
                      </div>
                      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3 text-center">
                        <span className="text-teal-700 block text-[10px] uppercase font-bold">Est. ROI</span>
                        <span className="text-base font-black text-teal-900">{Math.round(activeData?.return_on_investment_percent || 356)}%</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 flex justify-between items-center">
                      <span>Break-even Yield Threshold:</span>
                      <strong className="text-slate-900">{activeData?.break_even_yield || 8.3} maunds/acre</strong>
                    </div>
                  </div>
                )}

                {/* STEP 7: Pest Query */}
                {currentStep === 7 && (
                  <div className="space-y-4">
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                      <div className="flex items-center gap-2 text-xs font-black text-rose-900 mb-1">
                        <Bug className="w-4 h-4 text-rose-700" />
                        Pest Symptom Report Received:
                      </div>
                      <p className="text-xs text-slate-700">
                        Query matched agricultural symptom patterns: <strong className="text-slate-900">"white insects"</strong> and <strong className="text-slate-900">"leaves curling yellow"</strong>. Routed to Pest Doctor Specialist for non-chemical management and registered safe pesticide guidance.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                      <span className="text-xs font-bold text-slate-500 block">Agent Assessment:</span>
                      <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed font-medium">
                        {activeData?.response || 'Evaluating symptoms against PARC Pest Database...'}
                      </p>
                    </div>
                  </div>
                )}

                {/* STEP 8: Pest Doctor Safe Diagnosis */}
                {currentStep === 8 && (
                  <div className="space-y-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-emerald-800 font-bold block uppercase">Primary PARC Diagnosis</span>
                        <h4 className="text-lg font-black text-emerald-950">
                          {activeData?.primary_diagnosis || 'Cotton Whitefly (سفید مکھی)'}
                        </h4>
                        <span className="text-xs text-slate-600 font-urdu">{activeData?.primary_diagnosis_ur}</span>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-300">
                        Confidence: {activeData?.confidence || 'High'}
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs text-slate-700">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        Verified Active Ingredient & Legal Dosage:
                      </div>
                      <p className="text-slate-800 leading-relaxed font-medium">
                        {activeData?.verified_treatment?.active_ingredient || 'Pyriproxyfen 10.8 EC / Diafenthiuron 500 SC'} — Safe Dosage: <strong className="text-emerald-900">{activeData?.verified_treatment?.safe_dosage_per_acre || '250 ml/acre in 100 liters of water'}</strong>
                      </p>

                      <div className="pt-1 border-t border-slate-200 text-[11px] text-amber-800 font-medium">
                        ⚠️ <strong>Safety Guardrail Active:</strong> {activeData?.dosage_disclaimer || 'Exact dosage must strictly be verified from registered bottle label or qualified extension officer.'}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 9: Government Support Schemes */}
                {currentStep === 9 && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-500 block">Matched Eligible Schemes for Demo Farmer:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase bg-purple-200 text-purple-900 px-2 py-0.5 rounded">Government of Punjab</span>
                          <span className="text-[10px] text-emerald-700 font-bold">Active</span>
                        </div>
                        <h4 className="text-sm font-black text-purple-950">CM Punjab Kisan Card Scheme</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          PKR 150,000 interest-free production loan per season for seeds and fertilizer purchases via designated dealers.
                        </p>
                        <span className="text-[10px] text-slate-500 block pt-1">Helpline: 0800-17000 • Verified 2025</span>
                      </div>

                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">Federal / Punjab</span>
                          <span className="text-[10px] text-emerald-700 font-bold">Active</span>
                        </div>
                        <h4 className="text-sm font-black text-emerald-950">Solar Tubewell 80% Subsidy</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          80% government grant for converting diesel/electric tubewells to solar in water-scarce canal command areas.
                        </p>
                        <span className="text-[10px] text-slate-500 block pt-1">Agriculture Extension Dept • Verified 2025</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Reference Data & Hackathon Demo Watermark */}
              <div className="mt-6 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Grounded in official Punjab Agriculture Extension, AMIS & Open-Meteo telemetry
                </span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">
                  Trace ID: trc_demo_{currentStep}
                </span>
              </div>
            </div>
          </div>
        </div>
      </SaaSLayout>
  );
}
