import { NextRequest, NextResponse } from 'next/server';
import {
  clearGoogleStateCookie,
  exchangeGoogleCodeForProfile,
  readGoogleStateFromRequest,
  setSignedInCookie
} from '@/lib/auth';
import { getRoleForUsername, upsertGoogleAuthUser } from '@/lib/db';
import { sanitizeEmail, sanitizeText, sanitizeUsername } from '@/lib/utils';

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function GET(request: NextRequest) {
  const code = sanitizeText(request.nextUrl.searchParams.get('code') || '', 2048);
  const state = sanitizeText(request.nextUrl.searchParams.get('state') || '', 512);
  const storedState = sanitizeText(readGoogleStateFromRequest(request), 512);

  if (!code || !state || !storedState || state !== storedState) {
    return clearGoogleStateCookie(redirectTo(request, '/signin?error=google_auth'));
  }

  const googleProfile = await exchangeGoogleCodeForProfile(code);
  if (!googleProfile?.email || !googleProfile.providerAccountId) {
    return clearGoogleStateCookie(redirectTo(request, '/signin?error=google_auth'));
  }

  const user = await upsertGoogleAuthUser({
    email: googleProfile.email,
    name: googleProfile.name,
    providerAccountId: googleProfile.providerAccountId
  });

  if (!user) {
    return clearGoogleStateCookie(redirectTo(request, '/signin?error=google_auth'));
  }

  const sessionUser = {
    id: String(user.id),
    username: sanitizeUsername(user.username),
    email: sanitizeEmail(user.email),
    role: await getRoleForUsername(user.username),
    emailVerified: true,
    name: sanitizeUsername(user.username)
  };

  const response = redirectTo(request, '/');
  clearGoogleStateCookie(response);
  return setSignedInCookie(response, sessionUser);
}
