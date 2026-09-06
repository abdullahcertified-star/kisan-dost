'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bot,
  Sprout,
  Scale,
  Bug,
  TrendingUp,
  Coins,
  CloudSun,
  Landmark,
  User,
  Menu,
  X,
  Sparkles,
  Activity
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<'en' | 'ur'>('en');

  // Initialize and persist language & RTL support
  useEffect(() => {
    const saved = localStorage.getItem('kd_lang') as 'en' | 'ur' | null;
    if (saved) {
      setLang(saved);
      document.documentElement.setAttribute('dir', saved === 'ur' ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', saved);
    }
  }, []);

  const toggleLanguage = (newLang: 'en' | 'ur') => {
    setLang(newLang);
    localStorage.setItem('kd_lang', newLang);
    document.documentElement.setAttribute('dir', newLang === 'ur' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', newLang);
    window.dispatchEvent(new CustomEvent('kd_language_change', { detail: newLang }));
  };

  const mainNav = [
    { href: '/', label: 'Dashboard', labelUrdu: 'ڈیش بورڈ', icon: LayoutDashboard },
    { href: '/assistant', label: 'AI Assistant', labelUrdu: 'اے آئی مشیر', icon: Bot, isHighlight: true },
    { href: '/crops', label: 'Crop Advisor', labelUrdu: 'فصل انتخاب', icon: Sprout },
    { href: '/fertilizer', label: 'Fertilizer', labelUrdu: 'کھاد کا حساب', icon: Scale },
    { href: '/pest-doctor', label: 'Pest Doctor', labelUrdu: 'ڈاکٹر برائے فصل', icon: Bug },
    { href: '/market', label: 'Mandi Rates', labelUrdu: 'منڈی ریٹس', icon: TrendingUp },
    { href: '/profit', label: 'Profit Calc', labelUrdu: 'منافع تخمینہ', icon: Coins },
    { href: '/weather', label: 'Weather', labelUrdu: 'موسم', icon: CloudSun },
    { href: '/schemes', label: 'Govt Schemes', labelUrdu: 'حکومتی اسکیمیں', icon: Landmark },
    { href: '/observability', label: 'Observability', labelUrdu: 'نگرانی و ٹریس', icon: Activity },
    { href: '/demo', label: 'Demo Mode', labelUrdu: 'ڈیمو موڈ', icon: Sparkles },
  ];

  const isActive = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname?.startsWith(href)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Title */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Sprout className="w-5 h-5 text-emerald-50" />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900 whitespace-nowrap">
                  Kisan Dost
                </span>
                <span className="font-urdu text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                  کسان دوست
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium tracking-tight">
                {lang === 'ur' ? 'اے آئی زرعی مشاورت و منڈی ریٹس پلیٹ فارم' : 'AI Agronomy & Mandi Platform'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {mainNav.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              if (item.isHighlight) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs ${
                      active
                        ? 'bg-emerald-800 text-white ring-2 ring-emerald-600/30'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                    <span>{lang === 'ur' ? item.labelUrdu : item.label}</span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <span>{lang === 'ur' ? item.labelUrdu : item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action: Demo Mode, Language Switcher, Profile & Mobile Menu */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Hackathon Demo Mode Launcher */}
            <Link
              href="/demo"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm border border-amber-400/40 transition hover:scale-105"
              title="Launch 1-Click Hackathon Guided Demo"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>{lang === 'ur' ? 'ڈیمو موڈ' : 'Demo Mode'}</span>
            </Link>

            {/* Bilingual Switcher (English / اردو) */}
            <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs font-bold shadow-2xs">
              <button
                onClick={() => toggleLanguage('en')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  lang === 'en' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                onClick={() => toggleLanguage('ur')}
                className={`px-2.5 py-1 rounded-lg font-urdu text-xs font-bold transition-all ${
                  lang === 'ur' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="اردو میں تبدیل کریں (RTL)"
              >
                اردو
              </button>
            </div>

            <Link
              href="/assistant"
              className="xl:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-700 text-white text-xs font-bold shadow-xs hover:bg-emerald-800 transition"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{lang === 'ur' ? 'اے آئی چیٹ' : 'AI Chat'}</span>
            </Link>

            <Link
              href="/profile"
              className={`hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                pathname === '/profile'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                  : 'bg-slate-50 hover:bg-emerald-50/70 border-slate-200 hover:border-emerald-200 text-slate-700'
              }`}
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-semibold">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {lang === 'ur' ? 'کسان پروفائل' : 'Farmer Profile'}
                </div>
                <div className="text-[10px] text-emerald-700 font-medium">Punjab Agro Zone</div>
              </div>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 focus:outline-none transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-2 pb-4">
            {mainNav.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium transition ${
                    active
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-emerald-700' : 'text-slate-500'}`} />
                  <span className="truncate">{lang === 'ur' ? item.labelUrdu : item.label}</span>
                </Link>
              );
            })}
            
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            >
              <User className="w-4 h-4 text-emerald-700" />
              <span>{lang === 'ur' ? 'کسان پروفائل' : 'Farm Profile'}</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
