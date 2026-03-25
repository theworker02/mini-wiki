import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { buildPageSuggestions } from '../utils/search';

function SearchBar({ value, onChange, pages }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);

  const suggestions = useMemo(
    () => buildPageSuggestions(pages, value, 7),
    [pages, value]
  );

  useEffect(() => {
    const handler = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <label htmlFor="search" className="mb-1 block text-sm font-semibold text-slate-700">
        Search
      </label>

      <input
        id="search"
        type="text"
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        placeholder="Search title, content, tags..."
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[var(--accent-color)] focus:ring-2 focus:ring-blue-100"
      />

      {open && value.trim() ? (
        <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1">
          {suggestions.length === 0 ? (
            <p className="px-2 py-2 text-xs text-slate-500">No matching pages.</p>
          ) : (
            suggestions.map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => {
                  navigate(`/pages/${page.id}`);
                  setOpen(false);
                }}
                className="w-full rounded-md px-2 py-2 text-left transition hover:bg-slate-100"
              >
                <p className="line-clamp-1 text-sm font-semibold text-slate-800">{page.title}</p>
                <p className="line-clamp-1 text-xs text-slate-500">
                  {(page.tags || []).slice(0, 3).map((tag) => `#${tag}`).join(' ')}
                </p>
              </button>
            ))
          )}
        </div>
      ) : null}
    </motion.div>
  );
}

export default SearchBar;
