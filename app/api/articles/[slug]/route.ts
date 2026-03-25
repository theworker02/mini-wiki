import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import {
  deleteArticle,
  getArticleBySlug,
  getRoleForUsername,
  listEditRequestsForArticle,
  reviewArticle,
  reviewEditRequest,
  submitEditRequest,
  updateArticle
} from '@/lib/db';
import {
  checkRateLimit,
  isValidSlug,
  safeErrorDetails,
  sanitizeArticlePayload,
  sanitizeUsername
} from '@/lib/utils';

type Context = {
  params: Promise<{ slug: string }>;
};

function getClientKey(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  return `article-edit:${ip}`;
}

async function resolveUsername(request: NextRequest): Promise<string> {
  const session = await getCurrentSession(request);
  const sessionUser = sanitizeUsername((session?.user as any)?.username || '');
  if (sessionUser && sessionUser !== 'guest') return sessionUser;
  return sanitizeUsername(request.nextUrl.searchParams.get('username') || 'guest');
}

export async function GET(_request: NextRequest, context: Context) {
  try {
    const { slug } = await context.params;
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: 'Invalid article slug.' }, { status: 400 });
    }

    const username = await resolveUsername(_request);
    const article = await getArticleBySlug(slug, username);
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const editRequests = await listEditRequestsForArticle(slug, username);
    return NextResponse.json({ ...article, editRequests });
  } catch (error) {
    const safe = safeErrorDetails(error);
    return NextResponse.json({ error: 'Failed to load article', details: safe.details }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    const limit = checkRateLimit(getClientKey(request), 40, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many edit requests. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) } }
      );
    }

    const { slug } = await context.params;
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: 'Invalid article slug.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { title, content, tags, errors } = sanitizeArticlePayload({
      title: body.title,
      content: body.content,
      tags: body.tags
    });
    const session = await getCurrentSession(request);
    const editorUsername = sanitizeUsername((session?.user as any)?.username || body.editorUsername);

    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0], issues: errors }, { status: 400 });
    }

    const updated = await updateArticle(slug, { title, content, tags, editorUsername });
    if (!updated) {
      return NextResponse.json({ error: 'Only approved editors and admins can edit directly.' }, { status: 403 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    const safe = safeErrorDetails(error);
    return NextResponse.json({ error: 'Failed to update article', details: safe.details }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const limit = checkRateLimit(getClientKey(request), 25, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many edit-application requests. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) } }
      );
    }

    const { slug } = await context.params;
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: 'Invalid article slug.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const session = await getCurrentSession(request);
    const requesterUsername = sanitizeUsername((session?.user as any)?.username || body.requesterUsername);
    const requesterRole = await getRoleForUsername(requesterUsername);
    const intent = String(body.intent || '').trim();
    const hasProposedChanges = Boolean(
      String(body.proposedTitle || '').trim() ||
      String(body.proposedContent || '').trim() ||
      (Array.isArray(body.proposedTags) && body.proposedTags.length > 0)
    );

    if (intent.length < 8 && !hasProposedChanges) {
      return NextResponse.json(
        { error: 'Provide an edit intent (at least 8 characters) or include proposed changes.' },
        { status: 400 }
      );
    }

    if (requesterRole === 'pending') {
      return NextResponse.json({ error: 'Verify your email before requesting edit access.' }, { status: 403 });
    }

    const created = await submitEditRequest({
      slug,
      requesterUsername,
      intent,
      proposedTitle: body.proposedTitle,
      proposedContent: body.proposedContent,
      proposedTags: Array.isArray(body.proposedTags) ? body.proposedTags : []
    });

    if (!created) {
      return NextResponse.json(
        { error: 'Unable to submit edit request. Only non-editor users can apply to edit.' },
        { status: 403 }
      );
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const safe = safeErrorDetails(error);
    return NextResponse.json({ error: 'Failed to submit edit request', details: safe.details }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const limit = checkRateLimit(getClientKey(request), 30, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many moderation requests. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) } }
      );
    }

    const { slug } = await context.params;
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: 'Invalid article slug.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const session = await getCurrentSession(request);
    const actorUsername = sanitizeUsername((session?.user as any)?.username || body.actorUsername);
    const action = String(body.action || '');

    if (action === 'approve_article' || action === 'reject_article') {
      const decision = action === 'approve_article' ? 'approved' : 'rejected';
      const updated = await reviewArticle({ slug, actorUsername, decision });
      if (!updated) {
        return NextResponse.json({ error: 'Only admins can approve or reject new articles.' }, { status: 403 });
      }
      return NextResponse.json(updated);
    }

    if (action === 'approve_edit_request' || action === 'reject_edit_request') {
      const requestId = String(body.requestId || '');
      const decision = action === 'approve_edit_request' ? 'approved' : 'rejected';
      const reviewed = await reviewEditRequest({ requestId, actorUsername, decision });
      if (!reviewed) {
        return NextResponse.json({ error: 'Only admins can review edit requests.' }, { status: 403 });
      }
      return NextResponse.json(reviewed);
    }

    return NextResponse.json({ error: 'Unsupported moderation action.' }, { status: 400 });
  } catch (error) {
    const safe = safeErrorDetails(error);
    return NextResponse.json({ error: 'Failed to process moderation action', details: safe.details }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const limit = checkRateLimit(getClientKey(request), 20, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many delete requests. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) } }
      );
    }

    const { slug } = await context.params;
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: 'Invalid article slug.' }, { status: 400 });
    }

    const actorUsername = await resolveUsername(request);
    if (!actorUsername || actorUsername === 'guest') {
      return NextResponse.json({ error: 'Username is required to delete an article.' }, { status: 400 });
    }

    const removed = await deleteArticle(slug, actorUsername);
    if (!removed) {
      return NextResponse.json(
        { error: 'Article not found or you do not have permission to delete it.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const safe = safeErrorDetails(error);
    return NextResponse.json({ error: 'Failed to delete article', details: safe.details }, { status: 500 });
  }
}
