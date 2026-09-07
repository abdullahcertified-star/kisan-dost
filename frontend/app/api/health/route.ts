import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbConfigured = Boolean(
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL
  );
  const jwtConfigured = Boolean(process.env.JWT_SECRET);
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

  let dbConnected = false;
  let dbError: string | null = null;

  if (dbConfigured) {
    try {
      const res = await pool.query('SELECT 1 as test');
      dbConnected = res.rows.length > 0;
    } catch (err: any) {
      dbError = err?.message?.includes('ECONNREFUSED')
        ? 'ECONNREFUSED (Unable to reach PostgreSQL server)'
        : 'Connection check failed';
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
