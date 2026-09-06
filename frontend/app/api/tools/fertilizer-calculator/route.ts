import { NextRequest } from 'next/server';
import { POST as fertPost } from '@/app/api/fertilizer/calculate/route';

export async function POST(req: NextRequest) {
  return fertPost(req);
}
