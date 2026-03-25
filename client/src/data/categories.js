export const CATEGORIES = [
  { name: 'General', color: '#60a5fa' },
  { name: 'Engineering', color: '#2563eb' },
  { name: 'Product', color: '#0ea5e9' },
  { name: 'Design', color: '#14b8a6' },
  { name: 'Research', color: '#8b5cf6' },
  { name: 'Operations', color: '#f97316' }
];

export function normalizeCategory(value) {
  const incoming = String(value || '').trim();
  if (!incoming) return 'General';

  const match = CATEGORIES.find((item) => item.name.toLowerCase() === incoming.toLowerCase());
  return match ? match.name : incoming;
}

export function categoryColor(category) {
  const match = CATEGORIES.find((item) => item.name.toLowerCase() === String(category || '').toLowerCase());
  return match?.color || '#94a3b8';
}
