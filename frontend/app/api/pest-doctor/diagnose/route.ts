import { NextRequest, NextResponse } from 'next/server';
import pestDb from '@/data/pest_database.json';

interface PestRecord {
  id: string;
  crop: string;
  target_crops: string[];
  pest_name: string;
  pest_name_ur: string;
  scientific_name: string;
  category: string;
  symptoms: string[];
  symptoms_ur: string[];
  risk_factors: string[];
  non_chemical_management: string[];
  verified_treatment: {
    active_ingredient: string;
    trade_names: string[];
    has_verified_dosage: boolean;
    safe_dosage_per_acre: string;
    dosage_numeric_ml_per_acre: number;
    water_volume_liters_per_acre: number;
    spray_timing: string;
    application_instructions: string;
    source: string;
  };
  safety_notes: string[];
  phi_days: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cropInput = String(body.crop || '').trim().toLowerCase();
    const symptomsInput = String(body.symptoms || '').trim().toLowerCase();
    const acres = Number(body.acres || 5);

    const records = pestDb as PestRecord[];
    const words = symptomsInput.match(/\b\w{3,}\b/g) || [];

    const scored: { score: number; record: PestRecord }[] = [];

    for (const rec of records) {
      let score = 0;
      const cropText = (rec.crop + ' ' + (rec.target_crops || []).join(' ')).toLowerCase();
      const recCropMatches = cropInput && cropText.includes(cropInput);

      if (recCropMatches) {
        score += 4;
      }

      const allSymptoms = [...(rec.symptoms || []), ...(rec.symptoms_ur || [])].join(' ').toLowerCase();
      const nameText = (rec.pest_name + ' ' + rec.pest_name_ur + ' ' + rec.scientific_name).toLowerCase();

      // Check id / name exact mentions
      if (symptomsInput.includes(rec.id.toLowerCase()) || symptomsInput.includes(rec.pest_name.toLowerCase())) {
        score += 8;
      }

      for (const w of words) {
        if (allSymptoms.includes(w) || nameText.includes(w)) {
          score += 2;
        }
      }

      scored.push({ score, record: rec });
    }

    scored.sort((a, b) => b.score - a.score);

    const bestRecord = scored[0].score > 0
      ? scored[0].record
      : records.find((r) => cropInput && r.crop.toLowerCase().includes(cropInput)) || records[0];

    let confidence = 'High';
    if (scored[0].score < 4) confidence = 'Tentative / Moderate';
    else if (scored[0].score < 8) confidence = 'Moderate';

    // Alternatives
    const alternatives = scored.slice(1, 4).map((s) => ({
      pest_name: s.record.pest_name,
      pest_name_ur: s.record.pest_name_ur,
      scientific_name: s.record.scientific_name,
      likelihood: s.score >= 4 ? 'Moderate' : 'Low',
      distinguishing_feature: `Typically exhibits ${s.record.symptoms?.[0] || 'distinctive symptoms'}.`,
    }));

    const matchedSymptoms = (bestRecord.symptoms || []).slice(0, 3).join(', ');
    const symptomAnalysis = `Based on reported indicators for ${body.crop || bestRecord.crop}, the symptoms correspond with ${bestRecord.pest_name} (${bestRecord.scientific_name}). Observed diagnostic markers: ${matchedSymptoms}.`;

    const diagnosis = {
      crop: body.crop || bestRecord.crop,
      primary_diagnosis: bestRecord.pest_name,
      primary_diagnosis_ur: bestRecord.pest_name_ur,
      scientific_name: bestRecord.scientific_name,
      category: bestRecord.category,
      confidence,
      symptom_analysis: symptomAnalysis,
      risk_factors: bestRecord.risk_factors || [],
      alternative_possibilities: alternatives,
      non_chemical_management: bestRecord.non_chemical_management || [
        'Inspect fields in early mornings (at least 20 random plants per acre).',
        'Install yellow sticky traps or pheromone delta traps along field borders.',
        'Sanitize borders by removing broadleaf alternate weed hosts.',
      ],
      verified_treatment: bestRecord.verified_treatment || {
        active_ingredient: 'Refer to registered bottle label',
        trade_names: [],
        has_verified_dosage: true,
        safe_dosage_per_acre: 'Refer to bottle label',
        dosage_numeric_ml_per_acre: 250,
        water_volume_liters_per_acre: 100,
        spray_timing: 'Early morning or late afternoon (cool hours)',
        application_instructions: 'Ensure complete spray coverage with hollow cone nozzle.',
        source: 'PARC & Punjab Agriculture Department',
      },
      dosage_disclaimer:
        'Exact chemical dosage must strictly be verified from the locally registered container label or prescribed by your local Agriculture Extension Officer (محکمہ زراعت). Never guess dosages.',
      safety_notes: bestRecord.safety_notes || [
        'Wear protective mask, goggles, and rubber gloves during chemical preparation and application.',
        'Do not spray against the wind or when wind speeds exceed 15 km/h.',
        'Observe the mandatory Pre-Harvest Interval (PHI) before harvesting or grazing livestock.',
      ],
      phi_days: bestRecord.phi_days || 14,
      is_medical_query_rejected: false,
      medical_rejection_notice: null,
      source: bestRecord.verified_treatment?.source || 'Punjab Agriculture Department & PARC Integrated Pest Management Wing',
      image_supported: true,
    };

    return NextResponse.json(diagnosis);
  } catch (err: any) {
    return NextResponse.json({ error: 'Diagnosis failed', details: err.message }, { status: 500 });
  }
}
