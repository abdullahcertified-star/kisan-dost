import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    app: 'Kisan Dost - AI Agricultural Assistant',
    version: '0.1.0',
    environment: 'production',
  });
}
