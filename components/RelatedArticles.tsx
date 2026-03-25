'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Article, createConnections, getRelatedArticles, summarizeMarkdown } from '@/lib/utils';

function ConnectedMap({ current, related }: { current: Article; related: Article[] }) {
  const graph = createConnections([current, ...related]);
  const width = 560;
  const height = 220;
  const radius = 85;
  const centerX = width / 2;
  const centerY = height / 2;

  const positions = new Map<string, { x: number; y: number }>();
  positions.set(current.slug, { x: centerX, y: centerY });

  related.forEach((article, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(related.length, 1);
    positions.set(article.slug, {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    });
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-900/95 p-3">
      <svg width={width} height={height} className="min-w-[560px]">
        {graph.edges.map((edge) => {
          const source = positions.get(edge.source);
          const target = positions.get(edge.target);
          if (!source || !target) return null;
          return (
            <line
              key={`${edge.source}-${edge.target}`}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke="#38bdf8"
              strokeOpacity={0.6}
              strokeWidth={1.8}
            />
          );
        })}

        {graph.nodes.map((node) => {
          const position = positions.get(node.id);
          if (!position) return null;
          const isCurrent = node.id === current.slug;
          return (
            <g key={node.id}>
              <circle cx={position.x} cy={position.y} r={isCurrent ? 11 : 8} fill={isCurrent ? '#22d3ee' : '#60a5fa'} />
              <text x={position.x + 12} y={position.y + 4} fill="#e2e8f0" fontSize="11">
                {node.label.slice(0, 30)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

type Props = {
  current: Article;
  allArticles: Article[];
};

function RelatedArticles({ current, allArticles }: Props) {
  const related = getRelatedArticles(current, allArticles).slice(0, 6);

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <h3 className="text-xl font-bold text-slate-900">Related Articles</h3>
      <p className="text-sm text-slate-600">Auto-suggested from title similarity, tags, and content keywords.</p>

      <ConnectedMap current={current} related={related.slice(0, 5)} />

      <div className="grid gap-3 sm:grid-cols-2">
        {related.length === 0 ? <p className="text-sm text-slate-500">No related articles yet.</p> : null}
        {related.map((article) => (
          <motion.div key={article.slug} whileHover={{ y: -2 }} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <Link href={`/article/${article.slug}`} className="block">
              <p className="font-semibold text-slate-900">{article.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{summarizeMarkdown(article.content)}</p>
              <p className="mt-2 text-xs text-slate-500">{article.tags.slice(0, 4).map((tag) => `#${tag}`).join(' ')}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default RelatedArticles;
