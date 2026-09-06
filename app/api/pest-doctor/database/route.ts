import { NextRequest, NextResponse } from 'next/server';
import pestDb from '@/data/pest_database.json';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const crop = searchParams.get('crop');

    if (!crop || crop.toLowerCase() === 'all' || crop.toLowerCase().includes('all')) {
      return NextResponse.json(pestDb);
    }

    const cropLower = crop.toLowerCase();
    const filtered = (pestDb as any[]).filter(
      (p) =>
        (p.crop && p.crop.toLowerCase().includes(cropLower)) ||
        (p.target_crops && p.target_crops.some((tc: string) => tc.toLowerCase().includes(cropLower)))
    );

    return NextResponse.json(filtered.length > 0 ? filtered : pestDb);
  } catch {
    return NextResponse.json(pestDb);
  }
}
