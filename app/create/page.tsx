'use client';

import { useRouter } from 'next/navigation';
import Editor from '@/components/Editor';
import { useProfile } from '@/components/ProfileProvider';

export default function CreatePage() {
  const router = useRouter();
  const { username, role } = useProfile();

  if (role === 'pending') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-card">
        <h1 className="text-2xl font-bold text-slate-900">Verify Your Email</h1>
        <p className="mt-2 text-sm text-slate-600">Check your inbox to activate your account before creating articles.</p>
      </div>
    );
  }

  if (role === 'guest') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <h1 className="text-2xl font-bold text-slate-900">Sign In Required</h1>
        <p className="mt-2 text-sm text-slate-600">Sign in with a verified account to create articles.</p>
      </div>
    );
  }

  const onSubmit = async (payload: { title: string; content: string; tags: string }) => {
    const response = await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: payload.title,
        content: payload.content,
        tags: payload.tags.split(','),
        authorUsername: username
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create article');
    }

    router.push(`/article/${data.slug}`);
  };

  return <Editor mode="create" onSubmit={onSubmit} />;
}
