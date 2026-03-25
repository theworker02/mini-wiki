import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserById, getAuthUserByIdentifier, getRoleForUsername } from '@/lib/db';
import { sanitizeEmail, sanitizeText, sanitizeUsername, UserRole } from '@/lib/utils';

export type SessionUser = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  name: string;
};

export type SessionData = {
  user: SessionUser;
};

type SessionPayload = {
  user: SessionUser;
  iat: number;
  exp: number;
};

const SESSION_COOKIE = 'miniwiki_session';
const GOOGLE_STATE_COOKIE = 'miniwiki_google_state';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const EMAIL_VERIFICATION_TTL_HOURS = 24;
const GOOGLE_STATE_TTL_SECONDS = 60 * 10;

function getAuthSecret() {
  return sanitizeText(process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'miniwiki-dev-secret', 256) || 'miniwiki-dev-secret';
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signValue(value: string) {
  return createHmac('sha256', getAuthSecret()).update(value).digest('base64url');
}

function parseCookie(header: string | null, name: string) {
  if (!header) return null;

  for (const part of header.split(';')) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (rawKey !== name) continue;
    return rest.join('=');
  }

  return null;
}

function createSessionToken(user: SessionUser) {
  const now = Date.now();
  const payload: SessionPayload = {
    user,
    iat: now,
    exp: now + SESSION_TTL_MS
  };

  const encoded = encodeBase64Url(JSON.stringify(payload));
  const signature = signValue(encoded);
  return `${encoded}.${signature}`;
}

function verifySessionToken(token: string | null): SessionData | null {
  if (!token) return null;

  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  const expected = signValue(encoded);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encoded)) as SessionPayload;
    if (!payload?.user || payload.exp <= Date.now()) return null;
    return { user: payload.user };
  } catch {
    return null;
  }
}

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge
  };
}

function getGoogleCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge
  };
}

function resolveAppOrigin() {
  const vercelUrl = sanitizeText(process.env.VERCEL_URL || '', 2048);
  const raw =
    sanitizeText(process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '', 2048) ||
    (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000');

  try {
    return new URL(raw).origin;
  } catch {
    return 'http://localhost:3000';
  }
}

function getGoogleClientId() {
  return sanitizeText(process.env.GOOGLE_CLIENT_ID || '', 512);
}

function getGoogleClientSecret() {
  return sanitizeText(process.env.GOOGLE_CLIENT_SECRET || '', 512);
}

export function isGoogleAuthConfigured() {
  return Boolean(getGoogleClientId() && getGoogleClientSecret());
}

export function getGoogleCallbackUrl() {
  return `${resolveAppOrigin()}/api/auth/google/callback`;
}

async function hydrateSessionUser(user: SessionUser): Promise<SessionUser | null> {
  const record = await getAuthUserById(user.id);
  if (!record) return null;

  const role = await getRoleForUsername(record.username);
  const username = sanitizeUsername(record.username);
  const email = sanitizeEmail(record.email);

  if (!username || !email) return null;

  return {
    id: String(record.id),
    username,
    email,
    role,
    emailVerified: Boolean(record.emailVerified),
    name: username
  };
}

export function getAuthProviders() {
  const providers: Record<string, { id: string; name: string }> = {
    credentials: {
      id: 'credentials',
      name: 'Credentials'
    }
  };

  if (isGoogleAuthConfigured()) {
    providers.google = {
      id: 'google',
      name: 'Google'
    };
  }

  return providers;
}

export async function hashPassword(password: string) {
  const safePassword = sanitizeText(password, 120);
  const salt = randomBytes(16).toString('base64url');
  const hash = scryptSync(safePassword, salt, 64).toString('base64url');
  return `scrypt$${salt}$${hash}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const safePassword = sanitizeText(password, 120);
  const normalizedHash = sanitizeText(storedHash, 255);

  if (!safePassword || !normalizedHash) return false;

  if (!normalizedHash.startsWith('scrypt$')) {
    return false;
  }

  const [, salt, expectedHash] = normalizedHash.split('$');
  if (!salt || !expectedHash) return false;

  const actualHash = scryptSync(safePassword, salt, 64);
  const expectedBuffer = Buffer.from(expectedHash, 'base64url');
  return expectedBuffer.length === actualHash.length && timingSafeEqual(actualHash, expectedBuffer);
}

export async function resolveSessionUser(identifier: string, password: string): Promise<SessionUser | null> {
  const safeIdentifier = sanitizeText(identifier, 254).toLowerCase();
  const safePassword = sanitizeText(password, 120);
  if (!safeIdentifier || !safePassword) return null;

  const user = await getAuthUserByIdentifier(safeIdentifier);
  if (!user || !user.passwordHash) return null;

  const matches = await verifyPassword(safePassword, user.passwordHash);
  if (!matches) return null;

  const role = await getRoleForUsername(user.username);
  const username = sanitizeUsername(user.username);
  const email = sanitizeEmail(user.email);

  if (!username || !email) return null;

  return {
    id: String(user.id),
    username,
    email,
    role,
    emailVerified: Boolean(user.emailVerified),
    name: username
  };
}

export async function getCurrentSession(request?: Request | NextRequest): Promise<SessionData | null> {
  const readFromToken = (token: string | null) => verifySessionToken(token);

  if (request) {
    const session = readFromToken(parseCookie(request.headers.get('cookie'), SESSION_COOKIE));
    if (!session?.user) return null;
    const hydrated = await hydrateSessionUser(session.user);
    return hydrated ? { user: hydrated } : null;
  }

  const store = await cookies();
  const session = readFromToken(store.get(SESSION_COOKIE)?.value || null);
  if (!session?.user) return null;
  const hydrated = await hydrateSessionUser(session.user);
  return hydrated ? { user: hydrated } : null;
}

export function createSignedInResponse(user: SessionUser, init?: ResponseInit) {
  const response = NextResponse.json({ user }, init);
  setSignedInCookie(response, user);
  return response;
}

export function setSignedInCookie(response: NextResponse, user: SessionUser) {
  response.cookies.set(SESSION_COOKIE, createSessionToken(user), getCookieOptions(Math.floor(SESSION_TTL_MS / 1000)));
  return response;
}

export function createSignedOutResponse(init?: ResponseInit) {
  const response = NextResponse.json({ success: true }, init);
  response.cookies.set(SESSION_COOKIE, '', getCookieOptions(0));
  response.cookies.set(GOOGLE_STATE_COOKIE, '', getGoogleCookieOptions(0));
  return response;
}

export function createGoogleAuthState() {
  return randomBytes(24).toString('base64url');
}

export function createGoogleAuthUrl(state: string) {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', getGoogleClientId());
  url.searchParams.set('redirect_uri', getGoogleCallbackUrl());
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('access_type', 'online');
  url.searchParams.set('prompt', 'select_account');
  return url.toString();
}

export function attachGoogleStateCookie(response: NextResponse, state: string) {
  response.cookies.set(GOOGLE_STATE_COOKIE, state, getGoogleCookieOptions(GOOGLE_STATE_TTL_SECONDS));
  return response;
}

export function clearGoogleStateCookie(response: NextResponse) {
  response.cookies.set(GOOGLE_STATE_COOKIE, '', getGoogleCookieOptions(0));
  return response;
}

export function readGoogleStateFromRequest(request: NextRequest) {
  return request.cookies.get(GOOGLE_STATE_COOKIE)?.value || '';
}

export async function exchangeGoogleCodeForProfile(code: string) {
  const safeCode = sanitizeText(code, 2048);
  if (!safeCode || !isGoogleAuthConfigured()) return null;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: safeCode,
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      redirect_uri: getGoogleCallbackUrl(),
      grant_type: 'authorization_code'
    }).toString()
  });

  if (!tokenResponse.ok) return null;

  const tokenPayload = (await tokenResponse.json().catch(() => null)) as
    | { access_token?: string; id_token?: string }
    | null;
  const accessToken = sanitizeText(tokenPayload?.access_token || '', 4096);
  if (!accessToken) return null;

  const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!profileResponse.ok) return null;

  const profile = (await profileResponse.json().catch(() => null)) as
    | { sub?: string; email?: string; name?: string; email_verified?: boolean }
    | null;

  if (!profile?.sub || !profile?.email || profile.email_verified === false) {
    return null;
  }

  return {
    providerAccountId: sanitizeText(profile.sub, 255),
    email: sanitizeEmail(profile.email),
    name: sanitizeText(profile.name || '', 120)
  };
}

export async function sendVerificationEmail(payload: { email: string; username: string; token: string }) {
  const email = sanitizeEmail(payload.email);
  const username = sanitizeUsername(payload.username);
  const token = sanitizeText(payload.token, 512);
  const verificationUrl = `${resolveAppOrigin()}/api/auth/verify?token=${encodeURIComponent(token)}`;
  const resendApiKey = sanitizeText(process.env.RESEND_API_KEY || '', 256);
  const fromEmail = sanitizeText(process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || '', 254);

  if (!email || !username || !token) {
    throw new Error('Missing verification email payload.');
  }

  if (!resendApiKey || !fromEmail) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Resend is not configured. Set RESEND_API_KEY and EMAIL_FROM.');
    }

    console.info(`[mini-wiki] Verification link for ${email}: ${verificationUrl}`);
    return { delivered: false, previewUrl: verificationUrl };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email],
      subject: 'Verify your Mini Wiki account',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
          <h2>Verify your Mini Wiki account</h2>
          <p>Hi @${username},</p>
          <p>Click the button below to verify your email and activate your account.</p>
          <p>
            <a href="${verificationUrl}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
              Verify Email
            </a>
          </p>
          <p>This link expires in ${EMAIL_VERIFICATION_TTL_HOURS} hours and can only be used once.</p>
          <p>If you did not create this account, you can ignore this email.</p>
        </div>
      `,
      text: `Verify your Mini Wiki account by visiting ${verificationUrl}. This link expires in ${EMAIL_VERIFICATION_TTL_HOURS} hours.`
    })
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Failed to send verification email. ${details}`.trim());
  }

  return { delivered: true, previewUrl: verificationUrl };
}
