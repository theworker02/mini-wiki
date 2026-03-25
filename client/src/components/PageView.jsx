import ReactMarkdown from 'react-markdown';

function PageView({ page }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <header className="mb-5 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{page.title}</h1>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{page.category || 'General'}</p>
        <p className="mt-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">{page.ai_summary}</p>
        <p className="mt-2 text-xs text-slate-500">{(page.tags || []).map((tag) => `#${tag}`).join(' ')}</p>
      </header>
      <div className="markdown-body max-w-none">
        <ReactMarkdown>{page.content || 'No content yet.'}</ReactMarkdown>
      </div>
    </article>
  );
}

export default PageView;
