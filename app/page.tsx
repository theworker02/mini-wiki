'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ArticleCard from '@/components/ArticleCard';
import { useProfile } from '@/components/ProfileProvider';
import SearchBar from '@/components/SearchBar';
import { Article, parseSearchQuery, searchArticles, sanitizeText } from '@/lib/utils';

async function fetchArticles(username: string): Promise<Article[]> {
  const response = await fetch(`/api/articles?username=${encodeURIComponent(username)}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to fetch articles');
  return response.json();
}

export default function HomePage() {
  const router = useRouter();
  const { username, role } = useProfile();
  const searchParams = useSearchParams();
  const initialQuery = sanitizeText(searchParams.get('q') || '', 120);
  const verificationState = sanitizeText(searchParams.get('verified') || '', 24);

  const [articles, setArticles] = useState<Article[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchArticles(username);
        setArticles(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load articles');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [username]);

  const parsed = useMemo(() => parseSearchQuery(query), [query]);

  const filtered = useMemo(() => searchArticles(articles, query), [articles, query]);

  const trending = useMemo(
    () => [...articles].sort((a, b) => b.likes * 2 + b.views - (a.likes * 2 + a.views)).slice(0, 6),
    [articles]
  );

  const newest = useMemo(
    () => [...articles].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6),
    [articles]
  );

  const randomExplore = () => {
    if (articles.length === 0) return;
    const random = articles[Math.floor(Math.random() * articles.length)];
    router.push(`/article/${random.slug}`);
  };

  const updateQuery = (next: string) => {
    setQuery(next);
    const normalized = sanitizeText(next, 120);
    const params = new URLSearchParams(searchParams.toString());
    if (normalized) {
      params.set('q', normalized);
    } else {
      params.delete('q');
    }

    const nextQs = params.toString();
    router.replace(nextQs ? `/?${nextQs}` : '/');
  };

  const showingSearch = parsed.mode !== 'empty';

  return (
    <div className="space-y-5">
      {verificationState === 'success' ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Your email has been verified. Your account is now active.
        </div>
      ) : null}

      {verificationState === 'invalid' ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          That verification link is invalid or has expired.
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--theme-color)]">Mini Wiki</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Connected Knowledge Engine</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Search, write, and connect articles with automatic related suggestions and a visual knowledge map.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (role !== 'pending') router.push('/create');
            }}
            disabled={role === 'pending'}
            className="rounded-lg bg-[var(--theme-color)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {role === 'pending' ? 'Verify Email To Create' : 'Create New Article'}
          </button>
          <button
            type="button"
            onClick={randomExplore}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Random Exploration
          </button>
        </div>
      </section>

      <SearchBar value={query} onChange={updateQuery} articles={articles} onSelect={(article) => router.push(`/article/${article.slug}`)} />

      {showingSearch ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-slate-900">Search Results</h2>
            <span className="text-xs text-slate-500">
              {parsed.mode === 'topic' && parsed.topic ? `Topic #${parsed.topic}` : `Query: ${parsed.normalized}`} • {filtered.length} items
            </span>
          </div>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              No matching articles found. Try a broader query or a topic tag like <span className="font-semibold">#history</span>.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {!showingSearch ? (
        <>
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Trending Articles</h2>
              <span className="text-xs text-slate-500">{trending.length} items</span>
            </div>
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {trending.map((article) => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">Newest Content</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {newest.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
