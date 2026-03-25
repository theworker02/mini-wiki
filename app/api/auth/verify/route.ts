import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailVerificationToken } from '@/lib/db';

function redirectWithStatus(request: NextRequest, status: 'success' | 'invalid') {
  const destination = new URL('/', request.url);
  destination.searchParams.set('verified', status);
  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  const verified = await verifyEmailVerificationToken(token);
  return redirectWithStatus(request, verified ? 'success' : 'invalid');
}
