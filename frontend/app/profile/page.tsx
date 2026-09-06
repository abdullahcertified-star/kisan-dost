'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import {
  createFarmerProfile,
  updateFarmerProfile,
  getFarmerProfile,
  FarmerProfileData,
} from '@/lib/api';

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
  const [name, setName] = useState('Chaudhry Tariq');
  const [district, setDistrict] = useState('Multan');
  const [province, setProvince] = useState('Punjab');
  const [landInput, setLandInput] = useState<number | string>(5.0);
  const [landUnit, setLandUnit] = useState<string>('acre');
  const [soilType, setSoilType] = useState('Loam (Mera - زرخیز میرا)');
  const [waterAvailability, setWaterAvailability] = useState('Canal + Tubewell');
  const [currentCrop, setCurrentCrop] = useState('Wheat (گندم)');
  const [preferredLanguage, setPreferredLanguage] = useState('urdu');

  const getComputedAcres = (): number => {
    const num = Number(landInput);
    if (!landInput || isNaN(num) || num <= 0) return 0;
    const unitObj = LAND_UNITS.find((u) => u.id === landUnit);
    return Number((num * (unitObj ? unitObj.factor : 1.0)).toFixed(3));
  };


  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load existing profile from localStorage on mount
  useEffect(() => {
    const savedId = typeof window !== 'undefined' ? localStorage.getItem('kisan_farmer_profile_id') : null;
    if (savedId) {
      setLoading(true);
      getFarmerProfile(savedId)
        .then((data) => {
          setProfileId(data.id || savedId);
          setName(data.name);
          setDistrict(data.district);
          setProvince(data.province);
          setLandInput(data.land_acres);
          setLandUnit('acre');
          setSoilType(data.soil_type);
          setWaterAvailability(data.water_availability);
          setCurrentCrop(data.current_crop);
          setPreferredLanguage(data.preferred_language);
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
        setFeedback({ type: 'success', message: 'Farmer profile updated successfully in SQLite database! (پروفائل کامیابی سے اپ ڈیٹ ہو گئی)' });
      } else {
        savedProfile = await createFarmerProfile(payload);
        if (savedProfile.id) {
          setProfileId(savedProfile.id);
          if (typeof window !== 'undefined') {
            localStorage.setItem('kisan_farmer_profile_id', savedProfile.id);
          }
        }
        setFeedback({ type: 'success', message: 'Farmer profile created and stored in SQLite database! (پروفائل ڈیٹا بیس میں محفوظ ہو گئی)' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/"
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center space-x-1 mb-1"
            >
              <span>← Back to Agronomy Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Farmer Profile — کسان کی پروفائل
            </h1>
            <p className="text-sm text-slate-600">
              Manage your agricultural identity, land acreage, soil characteristics, and irrigation sources.
            </p>
          </div>

          <Link
            href="/"
            className="hidden sm:inline-flex bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2 rounded-xl shadow"
          >
            Go to Helpline
          </Link>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl mb-6 text-sm flex items-center space-x-2 border shadow-sm ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-red-50 text-red-900 border-red-300'
            }`}
          >
            <span>{feedback.type === 'success' ? '✅' : '⚠️'}</span>
            <span className="font-medium">{feedback.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Personal Details */}
              <div className="border-b border-slate-100 pb-4">
                <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center space-x-1.5">
                  <span>👤</span>
                  <span>Personal Details (ذاتی معلومات)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Farmer Name (کسان کا نام) *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Chaudhry Tariq"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Preferred Language (ترجیحی زبان) *
                    </label>
                    <select
                      value={preferredLanguage}
                      onChange={(e) => setPreferredLanguage(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l.id} value={l.id}>{l.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Geographic Region */}
              <div className="border-b border-slate-100 pb-4">
                <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center space-x-1.5">
                  <span>📍</span>
                  <span>Location & Region (علاقائی معلومات)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Province (صوبہ) *
                    </label>
                    <select
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {PROVINCES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      District (ضلع) *
                    </label>
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Multan, Faisalabad, Sukkur"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Land & Agronomy */}
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center space-x-1.5">
                  <span>🌾</span>
                  <span>Agricultural & Soil Characteristics (زرعی تفصیلات)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                        className="w-1/2 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <select
                        value={landUnit}
                        onChange={(e) => setLandUnit(e.target.value)}
                        className="w-1/2 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        {LAND_UNITS.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Live Unit Conversion Indicator */}
                    <div className="flex items-center justify-between mt-1.5 text-xs">
                      <span className="text-emerald-900 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        = {getComputedAcres()} Standard Acres (ایکڑ)
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        {LAND_UNITS.find((u) => u.id === landUnit)?.sub}
                      </span>
                    </div>

                    {/* Quick chips with traditional units */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[
                        { label: '4 Kanals (0.5 ac)', val: 4, unit: 'kanal' },
                        { label: '8 Kanals / 1 Killa', val: 8, unit: 'kanal' },
                        { label: '5 Acres', val: 5, unit: 'acre' },
                        { label: '12.5 Acres (Kisan Card)', val: 12.5, unit: 'acre' },
                        { label: '1 Murabba (25 ac)', val: 1, unit: 'murabba' },
                      ].map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setLandInput(chip.val);
                            setLandUnit(chip.unit);
                          }}
                          className={`text-[11px] px-2 py-0.5 rounded border transition ${
                            Number(landInput) === chip.val && landUnit === chip.unit
                              ? 'bg-emerald-800 text-white border-emerald-800'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Current Crop (موجودہ فصل) *
                    </label>
                    <select
                      value={currentCrop}
                      onChange={(e) => setCurrentCrop(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {CROPS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Soil Type (زمین کی قسم) *
                    </label>
                    <select
                      value={soilType}
                      onChange={(e) => setSoilType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {SOIL_TYPES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Water Availability (پانی کا ذریعہ) *
                    </label>
                    <select
                      value={waterAvailability}
                      onChange={(e) => setWaterAvailability(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {WATER_SOURCES.map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl shadow transition text-sm flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <span>Saving to SQLite...</span>
                  ) : (
                    <>
                      <span>{profileId ? 'Update Farmer Profile (پروفائل اپ ڈیٹ کریں)' : 'Save Farmer Profile (پروفائل محفوظ کریں)'}</span>
                      <span>💾</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Digital Farmer ID Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-2xl p-6 shadow-xl border border-emerald-700/60 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl"></div>

              {/* Badge */}
              <div className="flex items-center justify-between border-b border-emerald-700/60 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🌾</span>
                  <div>
                    <h4 className="font-extrabold text-sm tracking-wide uppercase text-emerald-300">
                      Kisan Digital ID Card
                    </h4>
                    <p className="text-[11px] text-emerald-200">Government of Pakistan Agricultural Portal</p>
                  </div>
                </div>
                <span className="bg-emerald-600/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/40">
                  {profileId ? 'PERSISTENT' : 'UNSAVED'}
                </span>
              </div>

              {/* Farmer Name & Details */}
              <div className="mb-4">
                <span className="text-[11px] text-emerald-300 uppercase block font-semibold">Farmer Name</span>
                <h3 className="text-xl font-extrabold">{name || 'Kisan Bhai'}</h3>
                <p className="text-xs text-emerald-200 mt-0.5">{district}, {province}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div className="bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-700/40">
                  <span className="text-[10px] text-emerald-300 block">Cultivated Land</span>
                  <span className="text-base font-extrabold">{getComputedAcres()} Acres</span>
                  <span className="text-[10px] text-emerald-200 block">({landInput} {landUnit})</span>
                </div>
                <div className="bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-700/40">
                  <span className="text-[10px] text-emerald-300 block">Primary Crop</span>
                  <span className="text-base font-extrabold truncate block">{currentCrop.split(' ')[0]}</span>
                </div>
                <div className="bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-700/40">
                  <span className="text-[10px] text-emerald-300 block">Soil Type</span>
                  <span className="font-semibold text-emerald-100 truncate block">{soilType.split(' ')[0]}</span>
                </div>
                <div className="bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-700/40">
                  <span className="text-[10px] text-emerald-300 block">Water Source</span>
                  <span className="font-semibold text-emerald-100 truncate block">{waterAvailability}</span>
                </div>
              </div>

              {/* Digital Hash / ID */}
              <div className="bg-black/30 p-2 rounded-lg text-[10px] font-mono text-emerald-300 flex items-center justify-between">
                <span>Profile ID: {profileId ? `${profileId.substring(0, 16)}...` : 'Pending Save'}</span>
                <span>Language: {preferredLanguage.toUpperCase()}</span>
              </div>
            </div>

            {/* Scheme Eligibility Box based on Land Size */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center space-x-1.5">
                <span>🏛️</span>
                <span>Automated Scheme Eligibility</span>
              </h4>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                Based on your cultivated land of <strong className="text-emerald-800">{getComputedAcres()} acres</strong> ({landInput} {landUnit}) in {province}:
              </p>
              <div className="space-y-2 text-xs">
                {getComputedAcres() <= 12.5 ? (
                  <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 font-medium flex items-center space-x-2">
                    <span>✅</span>
                    <span><strong>CM Kisan Card</strong>: Fully eligible for interest-free loan up to PKR 150,000.</span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 font-medium flex items-center space-x-2">
                    <span>ℹ️</span>
                    <span>Land exceeds 12.5 acres; eligible for Green Tractor and Commercial Agri Subsidies.</span>
                  </div>
                )}
                <div className="p-2.5 bg-sky-50 rounded-lg border border-sky-200 text-sky-900 font-medium flex items-center space-x-2">
                  <span>✅</span>
                  <span><strong>Solar Tubewell Scheme</strong>: Eligible for up to 80% solar conversion subsidy.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
