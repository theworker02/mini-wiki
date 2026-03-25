import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AnimatedWrapper from '../components/AnimatedWrapper';
import { getLore } from '../utils/api';

function LorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const keyword = searchParams.get('keyword') || '';

  useEffect(() => {
    setLoading(true);
    getLore(keyword)
      .then((data) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [keyword]);

  const grouped = useMemo(() => {
    const byLetter = {};
    items.forEach((item) => {
      const letter = item.keyword.charAt(0).toUpperCase();
      if (!byLetter[letter]) byLetter[letter] = [];
      byLetter[letter].push(item);
    });
    return Object.entries(byLetter).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  return (
    <AnimatedWrapper>
      <div className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-2xl font-bold text-slate-900">Knowledge Base / Lore</h2>
          <p className="mt-2 text-sm text-slate-600">
            Browse the global glossary extracted from all wiki articles and jump directly to related content.
          </p>

          <input
            value={keyword}
            onChange={(event) => {
              const value = event.target.value;
              setSearchParams(value ? { keyword: value } : {});
            }}
            placeholder="Filter keyword"
            className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[var(--accent-color)] focus:ring-2 focus:ring-blue-100"
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          {loading ? <p className="text-sm text-slate-500">Loading glossary...</p> : null}
          {!loading && grouped.length === 0 ? <p className="text-sm text-slate-500">No glossary entries yet.</p> : null}

          <div className="space-y-4">
            {grouped.map(([letter, entries]) => (
              <div key={letter}>
                <h3 className="mb-2 text-lg font-bold text-slate-900">{letter}</h3>
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div key={entry.keyword} className="rounded-lg border border-slate-200 p-3">
                      <p className="font-semibold text-slate-900">{entry.keyword}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {entry.related_pages.map((page) => (
                          <Link
                            key={page.id}
                            to={`/pages/${page.id}`}
                            className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700"
                          >
                            {page.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AnimatedWrapper>
  );
}

export default LorePage;
