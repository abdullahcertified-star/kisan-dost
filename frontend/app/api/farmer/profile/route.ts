import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/env';

export const dynamic = 'force-dynamic';

function getAuthenticatedUser(req: NextRequest): any | null {
  try {
    const token =
      req.cookies.get('kisan_auth_token')?.value ||
      req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) return null;
    const JWT_SECRET = getJwtSecret();
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// User-scoped profiles cache in memory
const PROFILES: Record<string, any> = {};

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required. Please log in.' }, { status: 401 });
  }

  const userProfile = PROFILES[String(user.id)] || {
    id: user.id,
    name: user.name || 'Farmer',
    phone: user.phone || '',
    role: user.role || 'Farmer',
    district: 'Multan',
    province: 'Punjab',
    land_acres: 5,
    soil_type: 'Loamy',
    water_availability: 'Limited',
    current_crop: 'Wheat',
    preferred_language: 'ur',
    created_at: new Date().toISOString(),
  };

  return NextResponse.json(userProfile);
}

export async function POST(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required. Please log in.' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const profile = {
      ...data,
      id: user.id, // Strictly bind to authenticated user id
      updated_at: new Date().toISOString(),
    };
    PROFILES[String(user.id)] = profile;
    return NextResponse.json(profile);
  } catch {
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}
