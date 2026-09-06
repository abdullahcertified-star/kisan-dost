import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([
    {
      id: 'cotton_whitefly',
      crop: 'Cotton',
      pest_name: 'Whitefly (سفید مکھی)',
      scientific_name: 'Bemisia tabaci',
      category: 'Sucking Pest (رس چوسنے والا کیڑا)',
      symptoms: ['Upward leaf curling', 'Sticky honeydew', 'Black sooty mold'],
      safe_dosage: 'Pyriproxyfen 10.8 EC (400-500 ml/acre) or Diafenthiuron 500 SC (250 ml/acre)',
      phi_days: 14
    },
    {
      id: 'cotton_pink_bollworm',
      crop: 'Cotton',
      pest_name: 'Pink Bollworm (گلابی سنڈی)',
      scientific_name: 'Pectinophora gossypiella',
      category: 'Chewing Pest (سنڈی)',
      symptoms: ['Rosetted flowers', 'Premature boll drop', 'Entry holes sealed with frass'],
      safe_dosage: 'Chlorantraniliprole 20 SC (50-60 ml/acre)',
      phi_days: 21
    },
    {
      id: 'wheat_rust',
      crop: 'Wheat',
      pest_name: 'Yellow Rust (پیلے رنگ کی کنگی)',
      scientific_name: 'Puccinia striiformis',
      category: 'Fungal Disease (پھپھوندی بیماری)',
      symptoms: ['Linear yellow stripes on leaves', 'Powdery spores'],
      safe_dosage: 'Tebuconazole 25 WP (200-250 ml/acre)',
      phi_days: 30
    }
  ]);
}
