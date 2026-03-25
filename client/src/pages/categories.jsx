import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AnimatedWrapper from '../components/AnimatedWrapper';
import TagSystem from '../components/TagSystem';
import { getPages } from '../utils/api';
import { CATEGORIES, normalizeCategory } from '../data/categories';

function CategoriesPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    setLoading(true);
    getPages('')
      .then((data) => {
        const normalized = (Array.isArray(data) ? data : []).map((page) => ({
          ...page,
          category: normalizeCategory(page.category || 'General')
        }));
        setArticles(normalized);
      })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return articles.filter((article) => {
      const categoryMatches = !selectedCategory || article.category === selectedCategory;
      const tagMatches = !selectedTag || (article.tags || []).map((tag) => tag.toLowerCase()).includes(selectedTag);
      return categoryMatches && tagMatches;
    });
  }, [articles, selectedCategory, selectedTag]);

  const countsByCategory = useMemo(() => {
    const counts = new Map(CATEGORIES.map((item) => [item.name, 0]));
    articles.forEach((article) => {
      const category = normalizeCategory(article.category);
      counts.set(category, (counts.get(category) || 0) + 1);
    });
    return counts;
  }, [articles]);

  return (
    <AnimatedWrapper>
      <div className="space-y-4">
        <section className="glass-card rounded-2xl p-6 shadow-card">
          <h2 className="text-2xl font-bold text-slate-900">Category Browser</h2>
          <p className="mt-2 text-sm text-slate-600">
            Browse the knowledge base by category and tags to quickly discover related content clusters.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((category) => {
              const active = selectedCategory === category.name;
              const count = countsByCategory.get(category.name) || 0;
              return (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => setSelectedCategory(active ? '' : category.name)}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    active
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200'
                  }`}
                >
                  <p className="font-semibold text-slate-900">{category.name}</p>
                  <p className="text-xs text-slate-500">{count} articles</p>
                </button>
              );
            })}
          </div>
        </section>

        <TagSystem
          articles={articles}
          selectedTag={selectedTag}
          onTagChange={setSelectedTag}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-slate-900">Filtered Articles</h3>
            <p className="text-sm text-slate-500">{filtered.length} results</p>
          </div>

          {loading ? (
            <div className="mt-3 space-y-2">
              <div className="skeleton h-14 w-full" />
              <div className="skeleton h-14 w-full" />
              <div className="skeleton h-14 w-full" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No articles found for this filter.</p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {filtered.map((article) => (
                <Link
                  key={article.id}
                  to={`/pages/${article.id}`}
                  className="soft-hover rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="font-semibold text-slate-900">{article.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{article.ai_summary}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {article.category || 'General'} • {(article.tags || []).slice(0, 3).map((tag) => `#${tag}`).join(' ')}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AnimatedWrapper>
  );
}

export default CategoriesPage;
