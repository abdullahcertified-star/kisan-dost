'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { loadSavedItem, clearAuthSession, isAuthenticated } from '@/lib/storage';
import FloatingBot from '@/components/FloatingBot';
import {
  LayoutDashboard,
  Sprout,
  Wheat,
  Scale,
  Bug,
  TrendingUp,
  Activity,
  CloudSun,
  Landmark,
  Sliders,
  Settings,
  Bot,
  Sparkles,
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  ArrowRight,
  Globe,
  User,
  LogOut,
} from 'lucide-react';

interface SaaSLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
}

export default function SaaSLayout({
  children,
  title,
  subtitle,
  badge,
  actions,
}: SaaSLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [farmerName, setFarmerName] = useState('Abdullah');
  const [farmerRole, setFarmerRole] = useState('Farm Manager & Owner');
  const [farmZone, setFarmZone] = useState('Faisalabad Agro Zone (5 Acres)');
  const [searchQuery, setSearchQuery] = useState('');
  const [lang, setLang] = useState<'en' | 'ur'>('en');

  const handleLogout = () => {
    clearAuthSession();
    window.location.replace('/login?logged_out=1');
  };

  useEffect(() => {
    // If logged out, require login to get access, otherwise no access
    if (!isAuthenticated()) {
      window.location.replace('/login');
      return;
    }

    // Guard against browser -> (Forward) or <- (Back) button restoring page after logout
    const handlePageShow = (e: PageTransitionEvent) => {
      if (!isAuthenticated()) {
        window.location.replace('/login');
      }
    };
    window.addEventListener('pageshow', handlePageShow);

    const profile = loadSavedItem<any>('kisan_farmer_profile', null) || loadSavedItem<any>('kd_dashboard_profile', null);
    if (profile) {
      if (profile.name) setFarmerName(profile.name);
      if (profile.role) setFarmerRole(profile.role);
      if (profile.district) setFarmZone(`${profile.district} Agro Zone`);
    }

    const savedLang = localStorage.getItem('kd_lang') as 'en' | 'ur' | null;
    if (savedLang) {
      setLang(savedLang);
    }

    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const toggleLanguage = (newLang: 'en' | 'ur') => {
    setLang(newLang);
    localStorage.setItem('kd_lang', newLang);
    // Dispatches language change event for bot responses WITHOUT altering the UI interface layout
    window.dispatchEvent(new CustomEvent('kd_language_change', { detail: newLang }));
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { name: 'Fields & Crops', icon: Sprout, href: '/crops' },
    { name: 'Crop Advisor', icon: Wheat, href: '/advisor' },
    { name: 'Fertilizer Calc', icon: Scale, href: '/fertilizer' },
    { name: 'Pest Doctor', icon: Bug, href: '/pest-doctor' },
    { name: 'Mandi Rates', icon: TrendingUp, href: '/market' },
    { name: 'Profit & ROI', icon: Activity, href: '/profit' },
    { name: 'Weather Radar', icon: CloudSun, href: '/weather' },
    { name: 'Govt Schemes', icon: Landmark, href: '/schemes' },
    { name: 'Observability', icon: Sliders, href: '/observability' },
    { name: 'Demo Mode', icon: Sparkles, href: '/demo' },
    { name: 'Settings', icon: Settings, href: '/profile' },
  ];

  const isLinkActive = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname?.startsWith(href)) return true;
    return false;
  };

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

          {/* User Profile Pill in Sidebar (Navigates cleanly to /profile) */}
          <div className="my-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/60 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all">
            <Link href="/profile" className="flex items-center space-x-3 min-w-0 group" title="View Profile">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform flex-shrink-0">
                {farmerName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-emerald-700 transition">{farmerName}</p>
                <p className="text-xs text-slate-500 truncate">{farmerRole}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>

          {/* Navigation Links with Linear Icons */}
          <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isLinkActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon
                    className={`w-4.5 h-4.5 transition-colors ${
                      active ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer Logout Button */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200/80 hover:border-rose-200 transition-all font-semibold text-xs group"
            >
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-200 transition">
                  <LogOut className="w-3.5 h-3.5" />
                </div>
                <span>Logout (لاگ آؤٹ)</span>
              </div>
              <span className="text-[10px] text-slate-400 group-hover:text-rose-500 font-normal">Sign Out</span>
            </button>
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Farm OS Online</span>
              </div>
              <span className="font-mono">v2.5</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between z-30">
          <div className="flex items-center space-x-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight truncate">
                  {title || `Good Morning, ${farmerName.split(' ')[0]}!`}
                </h1>
                {badge && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 hidden sm:block truncate">
                {subtitle || `${farmZone} • Season: Kharif 2026`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {/* Global Search Input */}
            <div className="relative hidden md:block w-56 lg:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fields, tasks, data..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Language Switcher Pill */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/70 text-xs">
              <button
                onClick={() => toggleLanguage('en')}
                className={`px-2 py-1 rounded-lg font-semibold transition-all ${
                  lang === 'en' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => toggleLanguage('ur')}
                className={`px-2 py-1 rounded-lg font-semibold transition-all ${
                  lang === 'ur' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                اردو
              </button>
            </div>

            {/* Notification Bell */}
            <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2 border-2 border-white" />
            </button>

            {/* User Avatar & Profile Link */}
            <Link
              href="/profile"
              title="Farmer Profile & Settings"
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 transition-all text-xs font-semibold"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                {farmerName.charAt(0)}
              </div>
              <span className="hidden md:inline">{farmerName.split(' ')[0]}</span>
            </Link>

            {/* Header Logout Button */}
            <button
              onClick={handleLogout}
              title="Logout / Sign Out"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200/80 hover:border-rose-200 transition-all text-xs font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Extra Action Buttons if passed */}
            {actions && <div className="hidden sm:block">{actions}</div>}
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto pb-24">
          {children}
        </main>
      </div>

      {/* Floating AI Agronomist Bot Button (Floated Bottom-Right, wraps into icon and unwraps on click) */}
      <FloatingBot />
    </div>
  );
}
