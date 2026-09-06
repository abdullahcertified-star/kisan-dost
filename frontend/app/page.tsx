'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { loadSavedItem } from '@/lib/storage';
import { API_BASE_URL } from '@/lib/api';
import {
  LayoutDashboard,
  Sprout,
  Wheat,
  Bug,
  Scale,
  TrendingUp,
  CloudSun,
  Landmark,
  Activity,
  User,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Droplets,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Bot,
  Sliders,
  Sparkles,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  Thermometer,
  Wind
} from 'lucide-react';

interface WeatherData {
  district: string;
  temperature?: number;
  apparent_temperature?: number;
  humidity?: number;
  wind_speed?: number;
  weather_condition?: string;
  forecast_source?: string;
  temp_max?: number;
  temp_min?: number;
}

export default function AgriculturalSaaSDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [district, setDistrict] = useState('Multan');
  const [farmerName, setFarmerName] = useState('Sarah Chen');
  const [farmerRole, setFarmerRole] = useState('Farm Manager');
  const [farmZone, setFarmZone] = useState('Punjab Agro Zone');
  const [acres, setAcres] = useState(15);
  const [activeFields, setActiveFields] = useState(12);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [searchQuery, setSearchQuery] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [harvestMetric, setHarvestMetric] = useState({
    harvestedTons: 15.6,
    goalTons: 20.0,
    percentage: 78,
  });

  // Load saved profile if available
  useEffect(() => {
    const profile = loadSavedItem<any>('kisan_farmer_profile', null) || loadSavedItem<any>('kd_dashboard_profile', null);
    if (profile) {
      if (profile.name) setFarmerName(profile.name);
      if (profile.district) setDistrict(profile.district);
      if (profile.land_acres) setAcres(Number(profile.land_acres));
      if (profile.role) setFarmerRole(profile.role);
    }
  }, []);

  // Fetch live weather data
  useEffect(() => {
    const fetchWeather = async () => {
      setIsLoadingWeather(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/weather/${district}`);
        if (res.ok) {
          const data = await res.json();
          setWeather({
            district: data.district || district,
            temperature: Math.round(data.temperature ?? 32),
            apparent_temperature: Math.round(data.apparent_temperature ?? 33),
            humidity: data.humidity ?? 45,
            wind_speed: Math.round(data.wind_speed ?? 8),
            weather_condition: data.weather_condition || 'Partly Cloudy',
            forecast_source: data.forecast_source || 'Live Open-Meteo',
            temp_max: data.forecast?.[0]?.temp_max ?? 36,
            temp_min: data.forecast?.[0]?.temp_min ?? 24,
          });
        }
      } catch (err) {
        console.warn('Weather fetch fallback:', err);
      } finally {
        setIsLoadingWeather(false);
      }
    };
    fetchWeather();
  }, [district]);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/', active: true },
    { name: 'Fields & Crops', icon: Sprout, href: '/crops' },
    { name: 'Crop Advisor', icon: Wheat, href: '/advisor' },
    { name: 'Fertilizer Calc', icon: Scale, href: '/fertilizer' },
    { name: 'Pest Doctor', icon: Bug, href: '/pest-doctor' },
    { name: 'Mandi Rates', icon: TrendingUp, href: '/market' },
    { name: 'Profit & ROI', icon: Activity, href: '/profit' },
    { name: 'Weather Radar', icon: CloudSun, href: '/weather' },
    { name: 'Govt Schemes', icon: Landmark, href: '/schemes' },
    { name: 'Observability', icon: Sliders, href: '/observability' },
    { name: 'Settings', icon: Settings, href: '/profile' },
  ];

  const tasks = [
    {
      id: 1,
      title: 'Irrigation Check',
      field: 'Field 4 (Cotton)',
      priority: 'High',
      priorityColor: 'text-rose-700 bg-rose-50 border-rose-200',
      dueDate: 'Due Today',
      status: 'In Progress',
      statusColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Droplets,
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      id: 2,
      title: 'Fertilizer Application',
      field: 'Field 1 (Wheat)',
      priority: 'Medium',
      priorityColor: 'text-amber-700 bg-amber-50 border-amber-200',
      dueDate: 'Due Oct 14',
      status: 'Scheduled',
      statusColor: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: Scale,
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      id: 3,
      title: 'Pest Scouting (Whitefly)',
      field: 'Field 8 (Cotton)',
      priority: 'Low',
      priorityColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      dueDate: 'Due Oct 15',
      status: 'Pending',
      statusColor: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Bug,
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      id: 4,
      title: 'Mandi Rate Price Lock',
      field: 'Multan Mandi Market',
      priority: 'Routine',
      priorityColor: 'text-slate-600 bg-slate-50 border-slate-200',
      dueDate: 'Daily 10 AM',
      status: 'Active',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: TrendingUp,
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-800 flex font-sans antialiased">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sleek Left Sidebar Navigation Panel */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between z-50 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 flex flex-col h-full">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-xs shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <span className="text-base font-bold text-slate-900 tracking-tight block">Kisan Dost</span>
                <span className="text-[11px] text-emerald-600 font-semibold tracking-wide uppercase">Farm SaaS OS</span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Pill in Sidebar */}
          <div className="my-5 p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {farmerName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{farmerName}</p>
              <p className="text-xs text-slate-500 truncate">{farmerRole}</p>
            </div>
            <Link href="/profile" className="text-slate-400 hover:text-emerald-600">
              <ChevronDown className="w-4 h-4" />
            </Link>
          </div>

          {/* Navigation Links with Linear Icons */}
          <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    item.active
                      ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      item.active ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer AI Quick Link */}
          <div className="pt-4 border-t border-slate-100">
            <Link
              href="/assistant"
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-xs hover:shadow-emerald-500/20 hover:scale-[1.01] transition-all"
            >
              <div className="flex items-center space-x-2.5">
                <Bot className="w-5 h-5 text-emerald-100" />
                <span className="text-xs font-semibold">AI Agronomist</span>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-200" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between z-30">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Good Morning, {farmerName.split(' ')[0]}!
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                {farmZone} • Season: Kharif 2026
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Global Search Input */}
            <div className="relative hidden md:block w-64 lg:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fields, tasks, data..."
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Notification Bell */}
            <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2 border-2 border-white" />
            </button>

            {/* User Avatar Mini */}
            <Link href="/profile" className="flex items-center space-x-2 p-1 rounded-full hover:ring-2 hover:ring-emerald-500/30 transition-all">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                {farmerName.charAt(0)}
              </div>
            </Link>
          </div>
        </header>

        {/* Dashboard Grid Container */}
        <main className="p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top Row: KPI Cards + Production Overview + Weather Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
            {/* Left KPI Cards (4 cols on lg) */}
            <div className="lg:col-span-3 space-y-4">
              {/* Active Fields Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
                  <span>Active Fields</span>
                  <span className="inline-flex items-center text-[10px] text-emerald-700 bg-emerald-50 font-semibold px-2 py-0.5 rounded-full">
                    +2 this week
                  </span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-extrabold text-slate-900">{activeFields}</span>
                  <span className="text-sm font-semibold text-slate-400">/{acres} Fields</span>
                </div>
                <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(activeFields / acres) * 100}%` }}
                  />
                </div>
              </div>

              {/* Crop Health Status */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-3">
                  <span>Crop Health</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                    Active
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                    <span className="text-lg font-bold text-emerald-700 block">92%</span>
                    <span className="text-[10px] text-emerald-800 font-medium">Good</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100">
                    <span className="text-lg font-bold text-amber-700 block">8%</span>
                    <span className="text-[10px] text-amber-800 font-medium">Fair</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-lg font-bold text-slate-400 block">0%</span>
                    <span className="text-[10px] text-slate-500 font-medium">Poor</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Central Production Overview Module (5 cols on lg) */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Production Overview</h3>
                  <p className="text-xs text-slate-500">Seasonal harvest output telemetry</p>
                </div>
                <span className="text-xs bg-emerald-700 text-white font-semibold px-2.5 py-1 rounded-lg shadow-2xs">
                  {harvestMetric.harvestedTons} Tons
                </span>
              </div>

              {/* Semi-Circular Segmented SVG Gauge Chart */}
              <div className="relative flex flex-col items-center justify-center my-2">
                <svg viewBox="0 0 240 130" className="w-56 sm:w-64 h-auto overflow-visible">
                  <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="50%" stopColor="#16a34a" />
                      <stop offset="100%" stopColor="#15803d" />
                    </linearGradient>
                  </defs>
                  {/* Gauge background track */}
                  <path
                    d="M 20 120 A 100 100 0 0 1 220 120"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="24"
                    strokeLinecap="round"
                  />
                  {/* Gauge active fill track */}
                  <path
                    d="M 20 120 A 100 100 0 0 1 220 120"
                    fill="none"
                    stroke="url(#gaugeGradient)"
                    strokeWidth="24"
                    strokeDasharray="314.159"
                    strokeDashoffset={314.159 * (1 - harvestMetric.percentage / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  {/* Visual tick marks */}
                  <line x1="20" y1="120" x2="35" y2="120" stroke="#ffffff" strokeWidth="2" />
                  <line x1="120" y1="20" x2="120" y2="35" stroke="#ffffff" strokeWidth="2" />
                  <line x1="205" y1="120" x2="220" y2="120" stroke="#ffffff" strokeWidth="2" />
                </svg>

                {/* Central Gauge Text */}
                <div className="text-center -mt-8">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                    TOTAL HARVESTED
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900">
                    {harvestMetric.percentage}% <span className="text-slate-400 font-semibold text-lg">/ {harvestMetric.harvestedTons} Tons</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Goal: {harvestMetric.goalTons} Tons
                  </span>
                </div>
              </div>

              {/* Progress Footer */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                <span>Pacing: On Track (+4.2%)</span>
                <Link href="/crops" className="text-emerald-600 font-semibold hover:underline inline-flex items-center space-x-1">
                  <span>View Breakdown</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Localized Weather Card (4 cols on lg) */}
            <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {weather?.district || district}, Punjab
                  </span>
                  <Link href="/weather" className="text-xs text-emerald-600 hover:underline flex items-center space-x-1">
                    <span>Full Forecast</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div>
                    <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
                      {weather?.temperature ?? 33}°C
                    </div>
                    <p className="text-xs font-semibold text-slate-600 mt-1">
                      {weather?.weather_condition || 'Partly Sunny'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      High {weather?.temp_max ?? 36}° / Low {weather?.temp_min ?? 24}°
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shadow-2xs">
                    <CloudSun className="w-9 h-9" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 mt-4 border-t border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Humidity</span>
                    <span className="text-xs font-bold text-slate-800">{weather?.humidity ?? 45}%</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Wind className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Wind</span>
                    <span className="text-xs font-bold text-slate-800">{weather?.wind_speed ?? 8} km/h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Row: Crop Yield Analysis Line Chart + Structured Task Management */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Crop Yield Analysis Graph (7 cols on lg) */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">Crop Yield Analysis</h3>
                  <p className="text-xs text-slate-500">Maunds per acre multi-crop performance</p>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Legend */}
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="flex items-center space-x-1.5 font-medium text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                      <span>Cotton</span>
                    </span>
                    <span className="flex items-center space-x-1.5 font-medium text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                      <span>Wheat</span>
                    </span>
                    <span className="flex items-center space-x-1.5 font-medium text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <span>Maize</span>
                    </span>
                  </div>

                  {/* Year Dropdown */}
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>
              </div>

              {/* Smooth Minimalist SVG Multi-Line Graph */}
              <div className="w-full overflow-x-auto">
                <svg viewBox="0 0 600 220" className="w-full h-52 sm:h-56">
                  <defs>
                    <linearGradient id="cottonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="wheatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid lines */}
                  <line x1="40" y1="30" x2="580" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="40" y1="80" x2="580" y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="40" y1="130" x2="580" y2="130" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="40" y1="180" x2="580" y2="180" stroke="#e2e8f0" strokeWidth="1" />

                  {/* Y Axis Labels */}
                  <text x="15" y="34" fill="#94a3b8" fontSize="10" fontWeight="500">200</text>
                  <text x="15" y="84" fill="#94a3b8" fontSize="10" fontWeight="500">150</text>
                  <text x="15" y="134" fill="#94a3b8" fontSize="10" fontWeight="500">100</text>
                  <text x="25" y="184" fill="#94a3b8" fontSize="10" fontWeight="500">0</text>

                  {/* Area fill for cotton */}
                  <path
                    d="M 50 180 C 100 170, 140 140, 190 145 C 240 150, 280 160, 330 110 C 380 60, 420 150, 470 120 C 520 90, 550 50, 570 40 L 570 180 Z"
                    fill="url(#cottonGrad)"
                  />

                  {/* Cotton Line (Forest Green) */}
                  <path
                    d="M 50 180 C 100 170, 140 140, 190 145 C 240 150, 280 160, 330 110 C 380 60, 420 150, 470 120 C 520 90, 550 50, 570 40"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Wheat Line (Grass Green) */}
                  <path
                    d="M 50 180 C 100 150, 140 130, 190 110 C 240 90, 280 100, 330 140 C 380 120, 420 80, 470 70 C 520 60, 550 90, 570 85"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Maize Line (Amber) */}
                  <path
                    d="M 50 180 C 100 160, 140 150, 190 120 C 240 95, 280 120, 330 130 C 380 140, 420 110, 470 100 C 520 90, 550 105, 570 95"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                  />

                  {/* X Axis Labels */}
                  <text x="45" y="202" fill="#94a3b8" fontSize="10" fontWeight="500">Jan</text>
                  <text x="95" y="202" fill="#94a3b8" fontSize="10" fontWeight="500">Feb</text>
                  <text x="145" y="202" fill="#94a3b8" fontSize="10" fontWeight="500">Mar</text>
                  <text x="195" y="202" fill="#94a3b8" fontSize="10" fontWeight="500">Apr</text>
                  <text x="245" y="202" fill="#94a3b8" fontSize="10" fontWeight="500">May</text>
                  <text x="295" y="202" fill="#94a3b8" fontSize="10" fontWeight="500">Jun</text>
                  <text x="345" y="202" fill="#94a3b8" fontSize="10" fontWeight="500">Jul</text>
                  <text x="395" y="202" fill="#94a3b8" fontSize="10" fontWeight="500">Aug</text>
                  <text x="445" y="202" fill="#94a3b8" fontSize="10" fontWeight="500">Sep</text>
                  <text x="495" y="202" fill="#94a3b8" fontSize="10" fontWeight="500">Oct</text>
                  <text x="545" y="202" fill="#94a3b8" fontSize="10" fontWeight="500">Dec</text>
                </svg>
              </div>
            </div>

            {/* Structured Task Management List (5 cols on lg) */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">Task Management</h3>
                    <p className="text-xs text-slate-500">Active agronomic field actions</p>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                    {tasks.length} Active
                  </span>
                </div>

                <div className="space-y-3">
                  {tasks.map((t) => {
                    const TaskIcon = t.icon;
                    return (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl ${t.iconBg} flex items-center justify-center flex-shrink-0 shadow-2xs`}>
                            <TaskIcon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">{t.title}</h4>
                            <p className="text-[11px] text-slate-500 flex items-center space-x-1.5 mt-0.5 truncate">
                              <span>{t.field}</span>
                              <span>•</span>
                              <span className={`px-1.5 py-0.2 rounded-md font-medium border text-[9px] ${t.priorityColor}`}>
                                {t.priority}
                              </span>
                              <span>•</span>
                              <span>{t.dueDate}</span>
                            </p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border flex-shrink-0 ${t.statusColor}`}>
                          {t.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">8 High Priority Remaining</span>
                <Link
                  href="/crops"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center space-x-1"
                >
                  <span>Manage All Tasks</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Row: Quick Access Suite Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/assistant"
              className="group p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex items-center space-x-3.5"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">AI Crop Assistant</h4>
                <p className="text-[11px] text-slate-500">Urdu & English voice bot</p>
              </div>
            </Link>

            <Link
              href="/fertilizer"
              className="group p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex items-center space-x-3.5"
            >
              <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">Fertilizer Calculator</h4>
                <p className="text-[11px] text-slate-500">Soil deficit DAP & Urea</p>
              </div>
            </Link>

            <Link
              href="/market"
              className="group p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex items-center space-x-3.5"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">Mandi Benchmark</h4>
                <p className="text-[11px] text-slate-500">336 daily wholesale rates</p>
              </div>
            </Link>

            <Link
              href="/schemes"
              className="group p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex items-center space-x-3.5"
            >
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">Govt Schemes</h4>
                <p className="text-[11px] text-slate-500">Kisan Card & Subsidies</p>
              </div>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
