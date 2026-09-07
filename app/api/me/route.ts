import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

import { decryptApiKey, maskApiKey, hashApiKey } from '@/lib/crypto';
import { getJwtSecret } from '@/lib/env';

export const dynamic = 'force-dynamic';

const JWT_SECRET = getJwtSecret();

export async function GET(req: NextRequest) {
  try {
    // 1. Read token from HttpOnly cookie or Authorization header
    const token =
      req.cookies.get('kisan_auth_token')?.value ||
      req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { authenticated: false, error: 'No authenticated session found' },
        { status: 401 }
      );
    }

    // 2. Cryptographically verify JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json(
        { authenticated: false, error: 'Session expired or invalid token' },
        { status: 401 }
      );
    }

    // 3. Query *only* that specific user's row from Neon database
    const userResult = await pool.query(
      `SELECT id, phone, email, name, district, acres, crop, gemini_api_key, registered_at
       FROM farmers
       WHERE id = $1
       LIMIT 1`,
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { authenticated: false, error: 'User record not found in database' },
        { status: 404 }
      );
    }

    const rawUser = userResult.rows[0];
    const plainApiKey = rawUser.gemini_api_key ? decryptApiKey(rawUser.gemini_api_key) : '';
    const safeUser = {
      ...rawUser,
      gemini_api_key: maskApiKey(rawUser.gemini_api_key),
      gemini_api_key_plain: plainApiKey,
      has_gemini_key: Boolean(plainApiKey),
      gemini_key_hash: plainApiKey ? hashApiKey(plainApiKey) : null,
    };

    return NextResponse.json({
      authenticated: true,
      user: safeUser,
    });
  } catch (error: any) {
    console.error('Profile verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify session: ' + (error?.message || 'Server error') },
      { status: 500 }
    );
  }
}
