'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

type AuthProvider = {
  id: string;
  name: string;
};

export default function SignInPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [providers, setProviders] = useState<Record<string, AuthProvider>>({});

  useEffect(() => {
    let active = true;

    const loadProviders = async () => {
      const response = await fetch('/api/auth/providers', { cache: 'no-store' });
      const payload = (await response.json().catch(() => ({}))) as Record<string, AuthProvider>;

      if (!active || !response.ok) {
        return;
      }

      setProviders(payload);
    };

    loadProviders().catch(() => {
      if (active) {
        setProviders({});
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('error') === 'google_auth') {
      setError('Google sign-in could not be completed. Please try again.');
    }
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier,
        password
      })
    });
    await response.json().catch(() => ({}));

    setLoading(false);

    if (!response.ok) {
      setError('Invalid credentials. Please try again.');
      return;
    }

    router.push('/');
    router.refresh();
  };

  const hasGoogleProvider = Boolean(providers.google);

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <h1 className="text-2xl font-bold text-slate-900">Sign In</h1>
      <p className="mt-1 text-sm text-slate-600">Access your Mini Wiki account.</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <input
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="Username or email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--theme-color)]"
          autoComplete="username"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--theme-color)]"
          autoComplete="current-password"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--theme-color)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      {hasGoogleProvider ? (
        <>
          <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            <span>or</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={() => {
              window.location.href = '/api/auth/google';
            }}
            className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Continue with Google
          </button>
        </>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <p className="mt-4 text-sm text-slate-600">
        No account yet?{' '}
        <Link href="/signup" className="font-semibold text-[var(--theme-color)] hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
