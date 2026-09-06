import { NextRequest } from 'next/server';
import { GET as schemesGet } from '@/app/api/schemes/route';

export async function GET(req: NextRequest) {
  return schemesGet(req);
}
