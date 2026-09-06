import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({
    id,
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
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  return NextResponse.json({
    id,
    ...body,
    updated_at: new Date().toISOString(),
  });
}
