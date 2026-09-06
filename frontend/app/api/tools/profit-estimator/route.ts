import { NextRequest } from 'next/server';
import { POST as profitPost } from '@/app/api/profit/calculate/route';

export async function POST(req: NextRequest) {
  return profitPost(req);
}
