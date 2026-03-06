import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const config = await db.config.get();
  return NextResponse.json({
    siteName: config.title || 'AnimoSaaS',
    slogan: config.slogan || 'Private Domain Material Distribution System',
    logo: config.logo || '',
    watermark: config.watermark || 'ANIMO'
  });
}
