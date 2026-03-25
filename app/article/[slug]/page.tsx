'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import RelatedArticles from '@/components/RelatedArticles';
import { useProfile } from '@/components/ProfileProvider';
import {
  Article,
  EditRequest,
  calculateEngagementScore,
  estimateReadTime,
  isValidSlug,
  safeMarkdownUrl,
  summarizeMarkdown
} from '@/lib/utils';

type ArticlePayload = Article & {
  editRequests?: EditRequest[];
};

export default function ArticlePage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params.slug || '');
  const { username, role } = useProfile();

  const [article, setArticle] = useState<ArticlePayload | null>(null);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [intent, setIntent] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    if (!slug || !isValidSlug(slug)) {
      setError('Invalid article URL.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [articleResponse, allResponse] = await Promise.all([
        fetch(`/api/articles/${encodeURIComponent(slug)}?username=${encodeURIComponent(username)}`, { cache: 'no-store' }),
        fetch(`/api/articles?username=${encodeURIComponent(username)}`, { cache: 'no-store' })
      ]);

      const articleData = await articleResponse.json();
      const allData = await allResponse.json();

      if (!articleResponse.ok) {
        throw new Error(articleData.error || 'Article not found');
      }

      setArticle(articleData);
      setAllArticles(Array.isArray(allData) ? allData : []);

      const viewRes = await fetch(`/api/articles/${encodeURIComponent(slug)}/view?username=${encodeURIComponent(username)}`, {
        method: 'POST'
      });
      if (viewRes.ok) {
        const viewed = await viewRes.json();
        setArticle((prev) => (prev ? { ...prev, ...viewed } : viewed));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load article');
      setArticle(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [slug, username]);

  const readTime = useMemo(() => estimateReadTime(article?.content || ''), [article?.content]);
  const engagement = useMemo(
    () => (article ? calculateEngagementScore({ likes: article.likes, views: article.views }) : 0),
    [article]
  );

  const canDirectEdit = role === 'editor' || role === 'admin';
  const isAdmin = role === 'admin';

  const onLike = async () => {
    if (!article) return;
    setLiking(true);
    try {
      const response = await fetch(`/api/articles/${encodeURIComponent(article.slug)}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to like article');
      }
      setArticle((prev) => (prev ? { ...prev, ...data } : data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Like failed');
    } finally {
      setLiking(false);
    }
  };

  const onApplyToEdit = async () => {
    if (!article) return;
    setSubmittingRequest(true);
    setError('');
    try {
      const response = await fetch(`/api/articles/${encodeURIComponent(article.slug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterUsername: username, intent })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit edit request');
      }

      setIntent('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit edit request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const moderateArticle = async (action: 'approve_article' | 'reject_article') => {
    if (!article) return;
    const response = await fetch(`/api/articles/${encodeURIComponent(article.slug)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, actorUsername: username })
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Moderation failed');
      return;
    }

    setArticle((prev) => (prev ? { ...prev, ...data } : data));
  };

  const moderateEditRequest = async (requestId: string, action: 'approve_edit_request' | 'reject_edit_request') => {
    if (!article) return;
    const response = await fetch(`/api/articles/${encodeURIComponent(article.slug)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, actorUsername: username, requestId })
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Edit request moderation failed');
      return;
    }

    await load();
  };

  if (loading) {
    return <div className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />;
  }

  if (!article) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-5 shadow-card">
        <p className="text-red-600">{error || 'Article not found.'}</p>
        <Link href="/" className="mt-2 inline-block text-sm font-semibold text-[var(--theme-color)]">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <header className="border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-bold text-slate-900">{article.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">{summarizeMarkdown(article.content)}</p>
            {article.status !== 'published' ? (
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                {article.status === 'pending' ? 'Pending Approval' : 'Rejected'}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Link
                key={tag}
                href={`/?q=${encodeURIComponent(`#${tag}`)}`}
                className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                #{tag}
              </Link>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onLike}
              disabled={liking}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              👍 {article.likes}
            </button>
            <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">
              👁️ {article.views}
            </span>
            <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">
              {readTime} min read
            </span>
            <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-sm font-semibold text-cyan-700">
              Engagement {engagement}/100
            </span>
            {canDirectEdit ? (
              <Link
                href={`/edit/${article.slug}`}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Edit
              </Link>
            ) : null}
          </div>

          {!canDirectEdit && role === 'user' ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">Apply to Edit</p>
              <p className="mt-1 text-xs text-slate-600">
                Your request will be reviewed by an admin. Approved editors can edit articles directly.
              </p>
              <textarea
                value={intent}
                onChange={(event) => setIntent(event.target.value)}
                placeholder="Describe what you want to improve..."
                rows={3}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--theme-color)]"
              />
              <button
                type="button"
                onClick={onApplyToEdit}
                disabled={submittingRequest || intent.trim().length < 8}
                className="mt-2 rounded-lg bg-[var(--theme-color)] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submittingRequest ? 'Submitting...' : 'Submit Edit Request'}
              </button>
            </div>
          ) : null}

          {role === 'pending' ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Verify your email before requesting edit access or submitting content.
            </div>
          ) : null}

          {isAdmin && article.status === 'pending' ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-800">Admin Review: Article Approval</p>
              <button
                type="button"
                onClick={() => moderateArticle('approve_article')}
                className="rounded-md border border-emerald-300 bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => moderateArticle('reject_article')}
                className="rounded-md border border-rose-300 bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-800"
              >
                Reject
              </button>
            </div>
          ) : null}

          {isAdmin && article.editRequests && article.editRequests.length > 0 ? (
            <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">Pending Edit Requests</p>
              {article.editRequests
                .filter((request) => request.status === 'pending')
                .map((request) => (
                  <div key={request.id} className="rounded-lg border border-slate-200 bg-white p-2">
                    <p className="text-xs font-semibold text-slate-700">@{request.requesterUsername}</p>
                    <p className="text-sm text-slate-700">{request.intent || 'No intent provided.'}</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => moderateEditRequest(request.id, 'approve_edit_request')}
                        className="rounded-md border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => moderateEditRequest(request.id, 'reject_edit_request')}
                        className="rounded-md border border-rose-300 bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ) : null}
        </header>

        <div className="prose mt-5 max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            skipHtml
            urlTransform={(url) => safeMarkdownUrl(url)}
            components={{
              a: ({ node, ...props }) => <a {...props} rel="noreferrer noopener nofollow" target="_blank" />
            }}
          >
            {article.content}
          </ReactMarkdown>
        </div>
      </article>

      <RelatedArticles current={article} allArticles={allArticles} />
    </div>
  );
}
