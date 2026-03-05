import { NextResponse } from 'next/server';
// In a real app, we'd use Prisma here. 
// For this environment, we'll simulate the DB access to ensure it works without complex setup.
import { getSettings } from '@/lib/settings-service';

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}
