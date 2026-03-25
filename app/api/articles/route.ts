import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createArticle, getRoleForUsername, listArticles } from '@/lib/db';
import {
  checkRateLimit,
  parseSearchQuery,
  safeErrorDetails,
  sanitizeArticlePayload,
  sanitizeText,
  sanitizeUsername,
  summarizeMarkdown
} from '@/lib/utils';

function getClientKey(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  return `articles:${ip}`;
}

async function resolveUsername(request: NextRequest): Promise<string> {
  const session = await getCurrentSession(request);
  const sessionUser = sanitizeUsername((session?.user as any)?.username || '');
  if (sessionUser && sessionUser !== 'guest') return sessionUser;
  return sanitizeUsername(request.nextUrl.searchParams.get('username') || 'guest');
}

export async function GET(request: NextRequest) {
  try {
    const rawQuery = request.nextUrl.searchParams.get('q') || '';
    const username = await resolveUsername(request);
    const parsed = parseSearchQuery(rawQuery);
    const articles = await listArticles(parsed.normalized, username);

    const payload = articles.map((article) => ({
      ...article,
      summary: summarizeMarkdown(article.content)
    }));

    return NextResponse.json(payload);
  } catch (error) {
    const safe = safeErrorDetails(error);
    return NextResponse.json({ error: 'Failed to load articles', details: safe.details }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const limit = checkRateLimit(getClientKey(request), 20, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many article create requests. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { title, content, tags, errors } = sanitizeArticlePayload({
      title: body.title,
      content: body.content,
      tags: body.tags
    });
    const session = await getCurrentSession(request);
    const authorUsername = sanitizeUsername((session?.user as any)?.username || body.authorUsername);

    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0], issues: errors }, { status: 400 });
    }

    if (sanitizeText(authorUsername, 32).length < 2) {
      return NextResponse.json({ error: 'Valid username is required.' }, { status: 400 });
    }

    const role = await getRoleForUsername(authorUsername);
    if (role === 'guest') {
      return NextResponse.json({ error: 'Guests can only read articles. Sign in as a user to submit content.' }, { status: 403 });
    }

    if (role === 'pending') {
      return NextResponse.json({ error: 'Verify your email before creating articles.' }, { status: 403 });
    }

    const created = await createArticle({ title, content, tags, authorUsername });
    return NextResponse.json(
      {
        ...created,
        message:
          created.status === 'pending'
            ? 'Article submitted for approval. An admin must approve before it is publicly visible.'
            : 'Article published.'
      },
      { status: 201 }
    );
  } catch (error) {
    const safe = safeErrorDetails(error);
    return NextResponse.json({ error: 'Failed to create article', details: safe.details }, { status: 500 });
  }
}
