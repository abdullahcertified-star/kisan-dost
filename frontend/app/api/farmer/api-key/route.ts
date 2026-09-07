import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';
import { getJwtSecret } from '@/lib/env';
import { encryptApiKey, maskApiKey } from '@/lib/crypto';

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

export async function POST(req: NextRequest) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required. Please log in.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const apiKey = (body.apiKey || '').trim();
    const encryptedKey = apiKey.length > 5 ? encryptApiKey(apiKey) : null;

    await pool.query(
      `UPDATE farmers SET gemini_api_key = $1 WHERE id = $2`,
      [encryptedKey, user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Gemini API key successfully saved to farmer profile',
      has_gemini_key: Boolean(encryptedKey),
      gemini_api_key: encryptedKey ? maskApiKey(encryptedKey) : '',
    });
  } catch (error: any) {
    console.error('Failed to update farmer API key:', error);
    return NextResponse.json(
      { error: 'Failed to update API key: ' + (error?.message || 'Database error') },
      { status: 500 }
    );
  }
}
