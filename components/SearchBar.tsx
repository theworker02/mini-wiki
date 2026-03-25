'use client';

import { useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { Article, parseSearchQuery, sanitizeText } from '@/lib/utils';

type Props = {
  value: string;
  onChange: (value: string) => void;
  articles: Article[];
  onSelect: (article: Article) => void;
};

function Highlight({ text, query }: { text: string; query: string }) {
  const safe = sanitizeText(query, 80).toLowerCase();
  if (!safe || safe.startsWith('#')) return <>{text}</>;

  const index = text.toLowerCase().indexOf(safe);
  if (index < 0) return <>{text}</>;

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-yellow-100 px-0.5 text-slate-900">{text.slice(index, index + safe.length)}</mark>
      {text.slice(index + safe.length)}
    </>
  );
}

function SearchBar({ value, onChange, articles, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const parsed = useMemo(() => parseSearchQuery(value), [value]);

  const suggestions = useMemo(() => {
    if (!parsed.normalized) return [];

    if (parsed.mode === 'topic' && parsed.topic) {
      return articles
        .filter((article) => article.tags.some((tag) => tag.toLowerCase() === parsed.topic))
        .slice(0, 8);
    }

    const fuse = new Fuse(articles, {
      threshold: 0.35,
      includeScore: true,
      keys: [
        { name: 'title', weight: 0.45 },
        { name: 'content', weight: 0.35 },
        { name: 'tags', weight: 0.2 }
      ]
    });

    return fuse.search(parsed.normalized).slice(0, 8).map((result) => result.item);
  }, [articles, parsed]);

  return (
    <div className="relative">
      <div className="relative">
        <input
          value={value}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            onChange(sanitizeText(event.target.value, 120));
            setOpen(true);
          }}
          placeholder="Search title/content or #topic (example: #history)..."
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-32 text-sm outline-none focus:border-[var(--theme-color)] focus:ring-2 focus:ring-blue-100"
          aria-label="Search articles"
        />

        {parsed.mode === 'topic' && parsed.topic ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-700">
            Topic: #{parsed.topic}
          </span>
        ) : null}
      </div>

      {open && parsed.normalized ? (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-card">
          {suggestions.length === 0 ? <p className="p-2 text-xs text-slate-500">No matches</p> : null}
          {suggestions.map((article) => (
            <button
              key={article.slug}
              type="button"
              onClick={() => onSelect(article)}
              className="w-full rounded-md px-2 py-2 text-left hover:bg-slate-100"
            >
              <p className="line-clamp-1 text-sm font-semibold text-slate-900">
                <Highlight text={article.title} query={parsed.normalized} />
              </p>
              <p className="line-clamp-1 text-xs text-slate-500">{article.tags.slice(0, 3).map((tag) => `#${tag}`).join(' ')}</p>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default SearchBar;
