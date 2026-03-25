import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getMyProfile, loginUser, registerUser, setAuthToken, updateMyProfile } from '../utils/api';

const AuthContext = createContext(null);

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function applyProfileTheme(profile) {
  if (!profile) return;

  document.documentElement.style.setProperty('--accent-color', profile.accent_color || '#2563eb');
  document.body.classList.remove('theme-light', 'theme-dark', 'theme-custom');
  document.body.classList.add(`theme-${profile.theme || 'light'}`);
  document.body.setAttribute('data-card-style', profile.card_style || 'rounded');
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const refreshProfile = async () => {
    try {
      const data = await getMyProfile();
      setProfile(data.profile);
      applyProfileTheme(data.profile);
      return data;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('mini_wiki_token');
    if (!storedToken) {
      setInitializing(false);
      return;
    }

    const payload = decodeJwt(storedToken);
    if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
      localStorage.removeItem('mini_wiki_token');
      setInitializing(false);
      return;
    }

    setToken(storedToken);
    setUser({ id: payload.id, username: payload.username });
    setAuthToken(storedToken);

    refreshProfile().finally(() => {
      setInitializing(false);
    });
  }, []);

  const persistSession = async (authToken, authUser) => {
    setToken(authToken);
    setUser(authUser);
    setAuthToken(authToken);
    localStorage.setItem('mini_wiki_token', authToken);
    await refreshProfile();
  };

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    await persistSession(data.token, data.user);
    return data.user;
  };

  const register = async (credentials) => {
    const data = await registerUser(credentials);
    await persistSession(data.token, data.user);
    return data.user;
  };

  const saveProfile = async (changes) => {
    const updated = await updateMyProfile(changes);
    setProfile(updated);
    applyProfileTheme(updated);
    return updated;
  };

  const logout = () => {
    setToken('');
    setUser(null);
    setProfile(null);
    setAuthToken('');
    localStorage.removeItem('mini_wiki_token');
    document.documentElement.style.setProperty('--accent-color', '#2563eb');
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-custom');
    document.body.classList.add('theme-light');
  };

  const value = useMemo(
    () => ({
      token,
      user,
      profile,
      initializing,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshProfile,
      saveProfile
    }),
    [token, user, profile, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
