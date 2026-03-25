import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { addComment, getComments } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function Comments({ pageId, onCountChange }) {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getComments(pageId);
      setComments(data);
      onCountChange?.(data.length);
    } catch {
      setComments([]);
      onCountChange?.(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [pageId]);

  const submit = async () => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      const comment = await addComment({ pageId, content });
      setComments((prev) => {
        const next = [...prev, comment];
        onCountChange?.(next.length);
        return next;
      });
      setContent('');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <h3 className="text-lg font-bold text-slate-900">Discussion</h3>

      {loading ? <p className="mt-2 text-sm text-slate-500">Loading comments...</p> : null}
      {!loading && comments.length === 0 ? <p className="mt-2 text-sm text-slate-500">No comments yet.</p> : null}

      <div className="mt-3 space-y-2">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm text-slate-800">{comment.content}</p>
            <p className="mt-1 text-xs text-slate-500">
              <Link to={`/profile/${comment.username}`} className="font-semibold text-slate-600 hover:text-[var(--accent-color)]">
                @{comment.username}
              </Link>{' '}
              • {dayjs(comment.created_at).format('MMM D, YYYY h:mm A')}
            </p>
          </div>
        ))}
      </div>

      {isAuthenticated ? (
        <div className="mt-3">
          <textarea
            rows={3}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write your thoughts..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[var(--accent-color)] focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="button"
            disabled={posting}
            onClick={submit}
            className="mt-2 rounded-lg bg-[var(--accent-color)] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {posting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Login to participate in comments.</p>
      )}
    </section>
  );
}

export default Comments;
