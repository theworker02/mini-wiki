import { NextRequest, NextResponse } from 'next/server';
import { createSignedInResponse, createSignedOutResponse, getCurrentSession, resolveSessionUser } from '@/lib/auth';
import { checkRateLimit, safeErrorDetails, sanitizeText } from '@/lib/utils';

function getClientKey(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  return `auth-session:${ip}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession(request);
    if (!session?.user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json(session);
  } catch (error) {
    const safe = safeErrorDetails(error);
    return NextResponse.json({ error: 'Failed to load session', details: safe.details }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const limit = checkRateLimit(getClientKey(request), 20, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many sign in attempts. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const identifier = sanitizeText(body.identifier, 254);
    const password = sanitizeText(body.password, 120);
    const user = await resolveSessionUser(identifier, password);

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    return createSignedInResponse(user);
  } catch (error) {
    const safe = safeErrorDetails(error);
    return NextResponse.json({ error: 'Failed to sign in', details: safe.details }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    return createSignedOutResponse();
  } catch (error) {
    const safe = safeErrorDetails(error);
    return NextResponse.json({ error: 'Failed to sign out', details: safe.details }, { status: 500 });
  }
}
