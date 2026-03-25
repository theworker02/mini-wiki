import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, sendVerificationEmail } from '@/lib/auth';
import { createAuthUser, getAuthUserByEmail, issueEmailVerificationToken } from '@/lib/db';
import { checkRateLimit, safeErrorDetails, sanitizeEmail, sanitizeText, sanitizeUsername } from '@/lib/utils';

function getClientKey(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  return `auth-register:${ip}`;
}

export async function POST(request: NextRequest) {
  try {
    const limit = checkRateLimit(getClientKey(request), 12, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many sign up attempts. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const username = sanitizeUsername(body.username);
    const email = sanitizeEmail(body.email);
    const password = sanitizeText(body.password, 120);

    if (!username || username === 'guest') {
      return NextResponse.json({ error: 'Valid username is required.' }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const created = await createAuthUser({
      username,
      email,
      passwordHash,
      provider: 'credentials',
      role: 'pending',
      emailVerified: false
    });

    if (!created) {
      const existing = await getAuthUserByEmail(email);
      if (!existing || existing.emailVerified) {
        return NextResponse.json({ error: 'Username or email is already in use.' }, { status: 409 });
      }

      const verification = await issueEmailVerificationToken(existing.id);
      if (!verification) {
        return NextResponse.json({ error: 'Unable to create verification token.' }, { status: 500 });
      }

      const delivery = await sendVerificationEmail({
        email: verification.email,
        username: verification.username,
        token: verification.token
      });

      return NextResponse.json(
        {
          username: existing.username,
          email: existing.email,
          role: 'pending',
          message: 'Check your email to verify your account',
          previewUrl: !delivery.delivered && process.env.NODE_ENV !== 'production' ? delivery.previewUrl : undefined
        },
        { status: 202 }
      );
    }

    const verification = await issueEmailVerificationToken(created.id);
    if (!verification) {
      return NextResponse.json({ error: 'Unable to create verification token.' }, { status: 500 });
    }

    const delivery = await sendVerificationEmail({
      email: verification.email,
      username: verification.username,
      token: verification.token
    });

    return NextResponse.json(
      {
        username: created.username,
        email: created.email,
        role: created.role,
        message: 'Check your email to verify your account',
        previewUrl: !delivery.delivered && process.env.NODE_ENV !== 'production' ? delivery.previewUrl : undefined
      },
      { status: 202 }
    );
  } catch (error) {
    const safe = safeErrorDetails(error);
    return NextResponse.json({ error: 'Failed to register user', details: safe.details }, { status: 500 });
  }
}
