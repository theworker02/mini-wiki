'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { sanitizeThemeColor, sanitizeUsername } from '@/lib/utils';
import { useProfile } from './ProfileProvider';

function Navbar() {
  const { username, themeColor, role, isAuthenticated, authStatus, setProfile, promoteToEditor, signOutUser } = useProfile();
  const [draftName, setDraftName] = useState(username);
  const [draftColor, setDraftColor] = useState(themeColor);
  const [promoteUser, setPromoteUser] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setDraftName(username);
  }, [username]);

  useEffect(() => {
    setDraftColor(themeColor);
  }, [themeColor]);

  const onSave = async () => {
    setSaving(true);
    setError('');
    try {
      await setProfile({
        username: sanitizeUsername(draftName.trim() || 'guest'),
        themeColor: sanitizeThemeColor(draftColor)
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const onPromote = async () => {
    if (role !== 'admin') return;
    setSaving(true);
    setError('');
    try {
      await promoteToEditor(promoteUser);
      setPromoteUser('');
    } catch (promoteError) {
      setError(promoteError instanceof Error ? promoteError.message : 'Failed to promote user');
    } finally {
      setSaving(false);
    }
  };

  const canCreate = role === 'user' || role === 'editor' || role === 'admin';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="group flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-slate-100" aria-label="Go to homepage">
            <span className="h-7 w-7 overflow-hidden rounded-sm">
              <Image src="/mini-wiki.png" alt="Mini Wiki logo" width={28} height={28} className="h-7 w-7 scale-110 object-cover" priority />
            </span>
            <span className="text-lg font-bold text-slate-900 transition-colors group-hover:text-[var(--theme-color)]">Mini Wiki</span>
          </Link>

          {canCreate ? (
            <Link href="/create" className="rounded-lg bg-[var(--theme-color)] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-95">
              Create
            </Link>
          ) : role === 'pending' ? (
            <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
              Verify Email
            </span>
          ) : (
            <Link href="/signin" className="rounded-lg bg-[var(--theme-color)] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-95">
              Create
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          {authStatus === 'loading' ? (
            <span className="text-xs font-semibold text-slate-500">Checking session...</span>
          ) : null}

          {isAuthenticated ? (
            <>
              <input
                value={draftColor}
                onChange={(event) => setDraftColor(event.target.value)}
                className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white"
                type="color"
                aria-label="Theme color"
              />
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
              >
                {saving ? 'Saving...' : `@${username}`}
              </button>
              <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600">role: {role}</span>

              {role === 'admin' ? (
                <>
                  <input
                    value={promoteUser}
                    onChange={(event) => setPromoteUser(event.target.value)}
                    placeholder="promote user"
                    className="w-28 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:border-[var(--theme-color)]"
                  />
                  <button
                    type="button"
                    onClick={onPromote}
                    className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    Promote
                  </button>
                </>
              ) : null}

              <button
                type="button"
                onClick={signOutUser}
                className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-[var(--theme-color)] px-3 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-95"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
      {isAuthenticated && role === 'pending' ? (
        <p className="mx-auto max-w-7xl px-4 pb-2 text-xs font-medium text-amber-700">
          Check your email to verify your account. Pending users can browse, but cannot create or request edits yet.
        </p>
      ) : null}
      {error ? <p className="mx-auto max-w-7xl px-4 pb-2 text-xs text-red-600">{error}</p> : null}
    </header>
  );
}

export default Navbar;
