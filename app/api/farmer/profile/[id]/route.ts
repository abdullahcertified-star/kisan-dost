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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required. Please log in.' }, { status: 401 });
  }

  const { id } = await params;
  // Prevent IDOR: Users may only query their own record unless they have an Admin role
  if (String(user.id) !== String(id) && user.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to view this profile.' }, { status: 403 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name || 'Farmer',
    phone: user.phone || '',
    district: 'Multan',
    province: 'Punjab',
    land_acres: 5,
    soil_type: 'Loamy',
    water_availability: 'Limited',
    current_crop: 'Wheat',
    preferred_language: 'ur',
    created_at: '2026-09-06T00:00:00Z',
    updated_at: new Date().toISOString(),
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required. Please log in.' }, { status: 401 });
  }

  const { id } = await params;
  // Prevent IDOR: Users may only modify their own profile
  if (String(user.id) !== String(id) && user.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden: You cannot modify another farmer\'s profile.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    return NextResponse.json({
      id: user.id,
      ...body,
      updated_at: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Invalid update payload.' }, { status: 400 });
  }
}
