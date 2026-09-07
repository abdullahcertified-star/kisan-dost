import { NextRequest, NextResponse } from 'next/server';
import cropsData from '@/data/crops_db.json';

interface CropEntry {
  id: string;
  crop_name: string;
  crop_name_urdu: string;
  season: string;
  seasons: string[];
  sowing_window: string;
  harvesting_window: string;
  suitable_provinces: string[];
  suitable_soil_types: string[];
  water_requirement: string;
  irrigation_count: string;
  irrigation_characteristics?: {
    critical_stages?: string[];
    drought_sensitivity?: string;
    irrigation_tip?: string;
  };
  approximate_growing_duration_days: number;
  common_pests: string[];
  economic_factors: {
    avg_yield_maunds_per_acre: number;
    market_price_per_maund: number;
    total_cost_per_acre: number;
    gross_revenue_per_acre: number;
    net_profit_per_acre: number;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const district = String(body.district || 'Multan').trim();
    const province = String(body.province || 'Punjab').trim();
    const season = String(body.season || 'Rabi').trim();
    const soilType = String(body.soil_type || 'Loam (Mera)').trim();
    const waterAvailability = String(body.water_availability || 'Limited').trim();
    const acres = Math.max(0.5, Number(body.land_acres || 5));

    const seasonLower = season.toLowerCase();
    const isSummer = seasonLower.includes('summer') || seasonLower.includes('kharif') || seasonLower.includes('خریف');
    const isWinter = seasonLower.includes('winter') || seasonLower.includes('rabi') || seasonLower.includes('ربیع');

    const waterLower = waterAvailability.toLowerCase();
    const isLimited = waterLower.includes('limited') || waterLower.includes('kam') || waterLower.includes('shortage') || waterLower.includes('محدود') || waterLower.includes('rainfed') || waterLower.includes('barani');
    const isAbundant = waterLower.includes('abundant') || waterLower.includes('وافر') || waterLower.includes('high');

    const rawCrops = (cropsData.crops as CropEntry[]) || [];
    const candidates: any[] = [];

    for (const crop of rawCrops) {
      const cropSeasonLower = crop.season.toLowerCase();
      const cropSeasonsLower = (crop.seasons || []).map((s) => s.toLowerCase());

      // 1. Season matching
      let seasonMatch = false;
      if (isSummer) {
        if (cropSeasonLower.includes('summer') || cropSeasonLower.includes('kharif') || cropSeasonsLower.includes('summer') || cropSeasonsLower.includes('kharif')) {
          seasonMatch = true;
        }
      } else if (isWinter) {
        if (cropSeasonLower.includes('winter') || cropSeasonLower.includes('rabi') || cropSeasonsLower.includes('winter') || cropSeasonsLower.includes('rabi')) {
          seasonMatch = true;
        }
      } else {
        seasonMatch = cropSeasonLower.includes(seasonLower) || cropSeasonsLower.includes(seasonLower);
      }

      if (!seasonMatch) continue;

      // 2. Suitability Scoring (0 - 100)
      let score = 50.0;
      const reasons: string[] = [];
      const risks: string[] = [];

      reasons.push(`Optimal seasonal window: ${crop.sowing_window}`);

      const waterReqLower = crop.water_requirement.toLowerCase();
      if (isLimited) {
        if (waterReqLower.includes('low')) {
          score += 30;
          reasons.push(`Superb drought resilience: requires only ${crop.irrigation_count}.`);
        } else if (waterReqLower.includes('medium')) {
          score += 15;
          reasons.push(`Moderate water requirement (${crop.irrigation_count}).`);
          risks.push(`Ensure scheduled irrigation during critical flowering / tillering stages.`);
        } else {
          score -= 15;
          risks.push(`High water requirement (${crop.irrigation_count}) may stress yields under limited irrigation.`);
        }
      } else if (isAbundant) {
        if (waterReqLower.includes('high') || waterReqLower.includes('very high')) {
          score += 30;
          reasons.push(`Thrives with abundant irrigation water (${crop.irrigation_count}).`);
        } else {
          score += 20;
          reasons.push(`Reliable water support ensures full yield potential.`);
        }
      } else {
        score += 20;
        reasons.push(`Standard irrigation availability aligns well with crop needs.`);
      }

      // Soil bonus
      const soilMatches = crop.suitable_soil_types.some((st) => soilType.toLowerCase().includes(st.toLowerCase().slice(0, 4)));
      if (soilMatches) {
        score += 15;
        reasons.push(`Soil texture compatible with ${crop.crop_name} root development.`);
      } else {
        score += 5;
      }

      // Pest watch
      if (crop.common_pests && crop.common_pests.length > 0) {
        risks.push(`Monitor for seasonal pests: ${crop.common_pests.slice(0, 2).join(', ')}.`);
      }

      score = Math.max(40, Math.min(98, Math.round(score)));

      let label = 'Suitable (موزوں ⭐⭐)';
      if (score >= 85) label = 'Highly Suitable (انتہائی موزوں ⭐⭐⭐)';
      else if (score < 70) label = 'Moderate (درمیانہ موزوں ⭐)';

      // Financials
      const econ = crop.economic_factors;
      const yieldPerAcre = econ.avg_yield_maunds_per_acre;
      const pricePerMaund = econ.market_price_per_maund;
      const totalYield = Math.round(yieldPerAcre * acres * 10) / 10;
      const grossRev = Math.round(yieldPerAcre * pricePerMaund * acres);
      const totalCost = Math.round(econ.total_cost_per_acre * acres);
      const netProfit = grossRev - totalCost;

      candidates.push({
        crop_name: crop.crop_name,
        crop_name_urdu: crop.crop_name_urdu,
        season: crop.season,
        suitability_score: score,
        suitability_label: label,
        acreage_allocation: acres,
        water_requirement: `${crop.water_requirement} (${crop.irrigation_count})`,
        reasons,
        risks,
        expected_yield_maunds_per_acre: yieldPerAcre,
        total_expected_yield_maunds: totalYield,
        market_price_per_maund: pricePerMaund,
        gross_revenue_pkr: grossRev,
        estimated_cost_pkr: totalCost,
        net_profit_pkr: netProfit,
        sowing_window: crop.sowing_window,
        growing_duration_days: crop.approximate_growing_duration_days,
        common_pests: crop.common_pests,
        irrigation_advice: crop.irrigation_characteristics?.irrigation_tip || `Standard irrigation: ${crop.irrigation_count}`,
      });
    }

    // Sort descending by score, then net profit
    candidates.sort((a, b) => b.suitability_score - a.suitability_score || b.net_profit_pkr - a.net_profit_pkr);

    // Fallback if no matching crop
    if (candidates.length === 0) {
      candidates.push({
        crop_name: 'Wheat',
        crop_name_urdu: 'گندم',
        season: 'Rabi',
        suitability_score: 85,
        suitability_label: 'Highly Suitable (انتہائی موزوں ⭐⭐⭐)',
        acreage_allocation: acres,
        water_requirement: 'Medium (4-5 irrigations)',
        reasons: ['Staple grain crop across Punjab with guaranteed minimum support price.'],
        risks: ['Requires critical irrigation at Crown Root Initiation.'],
        expected_yield_maunds_per_acre: 42.0,
        total_expected_yield_maunds: 42.0 * acres,
        market_price_per_maund: 3900,
        gross_revenue_pkr: Math.round(42.0 * 3900 * acres),
        estimated_cost_pkr: Math.round(67000 * acres),
        net_profit_pkr: Math.round((42.0 * 3900 - 67000) * acres),
        sowing_window: 'November 01 to November 30',
        growing_duration_days: 150,
        common_pests: ['Aphids', 'Rust'],
        irrigation_advice: 'Apply water at Crown Root Initiation and Flowering stages.',
      });
    }

    const top = candidates[0];
    const summaryEn = `For ${district}, ${province} during ${season} with ${waterAvailability.toLowerCase()} water on ${acres} acres of ${soilType}, the top recommended crop is ${top.crop_name} (${top.crop_name_urdu}) with a suitability score of ${top.suitability_score}/100. Expected net profit: PKR ${top.net_profit_pkr.toLocaleString()} with ${top.total_expected_yield_maunds} maunds yield.`;
    const summaryUr = `${district} (${province}) میں ${season} سیزن، ${acres} ایکڑ ${soilType} زمین اور ${waterAvailability} پانی کے لیے سب سے موزوں فصل **${top.crop_name_urdu} (${top.crop_name})** ہے (اسکور: ${top.suitability_score}/100)۔ متوقع خالص منافع: **PKR ${top.net_profit_pkr.toLocaleString()}** اور پیداوار **${top.total_expected_yield_maunds} من** ہے۔`;

    const cropPlan = {
      district,
      province,
      season,
      land_acres: acres,
      soil_type: soilType,
      water_availability: waterAvailability,
      recommended_crop: top.crop_name,
      recommended_crop_urdu: top.crop_name_urdu,
      recommendations: candidates,
      recommended_crops: candidates, // compatibility alias
      top_recommendation: top.crop_name,
      top_recommendations: candidates.slice(0, 3),
      total_projected_net_profit: top.net_profit_pkr,
      total_projected_revenue: top.gross_revenue_pkr,
      total_projected_cost: top.estimated_cost_pkr,
      overall_agronomy_summary: summaryEn,
      summary_urdu: summaryUr,
      generated_by: 'Kisan Dost Precision Agro-Ecological Engine (Punjab Agriculture Standards)',
    };

    return NextResponse.json(cropPlan);
  } catch (err: any) {
    console.error('Recommend API error:', err);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
