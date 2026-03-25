'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

export default function SignUpPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setPreviewUrl('');

    const registerResponse = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const payload = await registerResponse.json().catch(() => ({}));

    if (!registerResponse.ok) {
      setLoading(false);
      setError(payload.error || 'Unable to sign up.');
      return;
    }

    setLoading(false);
    setMessage(payload.message || 'Check your email to verify your account');
    setPreviewUrl(typeof payload.previewUrl === 'string' ? payload.previewUrl : '');
    setPassword('');
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <h1 className="text-2xl font-bold text-slate-900">Sign Up</h1>
      <p className="mt-1 text-sm text-slate-600">Create your Mini Wiki account.</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Username"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--theme-color)]"
          autoComplete="username"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--theme-color)]"
          autoComplete="email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password (8+ characters)"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--theme-color)]"
          autoComplete="new-password"
          minLength={8}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--theme-color)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      {message ? (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <p>{message}</p>
          <p className="mt-1 text-emerald-700">Your account stays in pending status until you verify your email.</p>
          {previewUrl ? (
            <a href={previewUrl} className="mt-2 inline-block font-semibold text-emerald-800 underline">
              Open verification link
            </a>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <p className="mt-4 text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/signin" className="font-semibold text-[var(--theme-color)] hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}
