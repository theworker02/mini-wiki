'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { UserRole, sanitizeThemeColor, sanitizeUsername } from '@/lib/utils';

type ProfileState = {
  username: string;
  themeColor: string;
  role: UserRole;
  isAuthenticated: boolean;
  authStatus: 'loading' | 'authenticated' | 'unauthenticated';
  setProfile: (next: { username: string; themeColor: string }) => Promise<void>;
  promoteToEditor: (targetUsername: string) => Promise<void>;
  signOutUser: () => Promise<void>;
};

const ProfileContext = createContext<ProfileState | null>(null);

const DEFAULT_USERNAME = 'guest';
const DEFAULT_THEME = '#2563eb';
const DEFAULT_ROLE: UserRole = 'guest';

function ProfileProviderInner({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState(DEFAULT_USERNAME);
  const [themeColor, setThemeColor] = useState(DEFAULT_THEME);
  const [role, setRole] = useState<UserRole>(DEFAULT_ROLE);
  const [status, setStatus] = useState<ProfileState['authStatus']>('loading');

  const loadSession = async () => {
    setStatus('loading');

    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      const sessionUser = payload?.user as
        | { username?: string; name?: string; email?: string; role?: UserRole }
        | undefined;

      if (!response.ok || !sessionUser) {
        setUsername(DEFAULT_USERNAME);
        setRole(DEFAULT_ROLE);
        setStatus('unauthenticated');
        return;
      }

      const resolved = sanitizeUsername(sessionUser.username || sessionUser.name || sessionUser.email?.split('@')[0] || 'user');
      setUsername(resolved);
      setRole((sessionUser.role as UserRole) || 'user');
      setStatus('authenticated');

      fetch(`/api/profiles/${encodeURIComponent(resolved)}`, { cache: 'no-store' })
        .then((profileResponse) => profileResponse.json())
        .then((profile) => {
          if (profile?.themeColor) {
            const safeTheme = sanitizeThemeColor(profile.themeColor);
            setThemeColor(safeTheme);
            localStorage.setItem('miniwiki_theme', safeTheme);
          }
          if (profile?.role) {
            setRole(profile.role as UserRole);
          }
        })
        .catch(() => undefined);
    } catch {
      setUsername(DEFAULT_USERNAME);
      setRole(DEFAULT_ROLE);
      setStatus('unauthenticated');
    }
  };

  useEffect(() => {
    const storedColor = localStorage.getItem('miniwiki_theme');
    if (storedColor) setThemeColor(sanitizeThemeColor(storedColor));
  }, []);

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', themeColor);
  }, [themeColor]);

  const setProfile = async (next: { username: string; themeColor: string }) => {
    const safeTheme = sanitizeThemeColor(next.themeColor);
    const activeUsername = status === 'authenticated' ? username : 'guest';

    const response = await fetch(`/api/profiles/${encodeURIComponent(activeUsername)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themeColor: safeTheme })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'Unable to save profile');
    }

    const saved = await response.json().catch(() => ({}));
    const persistedTheme = sanitizeThemeColor(saved.themeColor || safeTheme);

    setThemeColor(persistedTheme);
    setRole((saved.role as UserRole) || (status === 'authenticated' ? 'user' : 'guest'));

    localStorage.setItem('miniwiki_theme', persistedTheme);
  };

  const promoteToEditor = async (targetUsername: string) => {
    const safeTarget = sanitizeUsername(targetUsername);
    if (!safeTarget || role !== 'admin') return;

    const response = await fetch(`/api/profiles/${encodeURIComponent(safeTarget)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorUsername: username, role: 'editor' })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'Unable to promote user');
    }
  };

  const signOutUser = async () => {
    await fetch('/api/auth/session', { method: 'DELETE' });
    setUsername(DEFAULT_USERNAME);
    setRole(DEFAULT_ROLE);
    setStatus('unauthenticated');
  };

  const value = useMemo(
    () => ({
      username,
      themeColor,
      role,
      isAuthenticated: status === 'authenticated',
      authStatus: status,
      setProfile,
      promoteToEditor,
      signOutUser
    }),
    [username, themeColor, role, status]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  return <ProfileProviderInner>{children}</ProfileProviderInner>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used inside ProfileProvider');
  return context;
}
