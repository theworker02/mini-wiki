import { useEffect, useState } from 'react';

function ProfileCustomizer({ profile, onSave, saving }) {
  const [form, setForm] = useState({
    accent_color: profile?.accent_color || '#2563eb',
    theme: profile?.theme || 'light',
    card_style: profile?.card_style || 'rounded'
  });

  useEffect(() => {
    setForm({
      accent_color: profile?.accent_color || '#2563eb',
      theme: profile?.theme || 'light',
      card_style: profile?.card_style || 'rounded'
    });
  }, [profile]);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700">Accent color</label>
        <input type="color" value={form.accent_color} onChange={(e) => update('accent_color', e.target.value)} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700">Theme</label>
        <select
          value={form.theme}
          onChange={(e) => update('theme', e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700">Profile card style</label>
        <select
          value={form.card_style}
          onChange={(e) => update('card_style', e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
        >
          <option value="rounded">Rounded</option>
          <option value="glass">Glass</option>
          <option value="minimal">Minimal</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-[var(--accent-color)] px-4 py-2 font-semibold text-white disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Save preferences'}
      </button>
    </form>
  );
}

export default ProfileCustomizer;
