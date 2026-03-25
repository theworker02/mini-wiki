import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { likeArticle } from '@/lib/db';
import { checkRateLimit, isValidSlug, safeErrorDetails, sanitizeUsername } from '@/lib/utils';

type Context = {
  params: Promise<{ slug: string }>;
};

function getClientKey(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  return `article-like:${ip}`;
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const limit = checkRateLimit(getClientKey(request), 60, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many like requests. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) } }
      );
    }

    const { slug } = await context.params;
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: 'Invalid article slug.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const session = await getCurrentSession(request);
    const username = sanitizeUsername((session?.user as any)?.username || body.username);

    if (!username || username === 'guest') {
      return NextResponse.json({ error: 'Username is required to like an article.' }, { status: 400 });
    }

    const updated = await likeArticle(slug, username);
    if (!updated) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    const safe = safeErrorDetails(error);
    return NextResponse.json({ error: 'Failed to like article', details: safe.details }, { status: 500 });
  }
}
