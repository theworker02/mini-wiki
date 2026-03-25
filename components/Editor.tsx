'use client';

import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { safeMarkdownUrl, sanitizeText, summarizeMarkdown } from '@/lib/utils';

type EditorValues = {
  title: string;
  content: string;
  tags: string;
};

type Props = {
  mode: 'create' | 'edit';
  initialValue?: EditorValues;
  loading?: boolean;
  onSubmit: (payload: EditorValues) => Promise<void>;
  onDelete?: () => Promise<void>;
};

function buildTagSuggestions(content: string): string[] {
  const text = content.toLowerCase();
  const dictionary = [
    'history',
    'war',
    'technology',
    'politics',
    'science',
    'civilization',
    'culture',
    'economics',
    'communication'
  ];

  return dictionary.filter((tag) => text.includes(tag)).slice(0, 6);
}

function Editor({ mode, initialValue, loading = false, onSubmit, onDelete }: Props) {
  const [title, setTitle] = useState(initialValue?.title || '');
  const [content, setContent] = useState(initialValue?.content || '');
  const [tags, setTags] = useState(initialValue?.tags || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setTitle(initialValue?.title || '');
    setContent(initialValue?.content || '');
    setTags(initialValue?.tags || '');
  }, [initialValue?.title, initialValue?.content, initialValue?.tags]);

  const readingHint = useMemo(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    return `${words} words`;
  }, [content]);

  const summary = useMemo(() => summarizeMarkdown(content), [content]);
  const suggestedTags = useMemo(() => buildTagSuggestions(`${title} ${content}`), [title, content]);

  const validate = () => {
    const safeTitle = sanitizeText(title, 140);
    if (safeTitle.length < 3) {
      setError('Title must be at least 3 characters long.');
      return false;
    }

    if (content.trim().length < 80) {
      setError('Content must be at least 80 characters long.');
      return false;
    }

    setError('');
    return true;
  };

  const submit = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      await onSubmit({ title, content, tags });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  const applySuggestedTag = (tag: string) => {
    const current = tags
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (current.some((value) => value.toLowerCase() === tag.toLowerCase())) return;
    setTags([...current, tag].join(', '));
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold text-slate-900">{mode === 'create' ? 'Create Article' : 'Edit Article'}</h2>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{readingHint}</span>
      </div>

      {loading ? <div className="animate-pulse rounded-lg bg-slate-100 p-4 text-sm text-slate-500">Loading editor...</div> : null}
      {error ? <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Title</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[var(--theme-color)] focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Tags (comma-separated)</label>
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="history, technology, politics"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[var(--theme-color)] focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Smart Assist</p>
        <p className="mt-1 text-sm text-slate-700">Improve this article with better structure and concise sections.</p>
        <p className="mt-2 text-xs text-slate-500">Suggested summary</p>
        <p className="text-sm text-slate-700">{summary}</p>
        {suggestedTags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => applySuggestedTag(tag)}
                className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-100"
              >
                + #{tag}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Markdown</label>
          <textarea
            rows={18}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm outline-none focus:border-[var(--theme-color)] focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Preview</label>
          <div className="prose max-w-none rounded-lg border border-slate-200 bg-slate-50 p-3">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              skipHtml
              urlTransform={(url) => safeMarkdownUrl(url)}
              components={{
                a: ({ node, ...props }) => <a {...props} rel="noreferrer noopener nofollow" target="_blank" />
              }}
            >
              {content || '_Start writing markdown..._'}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="rounded-lg bg-[var(--theme-color)] px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Saving...' : mode === 'create' ? 'Publish Article' : 'Save Changes'}
        </button>
        {onDelete ? (
          <button
            type="button"
            onClick={remove}
            disabled={deleting}
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 font-semibold text-red-700 disabled:opacity-60"
          >
            {deleting ? 'Deleting...' : 'Delete Article'}
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default Editor;
