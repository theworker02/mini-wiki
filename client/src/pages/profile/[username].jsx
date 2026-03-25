import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AnimatedWrapper from '../../components/AnimatedWrapper';
import UserCard from '../../components/UserCard';
import { getProfileByUsername, toggleFollowUser } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

function PublicProfilePage() {
  const { username } = useParams();
  const { isAuthenticated, user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggleLoading, setToggleLoading] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getProfileByUsername(username);
      setProfile(data);
    } catch (loadError) {
      setProfile(null);
      setError(loadError.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [username]);

  const onToggleFollow = async () => {
    if (!profile?.user?.username) return;
    setToggleLoading(true);

    try {
      const result = await toggleFollowUser(profile.user.username);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: result.following,
              followersCount: result.followersCount
            }
          : prev
      );
    } catch (toggleError) {
      alert(toggleError.response?.data?.error || 'Failed to update follow state');
    } finally {
      setToggleLoading(false);
    }
  };

  const canFollow =
    isAuthenticated &&
    profile?.user?.username &&
    user?.username &&
    profile.user.username.toLowerCase() !== user.username.toLowerCase();

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="skeleton h-5 w-48" />
        <div className="mt-3 skeleton h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-card">
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
        <UserCard profile={profile} onToggleFollow={canFollow ? onToggleFollow : null} toggleLoading={toggleLoading} />

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h3 className="text-lg font-bold text-slate-900">Discovery Stats</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs uppercase text-slate-500">Followers</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{profile.followersCount || 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs uppercase text-slate-500">Following</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{profile.followingCount || 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs uppercase text-slate-500">Most Liked</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{profile.topLiked?.[0]?.likes || 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs uppercase text-slate-500">Most Viewed</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {Math.max(...(profile.pages || []).map((page) => Number(page.views || 0)), 0)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h3 className="text-lg font-bold text-slate-900">Most Liked Content</h3>
          <div className="mt-3 space-y-2">
            {(profile.topLiked || []).map((article) => (
              <Link
                key={article.id}
                to={`/pages/${article.id}`}
                className="block rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-200"
              >
                <p className="font-semibold text-slate-900">{article.title}</p>
                <p className="text-xs text-slate-500">{article.likes} likes • {article.views} views</p>
              </Link>
            ))}
            {(profile.topLiked || []).length === 0 ? (
              <p className="text-sm text-slate-500">No liked content yet.</p>
            ) : null}
          </div>
        </section>
      </div>
    </AnimatedWrapper>
  );
}

export default PublicProfilePage;
