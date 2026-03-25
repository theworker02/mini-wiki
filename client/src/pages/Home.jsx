import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedWrapper from '../components/AnimatedWrapper';

function Home({ pages }) {
  return (
    <AnimatedWrapper>
      <div className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent-color)]">Mini Wiki Platform</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Connected knowledge, polished experience</h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            Build articles, map relationships, browse lore, and track engagement with a modern, animated SaaS-style wiki experience.
          </p>
          <Link
            to="/pages/new"
            className="mt-4 inline-block rounded-lg bg-[var(--accent-color)] px-4 py-2 font-semibold text-white"
          >
            Create page
          </Link>
          <Link
            to="/discover"
            className="ml-2 mt-4 inline-block rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Discover
          </Link>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h3 className="text-lg font-bold text-slate-900">Recently updated</h3>
          {pages.length === 0 ? <p className="mt-2 text-sm text-slate-500">No pages available yet.</p> : null}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {pages.slice(0, 8).map((page) => (
              <motion.div key={page.id} whileHover={{ y: -3 }}>
                <Link
                  to={`/pages/${page.id}`}
                  className="block rounded-xl border border-slate-200 p-4 transition hover:border-[var(--accent-color)]/40 hover:bg-slate-50"
                >
                  <h4 className="line-clamp-1 font-semibold text-slate-900">{page.title}</h4>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{page.ai_summary}</p>
                  <p className="mt-2 text-xs text-slate-500">{page.views} views • {page.likes} likes</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </AnimatedWrapper>
  );
}

export default Home;
