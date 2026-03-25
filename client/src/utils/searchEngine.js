import Fuse from 'fuse.js';

export function extractQueryTokens(query) {
  return String(query || '')
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

export function highlightText(text, query) {
  const tokens = extractQueryTokens(query);
  const source = String(text || '');

  if (tokens.length === 0 || !source) {
    return [{ text: source, match: false }];
  }

  const escaped = tokens
    .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');

  const regex = new RegExp(`(${escaped})`, 'ig');
  const parts = source.split(regex);

  return parts
    .filter(Boolean)
    .map((part) => ({
      text: part,
      match: tokens.some((token) => token === part.toLowerCase())
    }));
}

export function searchArticles(query, articles, limit = 8) {
  const text = String(query || '').trim();
  const safeArticles = Array.isArray(articles) ? articles : [];

  if (!text || safeArticles.length === 0) return [];

  const fuse = new Fuse(safeArticles, {
    threshold: 0.35,
    minMatchCharLength: 2,
    includeScore: true,
    includeMatches: true,
    keys: [
      { name: 'title', weight: 0.45 },
      { name: 'tags', weight: 0.25 },
      { name: 'content', weight: 0.25 },
      { name: 'category', weight: 0.05 }
    ]
  });

  return fuse.search(text).slice(0, limit).map((result) => ({
    ...result.item,
    searchScore: Number((1 - (result.score || 0)).toFixed(4))
  }));
}
