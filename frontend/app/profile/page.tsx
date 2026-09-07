'use client';

import React, { useState, useEffect } from 'react';
import SaaSLayout from '@/components/SaaSLayout';
import Link from 'next/link';
import {
  createFarmerProfile,
  updateFarmerProfile,
  getFarmerProfile,
  FarmerProfileData,
} from '@/lib/api';
import { loadSavedItem } from '@/lib/storage';
import { User, Mail, Phone, MapPin, Sprout, ShieldCheck, CheckCircle2, AlertCircle, Save, Lock, KeyRound, Eye, EyeOff, Sparkles, Key, ExternalLink } from 'lucide-react';

const PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Gilgit-Baltistan',
  'Azad Jammu and Kashmir',
  'Islamabad',
];

const WATER_SOURCES = [
  'Canal',
  'Tubewell',
  'Canal + Tubewell',
  'Rainfed / Barani',
  'Drip / Sprinkler',
];

const SOIL_TYPES = [
  'Loam (Mera - زرخیز میرا)',
  'Clay Loam (Paki Mera - پکی میرا)',
  'Sandy Loam (Retli Mera - ریتلی میرا)',
  'Clay (Chikni - چکنی مٹی)',
];

const LANGUAGES = [
  { id: 'urdu', label: 'اردو (Urdu)' },
  { id: 'roman_urdu', label: 'Roman Urdu (رومن اردو)' },
  { id: 'english', label: 'English' },
  { id: 'punjabi', label: 'پنجابی (Punjabi)' },
  { id: 'sindhi', label: 'سنڌي (Sindhi)' },
  { id: 'pashto', label: 'پښتو (Pashto)' },
];

const CROPS = [
  'Wheat (گندم)',
  'Cotton (کپاس)',
  'Basmati Rice (چاول)',
  'Maize / Corn (مکئی)',
  'Sugarcane (کماد)',
  'Mustard / Raya (سرسوں)',
  'Chickpea / Gram (چنا)',
  'Potato (آلو)',
];

const LAND_UNITS = [
  { id: 'acre', label: 'Acre / Killa (ایکڑ / قلعہ)', factor: 1.0, sub: '1 ایکڑ = 8 کنال' },
  { id: 'kanal', label: 'Kanal (کنال)', factor: 0.125, sub: '8 کنال = 1 ایکڑ' },
  { id: 'marla', label: 'Marla (مرلہ)', factor: 0.00625, sub: '20 مرلہ = 1 کنال (160 مرلہ = 1 ایکڑ)' },
  { id: 'murabba', label: 'Murabba (مربع)', factor: 25.0, sub: '1 مربع = 25 ایکڑ' },
  { id: 'bigha', label: 'Bigha (بیگھہ)', factor: 0.5, sub: '1 بیگھہ = 4 کنال (0.5 ایکڑ)' },
  { id: 'peli', label: 'Peli / Khet (پیلی / کھیت)', factor: 1.0, sub: '1 پیلی = روایتی 1 قلعہ / ایکڑ' },
  { id: 'jarib', label: 'Jarib (جریب)', factor: 0.5, sub: '1 جریب = 4 کنال (0.5 ایکڑ)' },
];

export default function ProfilePage() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [name, setName] = useState('Abdullah');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('Faisalabad');
  const [province, setProvince] = useState('Punjab');
  const [landInput, setLandInput] = useState<number | string>(5.0);
  const [landUnit, setLandUnit] = useState<string>('acre');
  const [soilType, setSoilType] = useState('Loam (Mera - زرخیز میرا)');
  const [waterAvailability, setWaterAvailability] = useState('Canal + Tubewell');
  const [currentCrop, setCurrentCrop] = useState('Wheat (گندم)');
  const [preferredLanguage, setPreferredLanguage] = useState('urdu');

  // Change password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdFeedback, setPwdFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Gemini API Key Profile States
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [maskedApiKey, setMaskedApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [apiKeyFeedback, setApiKeyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const getComputedAcres = (): number => {
    const num = Number(landInput);
    if (!landInput || isNaN(num) || num <= 0) return 0;
    const unitObj = LAND_UNITS.find((u) => u.id === landUnit);
    return Number((num * (unitObj ? unitObj.factor : 1.0)).toFixed(3));
  };

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdFeedback(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdFeedback({ type: 'error', message: 'Please fill all password fields. (تمام خانے پر کریں)' });
      return;
    }

    if (newPassword.length < 8) {
      setPwdFeedback({ type: 'error', message: 'New password must be at least 8 characters long. (پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے)' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdFeedback({ type: 'error', message: 'New password and confirm password do not match. (نئے پاس ورڈ کی تصدیق مماثل نہیں ہے)' });
      return;
    }

    if (currentPassword === newPassword) {
      setPwdFeedback({ type: 'error', message: 'New password cannot be the same as your current password. (نیا پاس ورڈ موجودہ سے مختلف ہونا چاہیے)' });
      return;
    }

    setPwdLoading(true);
    try {
      const res = await fetch('/api/farmer/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPwdFeedback({ type: 'error', message: data.error || 'Failed to update password.' });
        return;
      }

      setPwdFeedback({ type: 'success', message: data.message || 'Password changed successfully! (پاس ورڈ کامیابی سے تبدیل ہو گیا)' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdFeedback({ type: 'error', message: 'Connection error: ' + (err.message || 'Could not reach server') });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiKeyFeedback(null);
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setApiKeyFeedback({ type: 'error', message: 'Please enter a valid API key. (برائے مہربانی درست اے پی آئی کلید درج کریں)' });
      return;
    }

    setApiKeyLoading(true);
    try {
      const res = await fetch('/api/farmer/api-key', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiKeyFeedback({ type: 'error', message: data.error || 'Failed to save API key to profile.' });
        return;
      }

      setHasApiKey(true);
      setMaskedApiKey(data.gemini_api_key || (trimmed.substring(0, 6) + '••••••••' + trimmed.substring(trimmed.length - 4)));
      setApiKeyInput('');
      localStorage.setItem('kd_custom_gemini_key', trimmed);
      setApiKeyFeedback({
        type: 'success',
        message: 'Google Gemini API key securely saved in your database profile! AI Chat will now use it automatically. (اے پی آئی کلید کامیابی سے آپ کے کلاؤڈ پروفائل میں محفوظ ہو گئی ہے)',
      });
    } catch (err: any) {
      setApiKeyFeedback({ type: 'error', message: 'Connection error: ' + (err.message || 'Server error') });
    } finally {
      setApiKeyLoading(false);
    }
  };

  const handleRemoveApiKey = async () => {
    setApiKeyFeedback(null);
    setApiKeyLoading(true);
    try {
      const res = await fetch('/api/farmer/api-key', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: '' }),
      });
      if (res.ok) {
        setHasApiKey(false);
        setMaskedApiKey('');
        setApiKeyInput('');
        localStorage.removeItem('kd_custom_gemini_key');
        setApiKeyFeedback({
          type: 'success',
          message: 'Gemini API key removed from profile. (کلید پروفائل سے ہٹا دی گئی ہے)',
        });
      }
    } catch (err: any) {
      setApiKeyFeedback({ type: 'error', message: 'Failed to remove API key: ' + err.message });
    } finally {
      setApiKeyLoading(false);
    }
  };

  // Load existing profile from /api/me or localStorage on mount
  useEffect(() => {
    // 1. Fetch live authenticated user profile from Neon DB
    fetch('/api/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          if (data.user.name) setName(data.user.name);
          if (data.user.email) setEmail(data.user.email);
          if (data.user.phone) setPhone(data.user.phone);
          if (data.user.district) setDistrict(data.user.district);
          if (data.user.acres) setLandInput(data.user.acres);
          if (data.user.crop) setCurrentCrop(data.user.crop);
          if (data.user.gemini_api_key) {
            setMaskedApiKey(data.user.gemini_api_key);
          }
          if (data.user.has_gemini_key) {
            setHasApiKey(true);
          }
          if (data.user.gemini_api_key_plain) {
            localStorage.setItem('kd_custom_gemini_key', data.user.gemini_api_key_plain);
            setHasApiKey(true);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not load profile from /api/me:', err);
      });

    const localKey = localStorage.getItem('kd_custom_gemini_key');
    if (localKey && localKey.trim().length > 10 && !localKey.includes('•') && !localKey.includes('*')) {
      setHasApiKey(true);
      setMaskedApiKey(localKey.substring(0, 6) + '••••••••' + localKey.substring(localKey.length - 4));
    }

    // 2. Fallback to client-side cached profile
    const localProfile = loadSavedItem<any>('kisan_farmer_profile', null) || loadSavedItem<any>('kd_dashboard_profile', null);
    if (localProfile) {
      if (localProfile.name) setName(localProfile.name);
      if (localProfile.email) setEmail(localProfile.email);
      if (localProfile.phone) setPhone(localProfile.phone);
      if (localProfile.district) setDistrict(localProfile.district);
      if (localProfile.province) setProvince(localProfile.province);
      if (localProfile.land_acres) setLandInput(localProfile.land_acres);
      if (localProfile.soil_type) setSoilType(localProfile.soil_type);
      if (localProfile.water_availability) setWaterAvailability(localProfile.water_availability);
      if (localProfile.current_crop) setCurrentCrop(localProfile.current_crop);
      if (localProfile.preferred_language) setPreferredLanguage(localProfile.preferred_language);
    }

    const savedId = typeof window !== 'undefined' ? localStorage.getItem('kisan_farmer_profile_id') : null;
    if (savedId) {
      setLoading(true);
      getFarmerProfile(savedId)
        .then((data) => {
          setProfileId(data.id || savedId);
          if (data.name) setName(data.name);
          if (data.district) setDistrict(data.district);
          if (data.province) setProvince(data.province);
          if (data.land_acres) setLandInput(data.land_acres);
          if (data.soil_type) setSoilType(data.soil_type);
          if (data.water_availability) setWaterAvailability(data.water_availability);
          if (data.current_crop) setCurrentCrop(data.current_crop);
          if (data.preferred_language) setPreferredLanguage(data.preferred_language);
        })
        .catch((err) => {
          console.warn('Could not load profile by stored ID:', err);
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const finalAcres = getComputedAcres();
    if (finalAcres <= 0) {
      setFeedback({ type: 'error', message: 'Land size must be strictly greater than 0. (رقبہ 0 سے زیادہ درج کریں)' });
      return;
    }

    if (!name.trim() || !district.trim()) {
      setFeedback({ type: 'error', message: 'Name and District are required.' });
      return;
    }

    setLoading(true);

    const payload: FarmerProfileData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      district: district.trim(),
      province,
      land_acres: finalAcres,
      soil_type: soilType,
      water_availability: waterAvailability,
      current_crop: currentCrop,
      preferred_language: preferredLanguage,
    };

    try {
      let savedProfile: FarmerProfileData;
      if (profileId) {
        savedProfile = await updateFarmerProfile(profileId, payload);
      } else {
        savedProfile = await createFarmerProfile(payload);
        if (savedProfile.id) {
          setProfileId(savedProfile.id);
          if (typeof window !== 'undefined') {
            localStorage.setItem('kisan_farmer_profile_id', savedProfile.id);
          }
        }
      }

      // Sync across Farm OS storage
      if (typeof window !== 'undefined') {
        localStorage.setItem('kisan_farmer_profile', JSON.stringify(payload));
        localStorage.setItem('kd_dashboard_profile', JSON.stringify({
          ...payload,
          role: 'Farm Manager & Owner',
        }));
      }

      setFeedback({ type: 'success', message: 'Farmer profile updated successfully! (پروفائل کامیابی سے محفوظ ہو گئی)' });
    } catch (err: any) {
      // Graceful fallback to client storage if backend offline
      if (typeof window !== 'undefined') {
        localStorage.setItem('kisan_farmer_profile', JSON.stringify(payload));
        localStorage.setItem('kd_dashboard_profile', JSON.stringify({
          ...payload,
          role: 'Farm Manager & Owner',
        }));
      }
      setFeedback({ type: 'success', message: 'Profile saved locally in Kisan Dost Farm OS!' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SaaSLayout
      title="Farmer Profile & Settings"
      subtitle="Manage your agricultural identity, land acreage, soil characteristics, and irrigation sources"
      badge="Farm OS Profile"
    >
      {/* Feedback Notification Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-sm flex items-center space-x-2.5 border shadow-xs transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Profile Form Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Details Section */}
            <div className="border-b border-slate-100 pb-5">
              <h3 className="font-bold text-slate-900 text-sm mb-3.5 flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <span>Personal Details (ذاتی معلومات)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Farmer Name (کسان کا نام) *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Abdullah"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Email Address (ای میل ایڈریس)</span>
                    <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md flex items-center space-x-1">
                      <Lock className="w-2.5 h-2.5 text-amber-600" />
                      <span>Primary ID (Locked)</span>
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email || 'No email registered'}
                      readOnly
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl pl-9 pr-9 py-2 text-sm cursor-not-allowed select-none focus:outline-hidden"
                      title="Account email address is locked for security and cannot be modified."
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Primary login identity is locked to protect account access. (سیکیورٹی کی خاطر ای میل تبدیل نہیں ہو سکتی)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phone Number (موبائل نمبر)
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 03001234567"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden transition"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Preferred Language (ترجیحی زبان) *
                  </label>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden transition"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Geographic Region Section */}
            <div className="border-b border-slate-100 pb-5">
              <h3 className="font-bold text-slate-900 text-sm mb-3.5 flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <MapPin className="w-4 h-4" />
                </div>
                <span>Location & Region (علاقائی معلومات)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Province (صوبہ) *
                  </label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden transition"
                  >
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    District (ضلع) *
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Faisalabad, Multan, Lahore"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden transition"
                  />
                </div>
              </div>
            </div>

            {/* Land & Agronomy Characteristics */}
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-3.5 flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Sprout className="w-4 h-4" />
                </div>
                <span>Agricultural & Soil Characteristics (زرعی تفصیلات)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Land Size (کل رقبہ) *
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      value={landInput}
                      onChange={(e) => setLandInput(e.target.value)}
                      placeholder="e.g. 5"
                      className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden transition"
                    />
                    <select
                      value={landUnit}
                      onChange={(e) => setLandUnit(e.target.value)}
                      className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden transition"
                    >
                      {LAND_UNITS.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Live Unit Conversion Indicator */}
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/80 text-[11px]">
                      = {getComputedAcres()} Standard Acres (ایکڑ)
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {LAND_UNITS.find((u) => u.id === landUnit)?.sub}
                    </span>
                  </div>

                  {/* Quick selection chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {[
                      { label: '4 Kanals (0.5 ac)', val: 4, unit: 'kanal' },
                      { label: '8 Kanals / 1 Killa', val: 8, unit: 'kanal' },
                      { label: '5 Acres', val: 5, unit: 'acre' },
                      { label: '12.5 Acres (Kisan Card)', val: 12.5, unit: 'acre' },
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setLandInput(chip.val);
                          setLandUnit(chip.unit);
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                          Number(landInput) === chip.val && landUnit === chip.unit
                            ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Current Crop (موجودہ فصل) *
                  </label>
                  <select
                    value={currentCrop}
                    onChange={(e) => setCurrentCrop(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden transition"
                  >
                    {CROPS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Soil Type (زمین کی قسم) *
                  </label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden transition"
                  >
                    {SOIL_TYPES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Water Availability (پانی کا ذریعہ) *
                  </label>
                  <select
                    value={waterAvailability}
                    onChange={(e) => setWaterAvailability(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden transition"
                  >
                    {WATER_SOURCES.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl shadow-xs hover:shadow-md transition-all text-sm flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving Profile...' : 'Save Profile & Settings (پروفائل محفوظ کریں)'}</span>
              </button>
            </div>
          </form>
        </div>

          {/* Dedicated Google Gemini API Key Management Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
            <div className="border-b border-slate-100 pb-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                </div>
                <span>Google Gemini API Key (اے آئی کی کلید)</span>
              </h3>

              {hasApiKey ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Encrypted in Profile (محفوظ)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Not Linked (کلید درج نہیں)</span>
                </span>
              )}
            </div>

            {/* Status & Explanation */}
            <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 mb-5 text-xs text-slate-600 space-y-2">
              <p className="leading-relaxed">
                {hasApiKey ? (
                  <>
                    ✅ <strong>Active Key Configured:</strong> Your Google Gemini API key is securely encrypted (AES-256-GCM) in your cloud profile. When you log out and log back in from any device or browser, your key is preserved permanently.
                  </>
                ) : (
                  <>
                    ⚠️ <strong>No Personal Key Connected:</strong> Save your personal Google Gemini API key here so you never have to re-enter it when chatting with the AI Agronomist or diagnosing crop diseases.
                  </>
                )}
              </p>
              {hasApiKey && maskedApiKey && (
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs text-slate-700">
                  <span>Current Key: <strong>{maskedApiKey}</strong></span>
                  <span className="text-[10px] text-emerald-600 font-sans font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                    🔒 Verified
                  </span>
                </div>
              )}
            </div>

            {apiKeyFeedback && (
              <div
                className={`p-3.5 mb-4 rounded-xl text-xs flex items-center space-x-2 border ${
                  apiKeyFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}
              >
                {apiKeyFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span className="font-medium">{apiKeyFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>{hasApiKey ? 'Update Gemini API Key (نئی کلید تبدیل کریں)' : 'Enter Gemini API Key (اے آئی کی کلید درج کریں)'}</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold underline flex items-center gap-1"
                  >
                    <span>Get Free Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="e.g. AIzaSy..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-sm text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden transition"
                  />
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Obtain your free lifetime key at <strong>aistudio.google.com</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={apiKeyLoading || !apiKeyInput.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 px-5 rounded-xl shadow-xs transition-all text-xs flex items-center space-x-2 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-emerald-200" />
                  <span>{apiKeyLoading ? 'Saving to Profile...' : 'Save Key to Profile (محفوظ کریں)'}</span>
                </button>

                {hasApiKey && (
                  <button
                    type="button"
                    onClick={handleRemoveApiKey}
                    disabled={apiKeyLoading}
                    className="text-xs font-semibold text-slate-500 hover:text-rose-600 px-3 py-2 rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                  >
                    Remove Key (کلید ہٹائیں)
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Account Security & Change Password Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
            <div className="border-b border-slate-100 pb-4 mb-5">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <span>Change Password (پاس ورڈ تبدیل کریں)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Protect your farm account with a secure, private password. (اپنے اکاؤنٹ کے لیے نیا اور محفوظ پاس ورڈ منتخب کریں)
              </p>
            </div>

            {pwdFeedback && (
              <div
                className={`p-3.5 mb-5 rounded-2xl text-xs flex items-center space-x-2.5 border transition-all ${
                  pwdFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}
              >
                {pwdFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span className="font-medium">{pwdFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Current Password (موجودہ پاس ورڈ) *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden transition"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    New Password (نیا پاس ورڈ) *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden transition"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirm New Password (تصدیق کریں) *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden transition"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold py-2.5 px-5 rounded-xl shadow-xs hover:shadow-md transition-all text-xs flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{pwdLoading ? 'Updating Password...' : 'Update Password (پاس ورڈ تبدیل کریں)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Modern Live Digital Farmer ID Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 text-white rounded-3xl p-6 shadow-xl border border-emerald-700/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl"></div>

            {/* Card Top Branding */}
            <div className="flex items-center justify-between border-b border-emerald-800/40 pb-4 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400 shadow-inner">
                  🌾
                </div>
                <div>
                  <h4 className="font-extrabold text-xs tracking-wider uppercase text-emerald-400">
                    Kisan Digital ID
                  </h4>
                  <p className="text-[11px] text-slate-300">Agricultural Operating System</p>
                </div>
              </div>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-400/30">
                ACTIVE
              </span>
            </div>

            {/* Farmer Name, Email & Contact Identity */}
            <div className="mb-5">
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-semibold">Farmer Identity</span>
              <h3 className="text-xl font-bold text-white mt-0.5">{name || 'Kisan Bhai'}</h3>
              
              {/* Farmer Email Badge */}
              <div className="mt-2 space-y-1.5">
                {email ? (
                  <div className="flex items-center space-x-2 text-xs text-emerald-300 font-medium bg-emerald-950/70 border border-emerald-500/30 rounded-lg px-2.5 py-1 w-fit max-w-full">
                    <Mail className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">{email}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-xs text-slate-400 bg-black/30 border border-white/5 rounded-lg px-2.5 py-1 w-fit">
                    <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="text-[11px]">No email registered (ای میل درج نہیں)</span>
                  </div>
                )}
                {phone && (
                  <div className="flex items-center space-x-2 text-xs text-slate-300 px-0.5">
                    <Phone className="w-3 h-3 text-emerald-400/80 flex-shrink-0" />
                    <span>{phone}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-300 mt-2">{district}, {province}</p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs mb-5">
              <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
                <span className="text-[10px] text-emerald-400 block font-medium">Cultivated Land</span>
                <span className="text-base font-bold text-white">{getComputedAcres()} Acres</span>
                <span className="text-[10px] text-slate-400 block">({landInput} {landUnit})</span>
              </div>
              <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
                <span className="text-[10px] text-emerald-400 block font-medium">Primary Crop</span>
                <span className="text-base font-bold text-white truncate block">{currentCrop.split(' ')[0]}</span>
              </div>
              <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
                <span className="text-[10px] text-emerald-400 block font-medium">Soil Type</span>
                <span className="font-semibold text-slate-200 truncate block">{soilType.split(' ')[0]}</span>
              </div>
              <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
                <span className="text-[10px] text-emerald-400 block font-medium">Water Source</span>
                <span className="font-semibold text-slate-200 truncate block">{waterAvailability}</span>
              </div>
            </div>

            {/* Bottom Meta */}
            <div className="bg-black/40 px-3 py-2 rounded-xl text-[10px] font-mono text-emerald-300/80 flex items-center justify-between border border-white/5">
              <span>ZONE: {district.toUpperCase()}</span>
              <span>LANG: {preferredLanguage.toUpperCase()}</span>
            </div>
          </div>

          {/* Automated Scheme Eligibility */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
            <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span>Automated Scheme Eligibility</span>
            </h4>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Based on your cultivated land of <strong className="text-slate-800 font-semibold">{getComputedAcres()} acres</strong> ({landInput} {landUnit}) in {province}:
            </p>
            <div className="space-y-2.5 text-xs">
              {getComputedAcres() <= 12.5 ? (
                <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/80 text-emerald-900 font-medium flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span><strong>CM Kisan Card</strong>: Fully eligible for interest-free loan up to PKR 150,000.</span>
                </div>
              ) : (
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-amber-900 font-medium flex items-center space-x-2.5">
                  <span className="text-amber-600">ℹ️</span>
                  <span>Land exceeds 12.5 acres; eligible for Green Tractor and Commercial Agri Subsidies.</span>
                </div>
              )}
              <div className="p-3 bg-sky-50/80 rounded-xl border border-sky-200/80 text-sky-900 font-medium flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-sky-600 flex-shrink-0" />
                <span><strong>Solar Tubewell Scheme</strong>: Eligible for up to 80% solar conversion subsidy.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SaaSLayout>
  );
}
