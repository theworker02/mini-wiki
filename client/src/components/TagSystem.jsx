import { motion } from 'framer-motion';

function countTags(articles) {
  const map = new Map();
  (articles || []).forEach((article) => {
    (article.tags || []).forEach((tag) => {
      const key = String(tag || '').toLowerCase();
      if (!key) return;
      map.set(key, (map.get(key) || 0) + 1);
    });
  });

  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function countCategories(articles) {
  const map = new Map();
  (articles || []).forEach((article) => {
    const key = String(article.category || 'General');
    map.set(key, (map.get(key) || 0) + 1);
  });

  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function TagSystem({
  articles,
  selectedTag,
  onTagChange,
  selectedCategory,
  onCategoryChange
}) {
  const tags = countTags(articles).slice(0, 16);
  const categories = countCategories(articles);

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Categories</h3>
          <button
            type="button"
            onClick={() => onCategoryChange('')}
            className="text-xs font-semibold text-[var(--accent-color)]"
          >
            Clear
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map(([category, count]) => {
            const active = selectedCategory === category;
            return (
              <motion.button
                key={category}
                whileHover={{ y: -1 }}
                type="button"
                onClick={() => onCategoryChange(active ? '' : category)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  active
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200'
                }`}
              >
                {category} ({count})
              </motion.button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Tags</h3>
          <button
            type="button"
            onClick={() => onTagChange('')}
            className="text-xs font-semibold text-[var(--accent-color)]"
          >
            Clear
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.map(([tag, count]) => {
            const active = selectedTag === tag;
            return (
              <motion.button
                key={tag}
                whileHover={{ y: -1 }}
                type="button"
                onClick={() => onTagChange(active ? '' : tag)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  active
                    ? 'border-cyan-300 bg-cyan-50 text-cyan-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-cyan-200'
                }`}
              >
                #{tag} ({count})
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TagSystem;
