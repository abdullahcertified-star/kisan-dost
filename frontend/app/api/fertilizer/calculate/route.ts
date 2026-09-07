import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

interface CropInfo {
  name_en: string;
  name_ur: string;
  base_n: number;
  base_p: number;
  base_k: number;
  benchmark_yield: number;
  agronomic_en: string;
  agronomic_ur: string;
}

const CROP_DATABASE: Record<string, CropInfo> = {
  wheat: {
    name_en: 'Wheat',
    name_ur: 'گندم',
    base_n: 55,
    base_p: 35,
    base_k: 15,
    benchmark_yield: 40,
    agronomic_en: 'Apply full phosphorus (DAP) at sowing. Split nitrogen (Urea) between 1st irrigation (crown root) and 2nd irrigation (tillering/booting).',
    agronomic_ur: 'بوائی کے وقت تمام ڈی اے پی ڈالیں۔ یوریا کو پہلے پانی (21 دن) اور دوسرے پانی (گوبھ) کے درمیان تقسیم کریں۔'
  },
  rice: {
    name_en: 'Rice / Paddy',
    name_ur: 'دھان / چاول',
    base_n: 60,
    base_p: 30,
    base_k: 20,
    benchmark_yield: 40,
    agronomic_en: 'Apply DAP at transplanting / puddling. Apply Urea in splits 20-25 days and 45 days after transplanting. Maintain water level.',
    agronomic_ur: 'پنیری لگاتے وقت ڈی اے پی دیں۔ یوریا 20-25 دن اور 45 دن بعد اقساط میں دیں۔ پانی کی سطح برقرار رکھیں۔'
  },
  cotton: {
    name_en: 'Cotton',
    name_ur: 'کپاس',
    base_n: 65,
    base_p: 30,
    base_k: 25,
    benchmark_yield: 25,
    agronomic_en: 'Apply DAP and SOP at sowing. Top dress Urea in 3 equal splits starting 35-40 days after sowing till peak flowering.',
    agronomic_ur: 'بوائی پر ڈی اے پی اور پوٹاش دیں۔ یوریا 35 دن بعد سے پھول آنے تک 3 اقساط میں دیں۔'
  },
  maize: {
    name_en: 'Maize / Corn',
    name_ur: 'مکئی',
    base_n: 70,
    base_p: 40,
    base_k: 25,
    benchmark_yield: 60,
    agronomic_en: 'Heavy feeder crop. Apply DAP at sowing, split Urea at knee-high stage and tasseling for maximum cob weight.',
    agronomic_ur: 'زیادہ کھاد مانگنے والی فصل ہے۔ بوائی پر ڈی اے پی، گھٹنے کے برابر قد اور چھلی بنتے وقت یوریا دیں۔'
  },
  sugarcane: {
    name_en: 'Sugarcane',
    name_ur: 'کماد / گنا',
    base_n: 80,
    base_p: 45,
    base_k: 40,
    benchmark_yield: 700,
    agronomic_en: 'Long duration crop. Apply DAP and SOP during planting in furrows. Split Urea across early summer irrigations before earthing up.',
    agronomic_ur: 'کھیلوں میں بوائی کے وقت ڈی اے پی اور پوٹاش دیں۔ مٹی چڑھانے سے پہلے گرمیوں کے پانیوں پر یوریا مکمل کریں۔'
  },
  mustard: {
    name_en: 'Mustard / Canola',
    name_ur: 'سرسوں / کینولا / رایا',
    base_n: 40,
    base_p: 30,
    base_k: 10,
    benchmark_yield: 22,
    agronomic_en: 'Apply DAP at final land prep. Urea at 1st irrigation (flowering initiation). Avoid excess nitrogen to prevent lodging.',
    agronomic_ur: 'آخری ہل پر ڈی اے پی دیں۔ پہلے پانی پر یوریا دیں۔ زیادہ نائٹروجن سے فصل گرنے کا خدشہ ہوتا ہے۔'
  },
  chickpea: {
    name_en: 'Chickpea / Gram',
    name_ur: 'چنا',
    base_n: 15,
    base_p: 25,
    base_k: 10,
    benchmark_yield: 18,
    agronomic_en: 'Legume crop fixes its own nitrogen. Apply starter DAP at sowing. Avoid top-dressing urea which causes excessive vegetative growth.',
    agronomic_ur: 'دال کی فصل خود نائٹروجن بناتی ہے۔ بوائی پر معمولی ڈی اے پی دیں۔ اضافی یوریا ڈالنے سے پرہیز کریں۔'
  },
  potato: {
    name_en: 'Potato',
    name_ur: 'آلو',
    base_n: 100,
    base_p: 60,
    base_k: 75,
    benchmark_yield: 250,
    agronomic_en: 'High potash and phosphorus requirement. Apply full DAP and SOP at planting ridges. Split Urea before tuber initiation.',
    agronomic_ur: 'پوٹاش اور فاسفورس کی زیادہ ضرورت ہوتی ہے۔ بوائی پر ڈی اے پی اور پوٹاش دیں، آلو بننے سے پہلے یوریا دیں۔'
  }
};

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req.headers);
  const rateLimit = checkRateLimit(`fert_${clientIp}`, 20, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many calculation requests. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
    );
  }

  try {
    const body = await req.json();
    const cropInput = String(body.crop || 'Wheat').trim();
    const acres = Math.max(0.1, Number(body.acres || 5));
    const soilInput = String(body.soil_type || 'Loam').toLowerCase();
    const targetYield = body.target_yield ? Number(body.target_yield) : null;

    // Match crop
    let cropKey = 'wheat';
    for (const key of Object.keys(CROP_DATABASE)) {
      if (cropInput.toLowerCase().includes(key)) {
        cropKey = key;
        break;
      }
    }
    const cropData = CROP_DATABASE[cropKey];

    // Soil modifiers
    let nFactor = 1.0;
    let pFactor = 1.0;
    let kFactor = 1.0;
    let soilNotesEn = 'Standard balanced loam soil.';
    let soilNotesUr = 'معیاری زرخیز میرا مٹی۔';

    if (soilInput.includes('sand') || soilInput.includes('retli')) {
      nFactor = 1.1; // Leaching adjustment
      pFactor = 1.0;
      kFactor = 1.1;
      soilNotesEn = 'Sandy soil prone to leaching: split nitrogen applications into smaller, more frequent doses.';
      soilNotesUr = 'ریتلی مٹی میں کھاد ضائع ہونے کا اندیشہ ہوتا ہے، لہٰذا یوریا چھوٹی اقساط میں بار بار دیں۔';
    } else if (soilInput.includes('clay') || soilInput.includes('paki')) {
      nFactor = 0.95;
      pFactor = 1.0;
      kFactor = 1.0;
      soilNotesEn = 'Heavy clay soil has high nutrient retention.';
      soilNotesUr = 'چکنی پکی میرا مٹی میں غذائی اجزاء محفوظ رہتے ہیں۔';
    }

    // Yield factor
    let yieldFactor = 1.0;
    if (targetYield && targetYield > 0) {
      yieldFactor = Math.max(0.6, Math.min(1.5, targetYield / cropData.benchmark_yield));
    }

    // Requirements in kg
    const nReq = Math.round(cropData.base_n * acres * nFactor * yieldFactor * 10) / 10;
    const pReq = Math.round(cropData.base_p * acres * pFactor * yieldFactor * 10) / 10;
    const kReq = Math.round(cropData.base_k * acres * kFactor * yieldFactor * 10) / 10;

    // Stoichiometry:
    // DAP: 50kg bag provides 9kg N, 23kg P2O5
    // Urea: 50kg bag provides 23kg N
    // SOP: 50kg bag provides 25kg K2O
    const dapBags = Math.round((pReq / 23.0) * 10) / 10;
    const nFromDap = Math.round(dapBags * 9.0 * 10) / 10;
    const remainingN = Math.max(0, nReq - nFromDap);
    const ureaBags = Math.round((remainingN / 23.0) * 10) / 10;
    const sopBags = kReq > 0 ? Math.round((kReq / 25.0) * 10) / 10 : 0.0;

    // Estimated retail prices PKR
    const dapUnitPrice = 12800;
    const ureaUnitPrice = 4600;
    const sopUnitPrice = 14500;

    const dapCost = Math.round(dapBags * dapUnitPrice);
    const ureaCost = Math.round(ureaBags * ureaUnitPrice);
    const sopCost = Math.round(sopBags * sopUnitPrice);
    const totalCost = dapCost + ureaCost + sopCost;

    // Application schedule
    const scheduleEn: string[] = [];
    const scheduleUr: string[] = [];
    const scheduleBilingual: string[] = [];

    const step1En = `At Sowing / Basal: Apply full DAP (${dapBags} bags)${sopBags > 0 ? ` and full SOP (${sopBags} bags)` : ''} during final seedbed preparation and incorporate thoroughly into the soil.`;
    const step1Ur = `بجائی کے وقت: تمام ڈی اے پی (${dapBags} بوری)${sopBags > 0 ? ` اور تمام پوٹاش ایس او پی (${sopBags} بوری)` : ''} آخری ہل چلا کر مٹی میں اچھی طرح ملائیں۔`;
    scheduleEn.push(step1En);
    scheduleUr.push(step1Ur);
    scheduleBilingual.push(`At Sowing / Basal (بجائی کے وقت): ${step1En}`);

    if (ureaBags > 0) {
      const split1 = Math.round(ureaBags * 0.5 * 10) / 10;
      const split2 = Math.round((ureaBags - split1) * 10) / 10;

      const step2En = `First Irrigation (21-25 DAS): Broadcast ~${split1} bags of Urea with the 1st irrigation water.`;
      const step2Ur = `پہلا پانی (21 تا 25 دن): تقریباً ${split1} بوری یوریا پہلے پانی پر تر وتر یا پانی کے آگے چھٹہ کریں۔`;
      scheduleEn.push(step2En);
      scheduleUr.push(step2Ur);
      scheduleBilingual.push(`First Irrigation (پہلا پانی): ${step2En}`);

      if (split2 > 0) {
        const step3En = `Second Irrigation / Tillering: Broadcast remaining ~${split2} bags of Urea before booting/flowering stage.`;
        const step3Ur = `دوسرا پانی / شگوفے: بقیہ ${split2} بوری یوریا دوسرے پانی پر مکمل کریں (پھول آنے سے قبل نائٹروجن مکمل کریں)۔`;
        scheduleEn.push(step3En);
        scheduleUr.push(step3Ur);
        scheduleBilingual.push(`Second Irrigation / Tillering (دوسرا پانی): ${step3En}`);
      }
    }

    const products = [
      {
        product_id: 'dap',
        product_name_en: 'DAP (Di-Ammonium Phosphate)',
        product_name_ur: 'ڈی اے پی',
        bag_size_kg: 50,
        bags_count: dapBags,
        unit_price_pkr: dapUnitPrice,
        total_cost_pkr: dapCost,
        is_price_estimate: true,
        nutrients_contributed_kg: { N: nFromDap, P: pReq, K: 0 },
        application_timing: 'At sowing'
      },
      {
        product_id: 'urea',
        product_name_en: 'Urea (46% N)',
        product_name_ur: 'یوریا',
        bag_size_kg: 50,
        bags_count: ureaBags,
        unit_price_pkr: ureaUnitPrice,
        total_cost_pkr: ureaCost,
        is_price_estimate: true,
        nutrients_contributed_kg: { N: Math.round(ureaBags * 23.0 * 10) / 10, P: 0, K: 0 },
        application_timing: 'Split across irrigations'
      }
    ];

    if (sopBags > 0) {
      products.push({
        product_id: 'sop',
        product_name_en: 'SOP (Sulphate of Potash)',
        product_name_ur: 'ایس او پی (پوٹاش)',
        bag_size_kg: 50,
        bags_count: sopBags,
        unit_price_pkr: sopUnitPrice,
        total_cost_pkr: sopCost,
        is_price_estimate: true,
        nutrients_contributed_kg: { N: 0, P: 0, K: kReq },
        application_timing: 'At sowing or 1st irrigation'
      });
    }

    const plan = {
      crop: cropData.name_en,
      crop_ur: cropData.name_ur,
      acres,
      soil_type: body.soil_type || 'Loam (Mera)',
      target_yield: targetYield,
      benchmark_yield: cropData.benchmark_yield,
      nitrogen_requirement_kg: nReq,
      phosphorus_requirement_kg: pReq,
      potassium_requirement_kg: kReq,
      dap_bags: dapBags,
      urea_bags: ureaBags,
      sop_bags: sopBags,
      urea_cost_pkr: ureaCost,
      dap_cost_pkr: dapCost,
      sop_cost_pkr: sopCost,
      total_cost_pkr: totalCost,
      estimated_total_cost_pkr: totalCost,
      cost_per_acre: Math.round(totalCost / acres),
      is_price_estimate: true,
      price_disclaimer: 'نرخ مارکیٹ کے تخمینہ پر مبنی ہیں اور سیزنل طلب کے مطابق تبدیل ہو سکتے ہیں۔ (Market retail estimate based on AMIS & NFDC benchmarks)',
      products,
      npk_kg_applied: { N: nReq, P: pReq, K: kReq },
      application_schedule: scheduleBilingual,
      application_schedule_en: scheduleEn,
      application_schedule_ur: scheduleUr,
      agronomic_advice_english: `${cropData.agronomic_en} ${soilNotesEn}`,
      agronomic_advice_urdu: `${cropData.agronomic_ur} ${soilNotesUr}`,
      safety_notice: 'یہ منصوبہ خالصتاً غذائی عناصر (NPK) پر مبنی ہے۔ کسی غیر مصدقہ زہر یا کیمیکل کا استعمال نہ کریں۔'
    };

    return NextResponse.json(plan);
  } catch (err: any) {
    console.error('[Fertilizer Calculator Error]:', err);
    return NextResponse.json({ error: 'Failed to calculate fertilizer plan.' }, { status: 500 });
  }
}
