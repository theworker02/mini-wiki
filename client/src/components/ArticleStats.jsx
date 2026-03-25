function estimateReadTime(content) {
  const words = String(content || '').trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return minutes;
}

function computeEngagement(page, commentsCount = 0) {
  const views = Number(page?.views || 0);
  const likes = Number(page?.likes || 0);

  if (views === 0 && likes === 0 && commentsCount === 0) return 0;

  const raw = likes * 4 + commentsCount * 3 + views * 0.5;
  return Math.min(100, Math.round(raw / 5));
}

function MetricCard({ label, value, tone = 'text-slate-900' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function ArticleStats({ page, commentsCount = 0 }) {
  const readTime = estimateReadTime(page?.content);
  const engagement = computeEngagement(page, commentsCount);
  const engagementWidth = `${engagement}%`;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <h3 className="text-lg font-bold text-slate-900">Article Insights</h3>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Views" value={page?.views || 0} />
        <MetricCard label="Likes" value={page?.likes || 0} />
        <MetricCard label="Read Time" value={`${readTime} min`} />
        <MetricCard label="Engagement" value={`${engagement}/100`} tone="text-blue-700" />
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
          <span>Engagement Score</span>
          <span>{engagement}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-200">
          <div
            style={{ width: engagementWidth }}
            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
          />
        </div>
      </div>
    </section>
  );
}

export default ArticleStats;
