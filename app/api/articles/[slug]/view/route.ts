import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { incrementView } from '@/lib/db';
import { checkRateLimit, isValidSlug, safeErrorDetails, sanitizeUsername } from '@/lib/utils';

type Context = {
  params: Promise<{ slug: string }>;
};

function getClientKey(request: Request): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  return `article-view:${ip}`;
}

export async function POST(request: Request, context: Context) {
  try {
    const limit = checkRateLimit(getClientKey(request), 120, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many view requests. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) } }
      );
    }

    const { slug } = await context.params;
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: 'Invalid article slug.' }, { status: 400 });
    }

    const url = new URL(request.url);
    const session = await getCurrentSession(request);
    const username = sanitizeUsername((session?.user as any)?.username || url.searchParams.get('username') || 'guest');
    const updated = await incrementView(slug, username);
    if (!updated) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    const safe = safeErrorDetails(error);
    return NextResponse.json({ error: 'Failed to increment views', details: safe.details }, { status: 500 });
  }
}
