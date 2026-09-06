import { NextRequest } from 'next/server';
import { GET as marketGet } from '@/app/api/market/prices/route';

export async function GET(req: NextRequest) {
  return marketGet(req);
}
