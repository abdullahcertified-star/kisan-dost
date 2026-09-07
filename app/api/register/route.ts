import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';
import { encryptApiKey, maskApiKey, hashApiKey } from '@/lib/crypto';
import { getJwtSecret } from '@/lib/env';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 1. Sliding-window rate limit: 3 registration requests/minute per IP
  const clientIp = getClientIp(req.headers);
  const rateLimit = checkRateLimit(`reg_${clientIp}`, 3, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Too many registration requests. Please wait one minute before trying again.',
        retryAfter: rateLimit.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfter),
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  try {
    const body = await req.json();
    const { phone, email, password, name, district, acres, crop, geminiApiKey } = body;

    if (!phone || !password || !name || !district) {
      return NextResponse.json(
        { error: 'Missing required fields: phone, password, name, and district are mandatory.' },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).trim();
    const cleanEmail = email ? String(email).trim().toLowerCase() : cleanPhone;

    // Check if farmer already exists in Neon database
    const existingCheck = await pool.query(
      'SELECT id FROM farmers WHERE phone = $1 OR (email IS NOT NULL AND email = $2) LIMIT 1',
      [cleanPhone, cleanEmail]
    );

    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        { error: 'This phone number or email is already registered. Please sign in instead.' },
        { status: 409 }
      );
    }

    // Securely hash password using bcrypt (salt rounds = 10)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const rawApiKey = geminiApiKey && String(geminiApiKey).trim().length > 5 ? String(geminiApiKey).trim() : null;
    const encryptedKey = rawApiKey ? encryptApiKey(rawApiKey) : null;

    // Insert into Neon 'farmers' table
    const insertResult = await pool.query(
      `INSERT INTO farmers (phone, email, password_hash, name, district, acres, crop, gemini_api_key, registered_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, phone, email, name, district, acres, crop, gemini_api_key, registered_at`,
      [
        cleanPhone,
        cleanEmail,
        passwordHash,
        String(name).trim(),
        String(district).trim(),
        Math.max(0.1, Math.min(10000, Number(acres) || 5)),
        crop || 'Wheat (گندم)',
        encryptedKey,
      ]
    );

    const newUser = insertResult.rows[0];
    const JWT_SECRET = getJwtSecret();

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, phone: newUser.phone, name: newUser.name, role: 'Farmer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Track active token in Neon 'kisan_auth_tokens' table
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO kisan_auth_tokens (session_token, user_id, role, free_queries_used, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [token, newUser.id, 'Farmer', 0, expiresAt]
    );

    const safeUser = {
      ...newUser,
      gemini_api_key: maskApiKey(newUser.gemini_api_key),
      has_gemini_key: Boolean(rawApiKey),
      gemini_key_hash: rawApiKey ? hashApiKey(rawApiKey) : null,
    };

    // Set secure HttpOnly cookie on response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Farmer registered successfully in Neon PostgreSQL',
        token,
        user: safeUser,
      },
      { status: 201 }
    );

    response.cookies.set('kisan_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[Registration API Error]:', error);
    const isConnRefused = error?.code === 'ECONNREFUSED' || error?.message?.includes('ECONNREFUSED');
    const isDbConfig = error?.message?.includes('DATABASE_URL');
    if (isDbConfig) {
      return NextResponse.json(
        { error: 'Database configuration missing: DATABASE_URL is not configured in environment variables.' },
        { status: 503 }
      );
    }
    if (isConnRefused) {
      return NextResponse.json(
        { error: 'Database connection refused. Please verify DATABASE_URL is configured with ?sslmode=require in Vercel settings.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Registration service temporarily unavailable. Please verify database settings.' },
      { status: 500 }
    );
  }
}
