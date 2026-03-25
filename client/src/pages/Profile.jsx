import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AnimatedWrapper from '../components/AnimatedWrapper';
import Modal from '../components/Modal';
import ProfileCustomizer from '../components/ProfileCustomizer';
import { getMyProfile } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function Profile() {
  const { user, profile, saveProfile } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    try {
      const data = await getMyProfile();
      setProfileData(data);
    } catch {
      setProfileData(null);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const onSave = async (changes) => {
    setSaving(true);
    try {
      await saveProfile(changes);
      await loadProfile();
      setCustomizerOpen(false);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatedWrapper>
      <div className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-2xl font-bold text-slate-900">Profile</h2>
          <p className="mt-1 text-sm text-slate-600">Customize your personal wiki workspace style and review engagement stats.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs uppercase text-slate-500">Username</p>
              <p className="mt-1 font-semibold text-slate-900">@{user?.username}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs uppercase text-slate-500">Theme</p>
              <p className="mt-1 font-semibold text-slate-900">{profile?.theme || 'light'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs uppercase text-slate-500">Card style</p>
              <p className="mt-1 font-semibold text-slate-900">{profile?.card_style || 'rounded'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCustomizerOpen(true)}
            className="mt-4 rounded-lg bg-[var(--accent-color)] px-4 py-2 font-semibold text-white"
          >
            Customize Profile
          </button>
          <Link
            to={`/profile/${user?.username || ''}`}
            className="ml-2 mt-4 inline-block rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            View Public Profile
          </Link>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h3 className="text-lg font-bold text-slate-900">Activity Stats</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs uppercase text-slate-500">Pages</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{profileData?.stats?.pages || 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs uppercase text-slate-500">Total Views</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{profileData?.stats?.totalViews || 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs uppercase text-slate-500">Total Likes</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{profileData?.stats?.totalLikes || 0}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {(profileData?.pages || []).map((page) => (
              <Link
                key={page.id}
                to={`/pages/${page.id}`}
                className="block rounded-lg border border-slate-200 p-3 text-sm text-slate-700 transition hover:border-[var(--accent-color)]/40 hover:bg-slate-50"
              >
                <p className="font-semibold text-slate-900">{page.title}</p>
                <p className="text-xs text-slate-500">{page.visibility} • {page.views} views • {page.likes} likes</p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <Modal
        open={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        title="Customize Profile"
        maxWidth="max-w-lg"
      >
        <ProfileCustomizer profile={profile} onSave={onSave} saving={saving} />
      </Modal>
    </AnimatedWrapper>
  );
}

export default Profile;
