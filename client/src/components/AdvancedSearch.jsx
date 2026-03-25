import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { highlightText, searchArticles } from '../utils/searchEngine';

function Highlighted({ text, query }) {
  const parts = highlightText(text, query);

  return (
    <>
      {parts.map((part, index) =>
        part.match ? (
          <mark key={`${part.text}-${index}`} className="rounded bg-blue-100 px-0.5 text-blue-800">
            {part.text}
          </mark>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        )
      )}
    </>
  );
}

function AdvancedSearch({ value, onChange, articles, onSelect }) {
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);

  const results = useMemo(() => searchArticles(value, articles, 8), [value, articles]);

  useEffect(() => {
    const close = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <label htmlFor="advanced-search" className="mb-1 block text-sm font-semibold text-slate-700">
        Advanced Search
      </label>

      <input
        id="advanced-search"
        type="text"
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        placeholder="Search title, tags, category, content..."
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[var(--accent-color)] focus:ring-2 focus:ring-blue-100"
      />

      {open && value.trim() ? (
        <motion.div
          className="mt-2 max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {results.length === 0 ? <p className="px-2 py-2 text-xs text-slate-500">No matching articles.</p> : null}

          {results.map((article) => (
            <button
              key={article.id}
              type="button"
              onClick={() => {
                setOpen(false);
                if (typeof onSelect === 'function') {
                  onSelect(article);
                }
              }}
              className="w-full rounded-md px-2 py-2 text-left transition hover:bg-slate-100"
            >
              <p className="line-clamp-1 text-sm font-semibold text-slate-800">
                <Highlighted text={article.title} query={value} />
              </p>
              <p className="line-clamp-1 text-xs text-slate-500">
                <Highlighted text={(article.tags || []).map((tag) => `#${tag}`).join(' ')} query={value} />
                {article.category ? ` • ${article.category}` : ''}
              </p>
            </button>
          ))}
        </motion.div>
      ) : null}
    </motion.div>
  );
}

export default AdvancedSearch;
