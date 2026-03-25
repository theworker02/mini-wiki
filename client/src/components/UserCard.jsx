import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function UserCard({ profile, onToggleFollow, toggleLoading = false }) {
  if (!profile) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Profile</p>
          <h2 className="text-2xl font-bold text-slate-900">@{profile.user.username}</h2>
          <p className="mt-1 text-sm text-slate-600">Member since {new Date(profile.user.created_at).toLocaleDateString()}</p>
        </div>

        {typeof onToggleFollow === 'function' ? (
          <button
            type="button"
            onClick={onToggleFollow}
            disabled={toggleLoading}
            className="rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {toggleLoading ? 'Updating...' : profile.isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs uppercase text-slate-500">Articles</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{profile.stats.pages}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs uppercase text-slate-500">Total Views</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{profile.stats.totalViews}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs uppercase text-slate-500">Total Likes</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{profile.stats.totalLikes}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {(profile.pages || []).slice(0, 8).map((article) => (
          <Link
            key={article.id}
            to={`/pages/${article.id}`}
            className="block rounded-lg border border-slate-200 p-3 text-sm transition hover:border-[var(--accent-color)]/50 hover:bg-slate-50"
          >
            <p className="font-semibold text-slate-900">{article.title}</p>
            <p className="text-xs text-slate-500">{article.likes} likes • {article.views} views</p>
          </Link>
        ))}
      </div>
    </motion.section>
  );
}

export default UserCard;
