import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { getProfile, setUserRole, upsertProfile } from '@/lib/db';
import { checkRateLimit, safeErrorDetails, sanitizeRole, sanitizeThemeColor, sanitizeUsername } from '@/lib/utils';

type Context = {
  params: Promise<{ username: string }>;
};

function getClientKey(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  return `profile:${ip}`;
}

export async function GET(_request: NextRequest, context: Context) {
  try {
    const { username: rawUsername } = await context.params;
    const username = sanitizeUsername(rawUsername);

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }
    if (username === 'guest') {
      return NextResponse.json({
        username: 'guest',
        themeColor: '#2563eb',
        role: 'guest',
        updatedAt: new Date().toISOString()
      });
    }

    const profile = await getProfile(username);
    if (!profile) {
      return NextResponse.json({
        username,
        themeColor: '#2563eb',
        role: username === 'admin' ? 'admin' : 'user',
        updatedAt: new Date().toISOString()
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    const safe = safeErrorDetails(error);
    return NextResponse.json({ error: 'Failed to load profile', details: safe.details }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const limit = checkRateLimit(getClientKey(request), 30, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many profile updates. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) } }
      );
    }

    const { username: rawUsername } = await context.params;
    const username = sanitizeUsername(rawUsername);
    const session = await getCurrentSession(request);
    const sessionUsername = sanitizeUsername((session?.user as any)?.username || '');
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    if (body.role) {
      const actorUsername = sanitizeUsername(sessionUsername || body.actorUsername);
      const role = sanitizeRole(body.role);
      const updatedRole = await setUserRole({ targetUsername: username, actorUsername, role });
      if (!updatedRole) {
        return NextResponse.json({ error: 'Only admins can promote users.' }, { status: 403 });
      }
      return NextResponse.json(updatedRole);
    }

    if (sessionUsername && sessionUsername !== username) {
      return NextResponse.json({ error: 'You can only edit your own profile.' }, { status: 403 });
    }

    const themeColor = sanitizeThemeColor(body.themeColor);
    const profile = await upsertProfile(username, themeColor);
    return NextResponse.json(profile);
  } catch (error) {
    const safe = safeErrorDetails(error);
    return NextResponse.json({ error: 'Failed to save profile', details: safe.details }, { status: 500 });
  }
}
