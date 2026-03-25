import Fuse from 'fuse.js';

export function buildPageSuggestions(pages, query, limit = 6) {
  const text = String(query || '').trim();
  if (!text) return [];

  const normalized = Array.isArray(pages) ? pages : [];
  if (normalized.length === 0) return [];

  const fuse = new Fuse(normalized, {
    threshold: 0.35,
    includeScore: true,
    minMatchCharLength: 2,
    keys: [
      { name: 'title', weight: 0.5 },
      { name: 'content', weight: 0.35 },
      { name: 'tags', weight: 0.15 }
    ]
  });

  return fuse
    .search(text)
    .slice(0, limit)
    .map((result) => result.item);
}
