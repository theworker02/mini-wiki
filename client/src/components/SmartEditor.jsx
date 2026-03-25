import { useMemo, useState } from 'react';

function autoSummary(content) {
  const plain = String(content || '')
    .replace(/[#>*_\-\[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plain) return 'No summary available yet.';

  const sentences = plain.match(/[^.!?]+[.!?]+/g) || [plain];
  return sentences.slice(0, 3).join(' ').trim();
}

function suggestTagsFromContent(title, content) {
  const text = `${title || ''} ${content || ''}`.toLowerCase();
  const words = text
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3);

  const stopWords = new Set([
    'this', 'that', 'with', 'from', 'into', 'about', 'there', 'their', 'while', 'should', 'would',
    'which', 'were', 'your', 'wiki', 'page', 'content', 'article'
  ]);

  const counts = new Map();
  words.forEach((word) => {
    if (stopWords.has(word)) return;
    counts.set(word, (counts.get(word) || 0) + 1);
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word]) => word);
}

function SmartEditor({
  title,
  content,
  onApplyContent,
  onApplySummary,
  onApplyTags,
  onGenerateSummary
}) {
  const [working, setWorking] = useState('');

  const suggestions = useMemo(() => suggestTagsFromContent(title, content), [title, content]);

  const improveArticle = () => {
    const normalized = String(content || '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+\n/g, '\n')
      .trim();

    const withHeading = normalized.startsWith('#')
      ? normalized
      : `# ${title || 'Untitled Article'}\n\n${normalized}`;

    onApplyContent(withHeading);
  };

  const generateSummary = async () => {
    setWorking('summary');
    try {
      if (onGenerateSummary) {
        const generated = await onGenerateSummary();
        if (generated) {
          onApplySummary(generated);
          return;
        }
      }

      onApplySummary(autoSummary(content));
    } finally {
      setWorking('');
    }
  };

  const applySuggestedTags = () => {
    onApplyTags(suggestions.join(', '));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Smart Article Assist</h4>
      <p className="mt-1 text-sm text-slate-600">AI-like helpers for writing quality and discoverability.</p>

      <div className="mt-3 grid gap-2">
        <button
          type="button"
          onClick={improveArticle}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Improve this article
        </button>

        <button
          type="button"
          onClick={generateSummary}
          disabled={working === 'summary'}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
        >
          {working === 'summary' ? 'Generating...' : 'Generate summary'}
        </button>

        <button
          type="button"
          onClick={applySuggestedTags}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Suggest tags
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.length === 0 ? <span className="text-xs text-slate-500">No tag suggestions yet.</span> : null}
        {suggestions.map((tag) => (
          <span key={tag} className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default SmartEditor;
