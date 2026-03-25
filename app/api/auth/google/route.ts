import { NextResponse } from 'next/server';
import { attachGoogleStateCookie, createGoogleAuthState, createGoogleAuthUrl, isGoogleAuthConfigured } from '@/lib/auth';

export async function GET() {
  if (!isGoogleAuthConfigured()) {
    return NextResponse.json({ error: 'Google sign-in is not configured.' }, { status: 404 });
  }

  const state = createGoogleAuthState();
  const response = NextResponse.redirect(createGoogleAuthUrl(state));
  return attachGoogleStateCookie(response, state);
}
