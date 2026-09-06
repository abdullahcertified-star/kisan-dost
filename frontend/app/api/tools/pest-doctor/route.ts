import { NextRequest } from 'next/server';
import { POST as pestPost } from '@/app/api/pest-doctor/diagnose/route';

export async function POST(req: NextRequest) {
  return pestPost(req);
}
