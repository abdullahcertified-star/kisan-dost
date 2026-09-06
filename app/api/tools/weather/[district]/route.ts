import { NextRequest, NextResponse } from 'next/server';
import { GET as weatherGet } from '@/app/api/weather/[district]/route';

export async function GET(req: NextRequest, ctx: { params: Promise<{ district: string }> }) {
  return weatherGet(req, ctx);
}
