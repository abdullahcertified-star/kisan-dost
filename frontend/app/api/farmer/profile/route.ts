import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';
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

  let dbFarmer: any = null;
  try {
    const res = await pool.query(
      'SELECT id, phone, email, name, district, acres, crop FROM farmers WHERE id = $1 LIMIT 1',
      [user.id]
    );
    if (res.rows.length > 0) {
      dbFarmer = res.rows[0];
    }
  } catch (err) {
    console.warn('Failed to read farmer from DB:', err);
  }

  const cached = PROFILES[String(user.id)] || {};
  const userProfile = {
    id: user.id,
    name: dbFarmer?.name || cached.name || user.name || 'Farmer',
    email: dbFarmer?.email || cached.email || user.email || '',
    phone: dbFarmer?.phone || cached.phone || user.phone || '',
    role: user.role || 'Farmer',
    district: dbFarmer?.district || cached.district || 'Multan',
    province: cached.province || 'Punjab',
    land_acres: Number(dbFarmer?.acres || cached.land_acres || 5),
    soil_type: cached.soil_type || 'Loam (Mera - زرخیز میرا)',
    water_availability: cached.water_availability || 'Canal + Tubewell',
    current_crop: dbFarmer?.crop || cached.current_crop || 'Wheat (گندم)',
    preferred_language: cached.preferred_language || 'urdu',
    created_at: cached.created_at || new Date().toISOString(),
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

    // Persist changes to Neon PostgreSQL database (email is strictly immutable for account security)
    try {
      await pool.query(
        `UPDATE farmers
         SET name = COALESCE($1, name),
             district = COALESCE($2, district),
             acres = COALESCE($3, acres),
             crop = COALESCE($4, crop)
         WHERE id = $5`,
        [
          data.name?.trim() || null,
          data.district?.trim() || null,
          data.land_acres ? Number(data.land_acres) : null,
          data.current_crop || null,
          user.id,
        ]
      );
    } catch (dbErr) {
      console.warn('Could not persist profile changes to Neon DB:', dbErr);
    }

    const profile = {
      ...data,
      id: user.id,
      updated_at: new Date().toISOString(),
    };
    PROFILES[String(user.id)] = profile;
    return NextResponse.json(profile);
  } catch {
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}
