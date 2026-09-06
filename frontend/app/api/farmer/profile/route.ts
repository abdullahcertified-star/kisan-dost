import { NextRequest, NextResponse } from 'next/server';

let PROFILES: Record<string, any> = {
  default_farmer: {
    id: 'default_farmer',
    name: 'Muhammad Aslam',
    district: 'Multan',
    province: 'Punjab',
    land_acres: 5,
    soil_type: 'Loamy',
    water_availability: 'Limited',
    current_crop: 'Wheat',
    preferred_language: 'ur',
    created_at: '2026-09-06T00:00:00Z',
    updated_at: '2026-09-06T00:00:00Z',
  }
};

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const id = data.id || 'farmer_' + Date.now();
    const profile = {
      ...data,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    PROFILES[id] = profile;
    return NextResponse.json(profile);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json(Object.values(PROFILES)[0] || PROFILES['default_farmer']);
}
