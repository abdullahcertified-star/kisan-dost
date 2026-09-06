'use client';

import React from 'react';

interface FarmerProfileBarProps {
  district: string;
  setDistrict: (val: string) => void;
  acres: number | string;
  setAcres: (val: any) => void;
  season: string;
  setSeason: (val: string) => void;
  crop: string;
  setCrop: (val: string) => void;
  water: string;
  setWater: (val: string) => void;
  soil: string;
  setSoil: (val: string) => void;
}

const DISTRICTS = [
  "Multan", "Faisalabad", "Lahore", "Sargodha", "Bahawalpur",
  "Rahim Yar Khan", "Sahiwal", "Gujranwala", "Sheikhupura", "Kasur",
  "Jhang", "Okara", "Pakpattan", "Khanewal", "Vehari", "Muzaffargarh",
  "Hyderabad", "Sukkur", "Larkana", "Peshawar", "Mardan", "Swat", "Quetta"
];

const SEASONS = [
  { id: 'Rabi', label: '❄️ Winter — Rabi (ربیع - سردیاں)' },
  { id: 'Kharif', label: '☀️ Summer — Kharif (خریف - گرمیاں)' },
  { id: 'Zaid Rabi', label: '🌱 Spring — Zaid Rabi (بہار)' },
  { id: 'Zaid Kharif', label: '🍂 Autumn — Zaid Kharif (خزاں)' },
];

const CROP_DEFAULT_SEASONS: { [key: string]: string } = {
  wheat: 'Rabi',
  chickpea: 'Rabi',
  mustard: 'Rabi',
  barley: 'Rabi',
  lentil: 'Rabi',
  potato: 'Rabi',
  cotton: 'Kharif',
  rice: 'Kharif',
  maize: 'Kharif',
  sugarcane: 'Kharif',
};

const WATER_OPTIONS = [
  { id: 'Limited', label: 'Limited (محدود پانی)' },
  { id: 'Normal', label: 'Normal (معمول کے مطابق)' },
  { id: 'Abundant', label: 'Abundant (وافر پانی)' },
  { id: 'Rainfed', label: 'Rain-fed / Barani (بارانی)' },
];

const CROPS = [
  { id: 'wheat', label: 'Wheat (گندم)' },
  { id: 'chickpea', label: 'Chickpea (چنا)' },
  { id: 'mustard', label: 'Mustard (سرسوں)' },
  { id: 'barley', label: 'Barley (جو)' },
  { id: 'lentil', label: 'Lentil (مسور)' },
  { id: 'potato', label: 'Potato (آلو)' },
  { id: 'cotton', label: 'Cotton (کپاس)' },
  { id: 'rice', label: 'Basmati Rice (چاول)' },
  { id: 'maize', label: 'Maize (مکئی)' },
  { id: 'sugarcane', label: 'Sugarcane (کماد)' },
];

const SOILS = [
  'Loam (Mera - زرخیز میرا)',
  'Clay Loam (Paki Mera - پکی میرا)',
  'Sandy Loam (Retli Mera - ریتلی میرا)',
  'Clay (Chikni - چکنی مٹی)',
  'Saline / Marginal (شور زدہ)',
];

const LAND_UNITS = [
  { id: 'acre', label: 'Acres (ایکڑ)', toAcres: 1.0 },
  { id: 'kanal', label: 'Kanal (کنال)', toAcres: 0.125 },
  { id: 'marla', label: 'Marla (مرلہ)', toAcres: 1 / 160 },
  { id: 'khet', label: 'Khet / Killa (کھیت)', toAcres: 1.0 },
  { id: 'murabba', label: 'Murabba (مربع)', toAcres: 25.0 },
  { id: 'bigha', label: 'Bigha (بیگھہ)', toAcres: 0.5 },
];

export default function FarmerProfileBar({
  district, setDistrict,
  acres, setAcres,
  season, setSeason,
  crop, setCrop,
  water, setWater,
  soil, setSoil
}: FarmerProfileBarProps) {
  const [unit, setUnit] = React.useState<string>('acre');
  const [localVal, setLocalVal] = React.useState<number | string>(acres);

  // Normalize incoming season so 'Winter' / 'Summer' / 'Rabi' / 'Kharif' match seamlessly
  const normalizedSeason = React.useMemo(() => {
    const s = (season || '').trim().toLowerCase();
    if (s.includes('winter') || s.includes('rabi') || s.includes('سردی') || s.includes('ربیع')) return 'Rabi';
    if (s.includes('summer') || s.includes('kharif') || s.includes('گرمی') || s.includes('خریف')) return 'Kharif';
    if (s.includes('spring') || s.includes('بہار')) return 'Zaid Rabi';
    if (s.includes('autumn') || s.includes('خزاں')) return 'Zaid Kharif';
    return season || 'Rabi';
  }, [season]);

  const handleValChange = (val: string, currentUnit: string) => {
    setLocalVal(val);
    const parsed = typeof val === 'string' ? parseFloat(val) : val;
    const factor = LAND_UNITS.find((u) => u.id === currentUnit)?.toAcres || 1.0;
    if (!isNaN(parsed) && parsed > 0) {
      setAcres(Math.round(parsed * factor * 1000) / 1000);
    } else {
      setAcres(val);
    }
  };

  const handleCropChange = (newCrop: string) => {
    setCrop(newCrop);
    const suggested = CROP_DEFAULT_SEASONS[newCrop.toLowerCase()];
    if (suggested) {
      setSeason(suggested);
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 py-3 px-4 shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-sm">
        {/* District Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-medium whitespace-nowrap">📍 District (ضلع):</span>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-2.5 py-1 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Season Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-medium whitespace-nowrap">🗓️ Season (سیزن):</span>
          <select
            value={normalizedSeason}
            onChange={(e) => setSeason(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-2.5 py-1 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {SEASONS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Land Size & Unit Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-medium whitespace-nowrap">🌱 Land (رقبہ):</span>
          <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-2 py-0.5 space-x-1">
            <input
              type="number"
              min="0.01"
              max="1000000"
              step="any"
              placeholder="e.g. 5"
              value={localVal}
              onChange={(e) => handleValChange(e.target.value, unit)}
              className="w-16 bg-transparent text-center font-bold text-slate-900 focus:outline-none text-sm"
            />
            <select
              value={unit}
              onChange={(e) => {
                const newUnit = e.target.value;
                setUnit(newUnit);
                handleValChange(String(localVal), newUnit);
              }}
              className="bg-transparent text-xs font-semibold text-emerald-800 border-l border-slate-300 pl-1.5 focus:outline-none cursor-pointer"
            >
              {LAND_UNITS.map((u) => (
                <option key={u.id} value={u.id}>{u.label}</option>
              ))}
            </select>
          </div>
          {unit !== 'acre' && (
            <span className="text-[11px] text-slate-500 hidden 2xl:inline font-medium">
              (≈ {acres} Acres)
            </span>
          )}
          {unit === 'acre' && (
            <span className="text-[11px] text-slate-500 hidden 2xl:inline">
              (≈ {Math.round((Number(acres) || 0) * 8)} Kanals / کنال)
            </span>
          )}
        </div>

        {/* Water Availability Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-medium whitespace-nowrap">💧 Water (پانی):</span>
          <select
            value={water}
            onChange={(e) => setWater(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-2.5 py-1 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {WATER_OPTIONS.map((w) => (
              <option key={w.id} value={w.id}>{w.label}</option>
            ))}
          </select>
        </div>

        {/* Crop Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-medium whitespace-nowrap">🌾 Crop (فصل):</span>
          <select
            value={crop}
            onChange={(e) => handleCropChange(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-2.5 py-1 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {CROPS.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Soil Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-500 font-medium whitespace-nowrap">🏜️ Soil (مٹی):</span>
          <select
            value={soil}
            onChange={(e) => setSoil(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-2.5 py-1 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {SOILS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
