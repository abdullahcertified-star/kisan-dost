import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';
import { maskApiKey, hashApiKey } from '@/lib/crypto';
import { getJwtSecret } from '@/lib/env';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 1. Sliding-window rate limit: 5 attempts/minute per IP
  const clientIp = getClientIp(req.headers);
  const rateLimit = checkRateLimit(`login_${clientIp}`, 5, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Too many login attempts. Please wait one minute before trying again.',
        retryAfter: rateLimit.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfter),
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  try {
    const body = await req.json();
    const { phoneOrEmail, password } = body;

    if (!phoneOrEmail || !password) {
      return NextResponse.json(
        { error: 'Invalid phone/email or password.' },
        { status: 400 }
      );
    }

    const inputClean = String(phoneOrEmail).trim().toLowerCase();

    // Query farmer from Neon PostgreSQL
    const userQuery = await pool.query(
      `SELECT id, phone, email, password_hash, name, district, acres, crop, gemini_api_key, registered_at
       FROM farmers
       WHERE LOWER(phone) = $1 OR (email IS NOT NULL AND LOWER(email) = $1)
       LIMIT 1`,
      [inputClean]
    );

    // Timing-resilient check preventing account enumeration
    if (userQuery.rows.length === 0) {
      await bcrypt.compare(password, '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345');
      return NextResponse.json(
        { error: 'Invalid phone/email or password.' },
        { status: 401 }
      );
    }

    const farmer = userQuery.rows[0];

    // Verify incoming password against bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, farmer.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid phone/email or password.' },
        { status: 401 }
      );
    }

    const JWT_SECRET = getJwtSecret();

    // Generate JWT token
    const token = jwt.sign(
      { id: farmer.id, phone: farmer.phone, name: farmer.name, role: 'Farmer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Track active token in Neon 'kisan_auth_tokens' table
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO kisan_auth_tokens (session_token, user_id, role, free_queries_used, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [token, farmer.id, 'Farmer', 0, expiresAt]
    );

    const { password_hash, ...restUser } = farmer;
    const safeUser = {
      ...restUser,
      gemini_api_key: maskApiKey(farmer.gemini_api_key),
      has_gemini_key: Boolean(farmer.gemini_api_key),
      gemini_key_hash: farmer.gemini_api_key ? hashApiKey(farmer.gemini_api_key) : null,
    };

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: safeUser,
    });

    // Set secure HttpOnly cookie
    response.cookies.set('kisan_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[Login API Error]:', error);
    const msg = String(error?.message || '');
    const isConnRefused = error?.code === 'ECONNREFUSED' || msg.includes('ECONNREFUSED');
    const isDbConfig = msg.includes('DATABASE_URL') || (!process.env.DATABASE_URL && !process.env.POSTGRES_URL);

    if (isDbConfig) {
      return NextResponse.json(
        { error: 'Database configuration missing: DATABASE_URL is not set in Vercel environment variables.' },
        { status: 503 }
      );
    }
    if (isConnRefused) {
      return NextResponse.json(
        { error: 'Database connection refused: ensure your Neon DATABASE_URL includes ?sslmode=require.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: `Login error: ${msg.slice(0, 120) || 'An unexpected internal error occurred during login.'}` },
      { status: 500 }
    );
  }
}
