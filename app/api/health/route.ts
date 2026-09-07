import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getDatabaseUrl } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbUrl = getDatabaseUrl();
  const dbConfigured = Boolean(dbUrl);
  const jwtConfigured = Boolean(process.env.JWT_SECRET || dbUrl);
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

  let dbConnected = false;
  let dbError: string | null = null;

  if (dbConfigured) {
    try {
      const res = await pool.query('SELECT 1 as test');
      dbConnected = res.rows.length > 0;
    } catch (err: any) {
      const rawMsg = String(err?.message || '');
      // Sanitize any accidental password leaking from connection error
      dbError = rawMsg.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
    }
  }

  const allHealthy = dbConfigured && jwtConfigured && dbConnected;

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database_configured: dbConfigured,
        database_connected: dbConnected,
        jwt_configured: jwtConfigured,
        gemini_configured: geminiConfigured,
      },
      diagnostics: dbError ? { database: dbError } : undefined,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
