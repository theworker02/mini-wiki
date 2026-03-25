import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLore } from '../utils/api';

function LoreSidebar() {
  const [lore, setLore] = useState([]);

  useEffect(() => {
    getLore()
      .then((data) => setLore(data.slice(0, 14)))
      .catch(() => setLore([]));
  }, []);

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 shadow-card">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Knowledge Base</h2>
        <Link to="/lore" className="text-xs font-semibold text-[var(--accent-color)]">
          View all
        </Link>
      </div>
      <div className="space-y-1">
        {lore.length === 0 ? <p className="text-xs text-slate-500">No indexed terms yet.</p> : null}
        {lore.map((item) => (
          <Link
            key={item.keyword}
            to={`/lore?keyword=${encodeURIComponent(item.keyword)}`}
            className="block rounded-md px-2 py-1 text-sm text-slate-700 transition hover:bg-slate-100"
          >
            {item.keyword} <span className="text-xs text-slate-400">({item.related_pages.length})</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default LoreSidebar;
