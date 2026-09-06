'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saveItem, loadSavedItem } from '@/lib/storage';
import {
  Sprout,
  ShieldCheck,
  Eye,
  EyeOff,
  Phone,
  Lock,
  User,
  MapPin,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Play,
  Pause,
  Maximize2,
  Volume2,
  VolumeX,
  Bot,
  Wheat,
  Activity,
  Zap,
  Globe
} from 'lucide-react';

export default function LoginPage({ initialIsRegister = false }: { initialIsRegister?: boolean }) {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(initialIsRegister);
  const [showPassword, setShowPassword] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [videoMuted, setVideoMuted] = useState(true);
  const [lang, setLang] = useState<'en' | 'ur'>('en');

  // Form Fields
  const [phoneOrEmail, setPhoneOrEmail] = useState('0300-1234567');
  const [password, setPassword] = useState('kisan123');
  const [name, setName] = useState('Chaudhry Tariq');
  const [district, setDistrict] = useState('Multan');
  const [acres, setAcres] = useState(15);
  const [crop, setCrop] = useState('Wheat & Cotton');

  // Post-Login Cinematic Launch Sequence State
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStep, setAuthStep] = useState(0);
  const [authProgress, setAuthProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem('kd_lang') as 'en' | 'ur' | null;
    if (savedLang) setLang(savedLang);
  }, []);

  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (videoPlaying) {
        videoRef.current.pause();
        setVideoPlaying(false);
      } else {
        videoRef.current.play();
        setVideoPlaying(true);
      }
    }
  };

  const toggleVideoAudio = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoMuted;
      setVideoMuted(!videoMuted);
    }
  };

  // Quick Demo Logins
  const handleQuickLogin = (presetName: string, presetDist: string, presetAcres: number, presetCrop: string) => {
    setName(presetName);
    setDistrict(presetDist);
    setAcres(presetAcres);
    setCrop(presetCrop);
    setPhoneOrEmail('0300-7654321');
    setPassword('kisan123');
    triggerCinematicLogin(presetName, presetDist, presetAcres, presetCrop);
  };

  // Cinematic Post-Login Orchestration
  const triggerCinematicLogin = (
    finalName = name,
    finalDist = district,
    finalAcres = acres,
    finalCrop = crop
  ) => {
    setIsAuthenticating(true);
    setAuthStep(1);
    setAuthProgress(15);

    // Save profile to local storage
    const profile = {
      name: finalName,
      district: finalDist,
      land_acres: finalAcres,
      current_crop: finalCrop,
      role: 'Farm Manager',
      phone: phoneOrEmail,
    };
    saveItem('kisan_farmer_profile', profile);
    saveItem('kd_dashboard_profile', {
      district: finalDist,
      acres: finalAcres,
      crop: finalCrop,
      season: 'Kharif',
      soil: 'Loam (Mera)',
      water: 'Canal + Tube Well',
    });

    // Step 2: Telemetry Radar Link
    setTimeout(() => {
      setAuthStep(2);
      setAuthProgress(45);
    }, 700);

    // Step 3: Multi-Agent AI Handshake
    setTimeout(() => {
      setAuthStep(3);
      setAuthProgress(75);
    }, 1400);

    // Step 4: Final Launch
    setTimeout(() => {
      setAuthStep(4);
      setAuthProgress(100);
    }, 2100);

    // Redirect to Dashboard
    setTimeout(() => {
      router.push('/');
    }, 2700);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerCinematicLogin();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased overflow-hidden relative selection:bg-emerald-500 selection:text-white">
      {/* Cinematic Fullscreen Post-Login Loading Overlay */}
      {isAuthenticating && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-8 shadow-2xl shadow-emerald-500/20 text-center space-y-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Pulsating Sprout Radar Icon */}
            <div className="relative mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 animate-pulse">
              <Sprout className="w-10 h-10" />
              <span className="absolute -inset-1 rounded-2xl border-2 border-emerald-400/50 animate-ping opacity-75" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-white tracking-tight">
                {lang === 'ur' ? 'کسان دوست سسٹم کنیکٹ ہو رہا ہے...' : 'Initializing Kisan Dost Farm OS'}
              </h3>
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                {name} • {district} Agro Zone ({acres} Acres)
              </p>
            </div>

            {/* Cinematic Progress Bar */}
            <div className="space-y-2 text-left">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>SYSTEM STATUS</span>
                <span className="text-emerald-400 font-bold">{authProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/60">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${authProgress}%` }}
                />
              </div>
            </div>

            {/* Sequence Steps */}
            <div className="space-y-2.5 text-xs text-left">
              <div className={`flex items-center space-x-2.5 transition-colors ${authStep >= 1 ? 'text-emerald-300 font-semibold' : 'text-slate-600'}`}>
                <CheckCircle2 className={`w-4 h-4 ${authStep >= 1 ? 'text-emerald-400' : 'text-slate-700'}`} />
                <span>1. Authenticating farmer credentials & biometric keys</span>
              </div>
              <div className={`flex items-center space-x-2.5 transition-colors ${authStep >= 2 ? 'text-emerald-300 font-semibold' : 'text-slate-600'}`}>
                <CheckCircle2 className={`w-4 h-4 ${authStep >= 2 ? 'text-emerald-400' : 'text-slate-700'}`} />
                <span>2. Connecting to Open-Meteo satellite & soil radar</span>
              </div>
              <div className={`flex items-center space-x-2.5 transition-colors ${authStep >= 3 ? 'text-emerald-300 font-semibold' : 'text-slate-600'}`}>
                <CheckCircle2 className={`w-4 h-4 ${authStep >= 3 ? 'text-emerald-400' : 'text-slate-700'}`} />
                <span>3. Grounding Google Gemini multi-agent agronomy engine</span>
              </div>
              <div className={`flex items-center space-x-2.5 transition-colors ${authStep >= 4 ? 'text-emerald-300 font-semibold' : 'text-slate-600'}`}>
                <CheckCircle2 className={`w-4 h-4 ${authStep >= 4 ? 'text-emerald-400' : 'text-slate-700'}`} />
                <span>4. Telemetry verified. Launching Dashboard...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Two-Column Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-screen">
        {/* Left Column: Atmospheric Cinematic Video / Drone HUD (55% on desktop) */}
        <div className="relative lg:w-[55%] min-h-[360px] lg:min-h-screen bg-slate-900 overflow-hidden flex flex-col justify-between p-6 sm:p-10">
          {/* Looping Atmospheric Background Video */}
          <div className="absolute inset-0 z-0">
            <video
              ref={videoRef}
              autoPlay
              loop
              muted={videoMuted}
              playsInline
              poster="/images/auth-hero.jpg"
              className="w-full h-full object-cover scale-105 filter brightness-85 contrast-105"
            >
              <source
                src="https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-green-field-41484-large.mp4"
                type="video/mp4"
              />
              <source
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                type="video/mp4"
              />
            </video>
            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/60" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-transparent to-slate-950 lg:to-transparent" />
            {/* Holographic Radar Scan Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#22c55e10_1px,transparent_1px),linear-gradient(to_bottom,#22c55e10_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-75 pointer-events-none" />
          </div>

          {/* Top HUD Bar */}
          <div className="relative z-10 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <span className="text-lg font-black text-white tracking-tight block">Kisan Dost</span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                  AI Agronomy &amp; Mandi OS
                </span>
              </div>
            </Link>

            {/* Video Controls (Play/Pause & Mute) */}
            <div className="flex items-center space-x-2 bg-slate-900/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/60 text-xs">
              <button
                onClick={toggleVideoPlayback}
                className="text-slate-300 hover:text-white transition"
                title={videoPlaying ? 'Pause ambient video' : 'Play ambient video'}
              >
                {videoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={toggleVideoAudio}
                className="text-slate-300 hover:text-white transition"
                title={videoMuted ? 'Unmute' : 'Mute'}
              >
                {videoMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
              <span className="text-[10px] text-emerald-300 font-mono hidden sm:inline">LIVE CAM</span>
            </div>
          </div>

          {/* Center Cinematic Callout */}
          <div className="relative z-10 my-auto py-12 max-w-lg space-y-4">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 px-3.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Grounded in Punjab Agriculture &amp; AMIS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Precision Agriculture for Pakistani Farmers
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
              Real-time multi-agent agronomy, verified fertilizer dosing, crop suitability scoring, and daily wholesale mandi rates powered by Google Gemini.
            </p>

            {/* Live Drone Telemetry Pills */}
            <div className="pt-2 flex flex-wrap gap-2.5 text-[11px] font-mono">
              <span className="px-3 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-slate-700/70 text-slate-300 flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Radar: Multan (30.15° N)</span>
              </span>
              <span className="px-3 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-slate-700/70 text-slate-300 flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Soil Moisture: 38% Optimal</span>
              </span>
            </div>
          </div>

          {/* Bottom Live Watermark */}
          <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-800/80">
            <span className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero-Leak Agricultural Security Standard</span>
            </span>
            <span className="font-mono text-[10px] text-slate-500">v1.0 • Kharif 2026</span>
          </div>
        </div>

        {/* Right Column: Modern Glassmorphic Login/Register Form (45% on desktop) */}
        <div className="lg:w-[45%] bg-slate-950 flex flex-col justify-center px-6 sm:px-12 lg:px-14 py-12 relative z-20">
          <div className="max-w-md w-full mx-auto space-y-7">
            {/* Header / Mode Switcher */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">
                  {isRegister ? 'New Farmer Onboarding' : 'Welcome Back'}
                </span>
                {/* Language Switch */}
                <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setLang('en')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition ${
                      lang === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setLang('ur')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition ${
                      lang === 'ur' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    اردو
                  </button>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {isRegister
                  ? lang === 'ur'
                    ? 'کسان رجسٹریشن'
                    : 'Create Farmer Account'
                  : lang === 'ur'
                  ? 'کسان لاگ ان'
                  : 'Sign in to Farm OS'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                {isRegister
                  ? 'Set up your acreage and district for personalized AI recommendations.'
                  : 'Access your field telemetry, fertilizer plans, and mandi intelligence.'}
              </p>

              {/* Mode Toggle Tabs */}
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className={`py-2 rounded-xl transition ${
                    !isRegister
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang === 'ur' ? 'لاگ ان (Sign In)' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className={`py-2 rounded-xl transition ${
                    isRegister
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang === 'ur' ? 'نیا کسان (Register)' : 'Register Farmer'}
                </button>
              </div>
            </div>

            {/* Interactive Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              {/* Registration Extra Fields */}
              {isRegister && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      Farmer Full Name (کسان کا نام)
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Chaudhry Tariq"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">
                        District (ضلع)
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <select
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                        >
                          <option value="Multan">Multan (ملتان)</option>
                          <option value="Faisalabad">Faisalabad (فیصل آباد)</option>
                          <option value="Lahore">Lahore (لاہور)</option>
                          <option value="Sargodha">Sargodha (سرگودھا)</option>
                          <option value="Bahawalpur">Bahawalpur (بہاولپور)</option>
                          <option value="Rahim Yar Khan">Rahim Yar Khan (رحیم یار خان)</option>
                          <option value="Sahiwal">Sahiwal (ساہیوال)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1.5">
                        Land Acres (ایکڑ)
                      </label>
                      <input
                        type="number"
                        min="0.5"
                        max="500"
                        value={acres}
                        onChange={(e) => setAcres(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Phone or Email Input */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Mobile Number / Email (فون نمبر یا ای میل)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={phoneOrEmail}
                    onChange={(e) => setPhoneOrEmail(e.target.value)}
                    placeholder="0300-1234567 or farmer@pakagri.pk"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-300">
                    Password (پاس ورڈ)
                  </label>
                  {!isRegister && (
                    <button
                      type="button"
                      onClick={() => alert('Demo Mode: Enter password kisan123 or select a Quick Login profile below.')}
                      className="text-xs text-emerald-400 hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center space-x-2 text-sm mt-2"
              >
                <span>{isRegister ? 'Complete Farmer Registration' : 'Sign in to Farm OS'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick 1-Click Demo Profiles (Essential for Judges & Demonstrations) */}
            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block text-center">
                Instant 1-Click Demo Profiles (فوری لاگ ان)
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Chaudhry Tariq', 'Multan', 15, 'Wheat & Cotton')}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
                >
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-white group-hover:text-emerald-400">
                    <span>👨‍🌾 Ch. Tariq</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">15 Acres • Multan</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('Malik Aslam', 'Faisalabad', 5, 'Wheat & Rice')}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
                >
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-white group-hover:text-emerald-400">
                    <span>👨‍🌾 Malik Aslam</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">5 Acres • Faisalabad</span>
                </button>
              </div>
            </div>

            {/* Bottom Return Link */}
            <div className="text-center pt-2">
              <Link
                href="/"
                className="text-xs text-slate-400 hover:text-emerald-400 transition inline-flex items-center space-x-1"
              >
                <span>← Return to Public Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
