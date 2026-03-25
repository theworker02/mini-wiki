import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import SmartEditor from './SmartEditor';
import { CATEGORIES } from '../data/categories';

function PageEditor({
  form,
  onFieldChange,
  onContentChange,
  onToggleRelated,
  suggestions,
  pages,
  onSave,
  onGenerateSummary,
  saving,
  generating,
  liveStatus
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xl font-bold text-slate-900">{form.id ? 'Edit Wiki Page' : 'Create Wiki Page'}</h3>
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            liveStatus === 'connected' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}
        >
          Live Editing {liveStatus === 'connected' ? 'Connected' : 'Connecting...'}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Title</label>
          <input
            value={form.title}
            onChange={(e) => onFieldChange('title', e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[var(--accent-color)] focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Tags</label>
          <input
            value={form.tagsInput}
            onChange={(e) => onFieldChange('tagsInput', e.target.value)}
            placeholder="knowledge, design, api"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[var(--accent-color)] focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Category</label>
          <select
            value={form.category || 'General'}
            onChange={(e) => onFieldChange('category', e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-[var(--accent-color)] focus:ring-2 focus:ring-blue-100"
          >
            {CATEGORIES.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700">Visibility</label>
        <select
          value={form.visibility}
          onChange={(e) => onFieldChange('visibility', e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Markdown editor</label>
          <textarea
            rows={18}
            value={form.content}
            onChange={(e) => onContentChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm outline-none focus:border-[var(--accent-color)] focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Live preview</label>
          <div className="markdown-body max-h-[430px] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
            <ReactMarkdown>{form.content || '_Start typing markdown to preview your page._'}</ReactMarkdown>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700">Summary</label>
        <textarea
          rows={4}
          value={form.ai_summary}
          onChange={(e) => onFieldChange('ai_summary', e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[var(--accent-color)] focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <SmartEditor
        title={form.title}
        content={form.content}
        onApplyContent={onContentChange}
        onApplySummary={(nextSummary) => onFieldChange('ai_summary', nextSummary)}
        onApplyTags={(nextTags) => onFieldChange('tagsInput', nextTags)}
        onGenerateSummary={onGenerateSummary}
      />

      <div>
        <p className="mb-1 text-sm font-semibold text-slate-700">Suggested relations</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.length === 0 ? <span className="text-xs text-slate-500">No suggestions yet</span> : null}
          {suggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggleRelated(item.id)}
              className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700"
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm font-semibold text-slate-700">Related articles</p>
        <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
          {pages
            .filter((p) => p.id !== form.id)
            .map((p) => {
              const checked = form.related_articles.includes(p.id);
              return (
                <label key={p.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleRelated(p.id)}
                    className="h-4 w-4"
                  />
                  <span>{p.title}</span>
                </label>
              );
            })}
        </div>
      </div>

      <motion.button
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-lg bg-[var(--accent-color)] px-4 py-2 font-semibold text-white disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Save Page'}
      </motion.button>
    </div>
  );
}

export default PageEditor;
