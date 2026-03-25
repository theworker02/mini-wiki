import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import AnimatedWrapper from '../components/AnimatedWrapper';
import PageView from '../components/PageView';
import LikeButton from '../components/LikeButton';
import ViewCounter from '../components/ViewCounter';
import Comments from '../components/Comments';
import ArticleStats from '../components/ArticleStats';
import { SOCKET_BASE_URL, generateSummary, getPage, getPages, likePage, updatePage } from '../utils/api';
import { getRelatedArticles } from '../utils/recommendationEngine';
import { useAuth } from '../context/AuthContext';

function View({ onUpdated }) {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [page, setPage] = useState(null);
  const [allPages, setAllPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [liking, setLiking] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);

  const canEdit = Boolean(page?.canEdit);

  useEffect(() => {
    const socket = io(SOCKET_BASE_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.emit('join-page', { pageId: id });

    socket.on('remote-like-update', ({ likes }) => {
      setPage((prev) => (prev ? { ...prev, likes } : prev));
    });

    socket.on('remote-view-update', ({ views }) => {
      setPage((prev) => (prev ? { ...prev, views } : prev));
    });

    return () => {
      socket.emit('leave-page', { pageId: id });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [id]);

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const [pageData, pagesData] = await Promise.all([getPage(id), getPages('')]);
      setPage(pageData);
      setAllPages(Array.isArray(pagesData) ? pagesData : []);
      socketRef.current?.emit('view-update', { pageId: id, views: pageData.views });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load page');
      setAllPages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCommentsCount(0);
    load();
  }, [id]);

  const relatedLinks = useMemo(() => {
    if (Array.isArray(page?.related_page_details) && page.related_page_details.length > 0) {
      return page.related_page_details;
    }

    return (page?.related_articles || []).map((relatedId) => ({ id: relatedId, title: relatedId }));
  }, [page]);

  const recommendedArticles = useMemo(() => {
    if (!page) return [];

    const manualLinkedIds = new Set((page.related_articles || []).map((item) => String(item)));

    return getRelatedArticles(page, allPages)
      .filter((candidate) => !manualLinkedIds.has(String(candidate.id)))
      .slice(0, 4);
  }, [page, allPages]);

  const onLike = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setLiking(true);
    try {
      const result = await likePage(id);
      setPage((prev) => (prev ? { ...prev, likes: result.likes } : prev));
      socketRef.current?.emit('like-update', { pageId: id, likes: result.likes });
      onUpdated?.();
    } catch (likeError) {
      alert(likeError.response?.data?.error || 'Failed to like page');
    } finally {
      setLiking(false);
    }
  };

  const onGenerateSummary = async () => {
    if (!canEdit) {
      alert('Only owners can generate and save summaries.');
      return;
    }

    setGenerating(true);
    try {
      const generated = await generateSummary(page.content);
      const updated = await updatePage(page.id, {
        title: page.title,
        content: page.content,
        tags: page.tags,
        category: page.category,
        visibility: page.visibility,
        ai_summary: generated.summary,
        related_articles: page.related_articles
      });
      setPage(updated);
      onUpdated?.();
    } catch (summaryError) {
      alert(summaryError.response?.data?.error || 'Failed to generate summary');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="skeleton h-5 w-40" />
        <div className="mt-3 skeleton h-4 w-full" />
        <div className="mt-2 skeleton h-4 w-10/12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-6 shadow-card">
        <p className="text-red-600">{error}</p>
        <Link to="/" className="mt-3 inline-block text-sm font-semibold text-[var(--accent-color)]">
          Return home
        </Link>
      </div>
    );
  }

  return (
    <AnimatedWrapper>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <ViewCounter views={page.views} />
          <LikeButton likes={page.likes} onLike={onLike} disabled={liking} />
          <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-sm font-semibold text-cyan-700">
            {page.category || 'General'}
          </span>

          {canEdit ? (
            <Link
              to={`/pages/${page.id}/edit`}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Edit in Modal
            </Link>
          ) : null}
          {canEdit ? (
            <button
              type="button"
              onClick={onGenerateSummary}
              disabled={generating}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {generating ? 'Generating...' : 'Generate Summary'}
            </button>
          ) : null}
        </div>

        <PageView page={page} />

        <ArticleStats page={page} commentsCount={commentsCount} />

        <section className="glass-card rounded-xl p-5 shadow-card">
          <h3 className="text-lg font-bold text-slate-900">Related Articles</h3>

          <div className="mt-2 flex flex-wrap gap-2">
            {relatedLinks.length === 0 ? <span className="text-sm text-slate-500">No linked articles yet.</span> : null}
            {relatedLinks.map((related) => (
              <Link
                key={related.id}
                to={`/pages/${related.id}`}
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700"
              >
                {related.title}
              </Link>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {recommendedArticles.map((article) => (
              <motion.div
                key={article.id}
                whileHover={{ y: -3 }}
                className="soft-hover rounded-xl border border-slate-200 bg-white/85 p-4"
              >
                <Link to={`/pages/${article.id}`} className="block">
                  <p className="font-semibold text-slate-900">{article.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{article.ai_summary}</p>
                  <p className="mt-2 text-xs font-semibold text-blue-700">
                    Match: {Math.round(article.recommendationScore * 100)}%
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{article.recommendationReasons.join(' • ')}</p>
                </Link>
              </motion.div>
            ))}
            {recommendedArticles.length === 0 ? (
              <p className="text-sm text-slate-500">No AI-related suggestions yet. Add more connected content to improve suggestions.</p>
            ) : null}
          </div>
        </section>

        <Comments pageId={id} onCountChange={setCommentsCount} />
      </div>
    </AnimatedWrapper>
  );
}

export default View;
