'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Editor from '@/components/Editor';
import { useProfile } from '@/components/ProfileProvider';
import { Article } from '@/lib/utils';

export default function EditPage() {
  const router = useRouter();
  const { username, role } = useProfile();
  const params = useParams<{ slug: string }>();
  const slug = String(params.slug || '');

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!slug) {
        router.push('/');
        return;
      }
      if (role !== 'editor' && role !== 'admin') {
        router.push(`/article/${slug}`);
        return;
      }
      setLoading(true);
      const response = await fetch(`/api/articles/${encodeURIComponent(slug)}?username=${encodeURIComponent(username)}`, {
        cache: 'no-store'
      });
      const data = await response.json();
      if (!response.ok) {
        router.push('/');
        return;
      }
      setArticle(data);
      setLoading(false);
    };

    load();
  }, [slug, router, role, username]);

  const onSubmit = async (payload: { title: string; content: string; tags: string }) => {
    const response = await fetch(`/api/articles/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: payload.title,
        content: payload.content,
        tags: payload.tags.split(','),
        editorUsername: username
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update article');
    }

    router.push(`/article/${data.slug}`);
  };

  const onDelete = async () => {
    if (!confirm('Delete this article permanently?')) return;

    const response = await fetch(`/api/articles/${encodeURIComponent(slug)}?username=${encodeURIComponent(username)}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete article');
    }
    router.push('/');
  };

  return (
    <Editor
      mode="edit"
      loading={loading}
      initialValue={
        article
          ? {
              title: article.title,
              content: article.content,
              tags: article.tags.join(', ')
            }
          : undefined
      }
      onSubmit={onSubmit}
      onDelete={onDelete}
    />
  );
}
