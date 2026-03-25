import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

function Sidebar({ pages, loading }) {
  const location = useLocation();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pages</h2>
        <Link
          to="/pages/new"
          className="rounded-md bg-[var(--accent-color)] px-2.5 py-1 text-xs font-semibold text-white"
        >
          New
        </Link>
      </div>

      {loading ? <p className="text-sm text-slate-500">Loading pages...</p> : null}
      {!loading && pages.length === 0 ? <p className="text-sm text-slate-500">No pages found.</p> : null}

      <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
        {pages.map((page) => {
          const active = location.pathname === `/pages/${page.id}`;

          return (
            <motion.div key={page.id} whileHover={{ y: -2 }}>
              <Link
                to={`/pages/${page.id}`}
                className={`block rounded-lg border p-3 transition ${
                  active
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-slate-200 hover:border-[var(--accent-color)]/50 hover:bg-slate-50'
                }`}
              >
                <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">{page.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-slate-600">{page.ai_summary}</p>
                <p className="mt-2 text-[11px] text-slate-500">{page.views} views • {page.likes} likes</p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default Sidebar;
