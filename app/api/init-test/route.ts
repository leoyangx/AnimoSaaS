import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Init test route is working' });
}
