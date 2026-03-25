import { NextResponse } from 'next/server';
import { getAuthProviders } from '@/lib/auth';

export async function GET() {
  return NextResponse.json(getAuthProviders());
}
