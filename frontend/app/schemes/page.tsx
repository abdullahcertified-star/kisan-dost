'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import {
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  PhoneCall,
  ExternalLink,
  Filter,
  Sprout,
  AlertCircle
} from 'lucide-react';

interface Scheme {
  id: string;
  name: string;
  name_ur: string;
  province: string;
  districts: string[];
  eligible_farmer_types: string[];
  applicable_crops: string[];
  benefits: string;
  benefits_ur: string;
  requirements: string[];
  requirements_ur: string[];
  how_to_apply: string;
  source: string;
  source_url: string;
  last_verified_date: string;
  is_reference: boolean;
  helpline: string;
}

interface SchemesApiResponse {
  total_count: number;
  filters: {
    province?: string;
    district?: string;
    crop?: string;
  };
  fallback_used: boolean;
  message: string;
  schemes: Scheme[];
  source_disclaimer: string;
}

export default function GovtSchemesPage() {
  const [province, setProvince] = useState<string>('Punjab');
  const [district, setDistrict] = useState<string>('Multan');
  const [crop, setCrop] = useState<string>('All');

  const [schemesData, setSchemesData] = useState<SchemesApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchemes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const params = new URLSearchParams();
      if (province && province !== 'All') params.append('province', province);
      if (district && district !== 'All') params.append('district', district);
      if (crop && crop !== 'All') params.append('crop', crop.toLowerCase());

      const res = await fetch(`${apiUrl}/api/schemes?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SchemesApiResponse = await res.json();
      setSchemesData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch government schemes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, [province, district, crop]);

  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
        {/* Header Ribbon */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center text-2xl shadow-2xs flex-shrink-0">
              <Landmark className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full border border-purple-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                  Official Government Support &amp; Subsidies
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Verified Provincial &amp; Federal Portals
                </span>
              </div>
              <div className="flex flex-wrap items-baseline gap-2.5 mt-1.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  Government Support Schemes
                </h1>
                <span className="font-urdu text-purple-800 font-bold text-lg sm:text-xl">
                  (حکومتی زرعی اسکیمیں و مالی امداد)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Grounded eligibility criteria for CM Punjab Kisan Card, Green Tractor Subsidy, Solar Tubewell Scheme, Sindh Hari Card, and SBP Kamyab Kisan Loans.
              </p>
            </div>
          </div>

          {/* Quick Helpline Pill */}
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs flex items-center gap-3 shrink-0">
            <PhoneCall className="w-4 h-4 text-purple-700" />
            <div>
              <div className="text-[10px] uppercase font-bold text-purple-900">Toll-Free Helpline</div>
              <div className="font-black text-purple-950">0800-17000 (Agri Ext.)</div>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-emerald-700" />
            <span>Filter Schemes by Your Farm Profile:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Province Filter */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block px-1">Province</label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
              >
                <option value="All">All Provinces (تمام صوبے)</option>
                <option value="Punjab">Punjab (پنجاب)</option>
                <option value="Sindh">Sindh (سندھ)</option>
                <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa (خیبر پختونخوا)</option>
                <option value="Balochistan">Balochistan (بلوچستان)</option>
              </select>
            </div>

            {/* District Filter */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block px-1">District</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
              >
                <option value="All">All Districts (تمام اضلاع)</option>
                <option value="Multan">Multan (ملتان)</option>
                <option value="Faisalabad">Faisalabad (فیصل آباد)</option>
                <option value="Lahore">Lahore (لاہور)</option>
                <option value="Sargodha">Sargodha (سرگودھا)</option>
                <option value="Rahim Yar Khan">Rahim Yar Khan (رحیم یار خان)</option>
                <option value="Hyderabad">Hyderabad (حیدرآباد)</option>
                <option value="Larkana">Larkana (لاڑکانہ)</option>
                <option value="Peshawar">Peshawar (پشاور)</option>
                <option value="Quetta">Quetta (کوئٹہ)</option>
              </select>
            </div>

            {/* Crop Filter */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block px-1">Applicable Crop</label>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
              >
                <option value="All">All Crops (تمام فصلیں)</option>
                <option value="Wheat">Wheat (گندم)</option>
                <option value="Cotton">Cotton (کپاس)</option>
                <option value="Rice">Rice (چاول)</option>
                <option value="Maize">Maize (مکئی)</option>
                <option value="Oilseeds">Oilseeds / Mustard (سرسوں و کینولا)</option>
                <option value="Sugarcane">Sugarcane (کماد)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Fallback Notice Banner (If specific localized data is missing) */}
        {schemesData?.fallback_used && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-900 font-bold block mb-0.5">Reference Notice:</strong>
              {schemesData.message}
            </div>
          </div>
        )}

        {/* Status Message */}
        {schemesData && (
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>{schemesData.message}</span>
            <span className="font-semibold text-emerald-800">{schemesData.total_count} Verified Programs</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse space-y-4">
                <div className="h-5 bg-slate-200 rounded w-2/3"></div>
                <div className="h-4 bg-slate-100 rounded w-full"></div>
                <div className="h-16 bg-slate-50 rounded w-full"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button
              onClick={fetchSchemes}
              className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Schemes Grid */}
        {!isLoading && schemesData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {schemesData.schemes.map((scheme) => (
              <div
                key={scheme.id}
                className="bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Title & Province Tag */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 leading-snug">
                        {scheme.name}
                      </h3>
                      <div className="font-urdu text-sm font-bold text-emerald-800 mt-0.5">
                        {scheme.name_ur}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
                      {scheme.province}
                    </span>
                  </div>

                  {/* Highlighted Subsidy & Benefit Card */}
                  <div className="p-4 bg-emerald-50/80 border border-emerald-200/90 rounded-xl">
                    <div className="text-[10px] uppercase font-bold text-emerald-800 tracking-wide">
                      Direct Subsidy &amp; Benefit
                    </div>
                    <div className="text-xs font-bold text-emerald-950 mt-1 leading-relaxed">
                      {scheme.benefits}
                    </div>
                    <div className="font-urdu text-xs text-emerald-900 mt-1 font-semibold">
                      {scheme.benefits_ur}
                    </div>
                  </div>

                  {/* Applicable Crops */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Applicable Crops:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {scheme.applicable_crops.map((c, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Eligibility & Requirements */}
                  <div className="space-y-2 text-xs">
                    <div className="font-bold text-slate-800">Eligibility &amp; Mandatory Documents:</div>
                    <ul className="space-y-1.5">
                      {scheme.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-600 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* How to Apply */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                    <strong className="text-slate-900 font-bold block mb-0.5">How to Apply:</strong>
                    <span>{scheme.how_to_apply}</span>
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Verified: {scheme.last_verified_date}</span>
                    <span className="text-emerald-700 font-semibold">• Reference Record</span>
                  </div>

                  <a
                    href={scheme.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-950 transition"
                  >
                    <span>{scheme.source}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
