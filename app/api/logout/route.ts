import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('kisan_auth_token')?.value;

    if (token) {
      try {
        await pool.query('DELETE FROM kisan_auth_tokens WHERE session_token = $1', [token]);
      } catch (dbErr) {
        console.warn('Failed to delete session token from db:', dbErr);
      }
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

    // Clear cookie
    response.cookies.set('kisan_auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Logout failed' }, { status: 500 });
  }
}
