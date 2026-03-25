import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedWrapper from '../components/AnimatedWrapper';
import AdvancedSearch from '../components/AdvancedSearch';
import { getPages } from '../utils/api';

function DiscoverySection({ title, description, articles }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {articles.length === 0 ? <p className="text-sm text-slate-500">No articles available in this section.</p> : null}
        {articles.map((article) => (
          <motion.div key={article.id} whileHover={{ y: -3 }}>
            <Link
              to={`/pages/${article.id}`}
              className="soft-hover block rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <p className="font-semibold text-slate-900">{article.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{article.ai_summary}</p>
              <p className="mt-2 text-xs text-slate-500">
                {article.category || 'General'} • {article.views} views • {article.likes} likes
              </p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function DiscoverPage() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    getPages('')
      .then((data) => setArticles(Array.isArray(data) ? data : []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  const trending = useMemo(() => {
    return [...articles]
      .sort((a, b) => (Number(b.likes || 0) * 2 + Number(b.views || 0)) - (Number(a.likes || 0) * 2 + Number(a.views || 0)))
      .slice(0, 6);
  }, [articles]);

  const mostConnected = useMemo(() => {
    return [...articles]
      .sort((a, b) => (b.related_articles?.length || 0) - (a.related_articles?.length || 0))
      .slice(0, 6);
  }, [articles]);

  const newest = useMemo(() => {
    return [...articles]
      .sort((a, b) => new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime())
      .slice(0, 6);
  }, [articles]);

  const openRandomArticle = () => {
    if (articles.length === 0) return;
    const random = articles[Math.floor(Math.random() * articles.length)];
    navigate(`/pages/${random.id}`);
  };

  return (
    <AnimatedWrapper>
      <div className="space-y-4">
        <section className="glass-card rounded-2xl p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-color)]">Discover</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Explore the Knowledge Network</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Find trending ideas, highly connected topics, and fresh updates across the wiki graph.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openRandomArticle}
              className="rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
            >
              Random Exploration
            </button>
            <Link
              to="/graph"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Open Knowledge Graph
            </Link>
          </div>
        </section>

        <AdvancedSearch
          value={search}
          onChange={setSearch}
          articles={articles}
          onSelect={(article) => navigate(`/pages/${article.id}`)}
        />

        {loading ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="skeleton h-5 w-40" />
            <div className="mt-3 grid gap-2">
              <div className="skeleton h-14 w-full" />
              <div className="skeleton h-14 w-full" />
              <div className="skeleton h-14 w-full" />
            </div>
          </section>
        ) : (
          <>
            <DiscoverySection
              title="Trending Articles"
              description="Ranked by a blended engagement signal of likes and views."
              articles={trending}
            />
            <DiscoverySection
              title="Most Connected"
              description="Articles with the highest number of explicit relationships."
              articles={mostConnected}
            />
            <DiscoverySection
              title="Newest Content"
              description="Recently created or updated pages in your knowledge base."
              articles={newest}
            />
          </>
        )}
      </div>
    </AnimatedWrapper>
  );
}

export default DiscoverPage;
