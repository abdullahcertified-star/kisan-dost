import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';
import { maskApiKey, hashApiKey } from '@/lib/crypto';
import { getJwtSecret } from '@/lib/env';

export const dynamic = 'force-dynamic';

const JWT_SECRET = getJwtSecret();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneOrEmail, password } = body;

    if (!phoneOrEmail || !password) {
      return NextResponse.json(
        { error: 'Please enter your phone number or email, and password.' },
        { status: 400 }
      );
    }

    const inputClean = phoneOrEmail.trim().toLowerCase();

    // Query farmer from Neon PostgreSQL
    const userQuery = await pool.query(
      `SELECT id, phone, email, password_hash, name, district, acres, crop, gemini_api_key, registered_at
       FROM farmers
       WHERE LOWER(phone) = $1 OR (email IS NOT NULL AND LOWER(email) = $1)
       LIMIT 1`,
      [inputClean]
    );

    if (userQuery.rows.length === 0) {
      return NextResponse.json(
        { error: 'No account found with this phone number or email. Please register first.' },
        { status: 401 }
      );
    }

    const farmer = userQuery.rows[0];

    // Verify incoming password against bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, farmer.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Incorrect password. Please verify and try again.' },
        { status: 401 }
      );
    }

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
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error?.message || 'Login failure') },
      { status: 500 }
    );
  }
}
