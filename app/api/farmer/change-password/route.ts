import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { getJwtSecret } from '@/lib/env';

export const dynamic = 'force-dynamic';

function getAuthenticatedUserId(req: NextRequest): number | null {
  try {
    const token =
      req.cookies.get('kisan_auth_token')?.value ||
      req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) return null;
    const JWT_SECRET = getJwtSecret();
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded?.id || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required. Please log in first.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Please fill all password fields. (تمام خانے پر کریں)' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long. (پاس ورڈ کم از کم 8 حروف پر مشتمل ہونا چاہیے)' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New password and confirm password do not match. (نئے پاس ورڈ کی تصدیق مماثل نہیں ہے)' },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password cannot be the same as your current password. (نیا پاس ورڈ موجودہ پاس ورڈ سے مختلف ہونا چاہیے)' },
        { status: 400 }
      );
    }

    // 1. Fetch current farmer's password hash from Neon PostgreSQL
    const userQuery = await pool.query(
      'SELECT id, password_hash FROM farmers WHERE id = $1 LIMIT 1',
      [userId]
    );

    if (userQuery.rows.length === 0) {
      return NextResponse.json(
        { error: 'User account not found.' },
        { status: 404 }
      );
    }

    const farmer = userQuery.rows[0];

    // 2. Verify current password
    const isCurrentValid = await bcrypt.compare(currentPassword, farmer.password_hash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect. (موجودہ پاس ورڈ غلط ہے)' },
        { status: 401 }
      );
    }

    // 3. Hash new password with salt rounds = 10
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    // 4. Update in Neon PostgreSQL
    await pool.query(
      'UPDATE farmers SET password_hash = $1 WHERE id = $2',
      [newHash, userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully! (پاس ورڈ کامیابی سے تبدیل ہو گیا ہے)',
    });
  } catch (error: any) {
    console.error('[Change Password Error]:', error);
    return NextResponse.json(
      { error: 'Failed to update password: ' + (error?.message || 'Server error') },
      { status: 500 }
    );
  }
}
