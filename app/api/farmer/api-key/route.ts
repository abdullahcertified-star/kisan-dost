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

    // If key is provided, validate it against Google AI Studio API
    if (apiKey && apiKey.length > 5) {
      try {
        const testRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] }),
            signal: AbortSignal.timeout(6000),
          }
        );
        if (!testRes.ok) {
          const errText = await testRes.text().catch(() => '');
          if (testRes.status === 400 || testRes.status === 401 || testRes.status === 403) {
            if (
              errText.includes('API_KEY_INVALID') ||
              errText.includes('API key not valid') ||
              errText.includes('PERMISSION_DENIED') ||
              errText.includes('API key expired') ||
              errText.includes('CONSUMER_INVALID')
            ) {
              return NextResponse.json(
                {
                  error: 'This API key was rejected by Google AI Studio (API key deleted or invalid). Please generate a valid key from aistudio.google.com.',
                  key_invalid: true,
                },
                { status: 400 }
              );
            }
          }
        }
      } catch (probeErr) {
        // Network glitch or timeout: proceed with saving
      }
    }

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
