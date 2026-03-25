'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Article, summarizeMarkdown } from '@/lib/utils';

function ArticleCard({ article }: { article: Article }) {
  return (
    <motion.article whileHover={{ y: -3 }} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <Link href={`/article/${article.slug}`} className="block">
        <h3 className="line-clamp-1 text-lg font-bold text-slate-900">{article.title}</h3>
        {article.status !== 'published' ? (
          <p className="mt-1 inline-block rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
            {article.status === 'pending' ? 'Pending Approval' : 'Rejected'}
          </p>
        ) : null}
        <p className="mt-2 line-clamp-3 text-sm text-slate-600">{summarizeMarkdown(article.content)}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {article.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
              #{tag}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          @{article.authorUsername} • {article.views} views • {article.likes} likes
        </p>
      </Link>
    </motion.article>
  );
}

export default ArticleCard;
