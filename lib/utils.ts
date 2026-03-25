import slugify from 'slugify';

export type Article = {
  id: string;
  slug: string;
  title: string;
  content: string;
  tags: string[];
  authorUsername: string;
  status: ArticleStatus;
  likes: number;
  views: number;
  createdAt: string;
  updatedAt: string;
};

export type UserRole = 'guest' | 'pending' | 'user' | 'editor' | 'admin';
export type ArticleStatus = 'pending' | 'published' | 'rejected';
export type EditRequestStatus = 'pending' | 'approved' | 'rejected';

export type Profile = {
  username: string;
  themeColor: string;
  role: UserRole;
  updatedAt: string;
};

export type EditRequest = {
  id: string;
  articleSlug: string;
  requesterUsername: string;
  intent: string;
  proposedTitle: string;
  proposedContent: string;
  proposedTags: string[];
  status: EditRequestStatus;
  reviewedBy: string;
  createdAt: string;
  updatedAt: string;
};

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'there', 'their', 'what', 'when', 'where', 'which', 'your',
  'have', 'has', 'was', 'were', 'will', 'would', 'should', 'wiki', 'article', 'page', 'into', 'about', 'over',
  'under', 'between', 'while', 'within', 'after', 'before', 'also', 'than', 'then', 'them', 'they', 'you', 'our'
]);

const MAX_TITLE_LENGTH = 140;
const MAX_CONTENT_LENGTH = 120_000;
const MAX_USERNAME_LENGTH = 32;
const MAX_EMAIL_LENGTH = 254;
const DEFAULT_THEME = '#2563eb';

function stripControlChars(input: string): string {
  return input.replace(/[\u0000-\u001F\u007F]/g, '');
}

export function sanitizeText(input: unknown, maxLength = 5000): string {
  const value = stripControlChars(String(input ?? '')).trim();
  if (!value) return '';
  return value.slice(0, maxLength);
}

export function sanitizeMarkdown(input: unknown): string {
  const value = stripControlChars(String(input ?? ''));
  return value.slice(0, MAX_CONTENT_LENGTH).replace(/\r\n/g, '\n');
}

export function sanitizeUsername(input: unknown): string {
  const raw = sanitizeText(input, MAX_USERNAME_LENGTH).toLowerCase();
  const compact = raw.replace(/[^a-z0-9_-]/g, '');
  if (!compact) return 'guest';
  return compact.slice(0, MAX_USERNAME_LENGTH);
}

export function sanitizeEmail(input: unknown): string {
  const value = sanitizeText(input, MAX_EMAIL_LENGTH).toLowerCase();
  if (!value) return '';
  const compact = value.replace(/\s+/g, '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(compact)) return '';
  return compact;
}

export function sanitizeThemeColor(input: unknown): string {
  const value = String(input ?? '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : DEFAULT_THEME;
}

export function sanitizeRole(input: unknown): UserRole {
  const value = String(input ?? '').trim().toLowerCase();
  if (value === 'admin') return 'admin';
  if (value === 'editor') return 'editor';
  if (value === 'user') return 'user';
  if (value === 'pending') return 'pending';
  return 'guest';
}

export function isValidSlug(input: unknown): boolean {
  const value = String(input ?? '').trim();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function generateSlug(title: string): string {
  const base = slugify(title || 'untitled-article', { lower: true, strict: true, trim: true });
  return base || `article-${Date.now()}`;
}

export function normalizeTags(input: string[] | string): string[] {
  const parts = Array.isArray(input) ? input : String(input || '').split(',');

  return parts
    .map((tag) => sanitizeText(tag, 40).toLowerCase())
    .map((tag) => tag.replace(/^#+/, '').replace(/[^a-z0-9-_\s]/g, '').trim())
    .map((tag) => tag.replace(/\s+/g, '-'))
    .filter((tag) => tag.length >= 2)
    .filter((tag, index, arr) => arr.indexOf(tag) === index)
    .slice(0, 16);
}

export function sanitizeArticlePayload(payload: {
  title: unknown;
  content: unknown;
  tags: unknown;
}): {
  title: string;
  content: string;
  tags: string[];
  errors: string[];
} {
  const title = sanitizeText(payload.title, MAX_TITLE_LENGTH);
  const content = sanitizeMarkdown(payload.content);
  const tags = normalizeTags(Array.isArray(payload.tags) ? payload.tags : String(payload.tags ?? '').split(','));

  const errors: string[] = [];
  if (title.length < 3) errors.push('Title must be at least 3 characters long.');
  if (title.length > MAX_TITLE_LENGTH) errors.push(`Title must be <= ${MAX_TITLE_LENGTH} characters.`);
  if (content.trim().length < 80) errors.push('Content must be at least 80 characters long.');
  if (content.length > MAX_CONTENT_LENGTH) errors.push(`Content must be <= ${MAX_CONTENT_LENGTH} characters.`);
  if (isLikelySpam(`${title} ${content}`)) errors.push('Content appears to be spam-like. Please revise and try again.');

  return { title, content, tags, errors };
}

export function extractKeywords(text: string): string[] {
  const words = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));

  const freq = new Map<string, number>();
  words.forEach((word) => {
    freq.set(word, (freq.get(word) || 0) + 1);
  });

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

export function summarizeMarkdown(content: string): string {
  const cleaned = String(content || '')
    .replace(/[#>*_\-\[\]()`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return 'No summary available yet.';

  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned];
  return sentences.slice(0, 3).join(' ').trim();
}

export function estimateReadTime(content: string): number {
  const words = String(content || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function calculateEngagementScore(article: Pick<Article, 'likes' | 'views'>): number {
  const likes = Number(article.likes || 0);
  const views = Number(article.views || 0);
  if (likes === 0 && views === 0) return 0;

  const score = likes * 4 + views * 0.5;
  return Math.min(100, Math.round(score / 3));
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let overlap = 0;
  a.forEach((token) => {
    if (b.has(token)) overlap += 1;
  });
  return overlap / new Set([...a, ...b]).size;
}

export function getRelatedArticles(current: Article, all: Article[]): Article[] {
  const currentTitle = new Set(extractKeywords(current.title));
  const currentTags = new Set(current.tags.map((tag) => tag.toLowerCase()));
  const currentBody = new Set(extractKeywords(`${current.title} ${current.content}`));

  return all
    .filter((article) => article.slug !== current.slug)
    .map((candidate) => {
      const titleScore = overlapScore(currentTitle, new Set(extractKeywords(candidate.title)));
      const tagScore = overlapScore(currentTags, new Set(candidate.tags.map((tag) => tag.toLowerCase())));
      const contentScore = overlapScore(currentBody, new Set(extractKeywords(`${candidate.title} ${candidate.content}`)));
      const total = titleScore * 0.35 + tagScore * 0.35 + contentScore * 0.3;
      return { candidate, score: total };
    })
    .filter((row) => row.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((row) => row.candidate);
}

export function createConnections(
  articles: Article[]
): { nodes: { id: string; label: string; group: string }[]; edges: { source: string; target: string }[] } {
  const nodes = articles.map((article) => ({
    id: article.slug,
    label: article.title,
    group: article.tags[0] || 'general'
  }));

  const edgeSet = new Set<string>();
  const edges: { source: string; target: string }[] = [];

  articles.forEach((article) => {
    const related = getRelatedArticles(article, articles).slice(0, 3);
    related.forEach((target) => {
      const key = [article.slug, target.slug].sort().join('::');
      if (edgeSet.has(key)) return;
      edgeSet.add(key);
      edges.push({ source: article.slug, target: target.slug });
    });
  });

  return { nodes, edges };
}

export type ParsedSearch = {
  mode: 'empty' | 'text' | 'topic';
  normalized: string;
  topic?: string;
};

export function parseSearchQuery(input: string): ParsedSearch {
  const normalized = sanitizeText(input, 120).toLowerCase();
  if (!normalized) return { mode: 'empty', normalized: '' };

  if (normalized.startsWith('#')) {
    const topic = normalized.slice(1).replace(/[^a-z0-9-_\s]/g, '').trim().replace(/\s+/g, '-');
    if (!topic) return { mode: 'empty', normalized: '' };
    return { mode: 'topic', normalized: `#${topic}`, topic };
  }

  return { mode: 'text', normalized };
}

function scoreTextMatch(article: Article, query: string): number {
  const haystack = `${article.title} ${article.content} ${article.tags.join(' ')}`.toLowerCase();
  const terms = query.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return 0;

  let score = 0;
  for (const term of terms) {
    if (article.title.toLowerCase().includes(term)) score += 4;
    if (article.tags.some((tag) => tag.includes(term))) score += 3;
    if (haystack.includes(term)) score += 1;
  }

  const queryKeywords = new Set(extractKeywords(query));
  const articleKeywords = new Set(extractKeywords(haystack));
  score += overlapScore(queryKeywords, articleKeywords) * 5;

  return score;
}

export function searchArticles(articles: Article[], query: string): Article[] {
  const parsed = parseSearchQuery(query);
  const ordered = [...articles].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  if (parsed.mode === 'empty') return ordered;
  if (parsed.mode === 'topic' && parsed.topic) {
    return ordered.filter((article) => article.tags.some((tag) => tag.toLowerCase() === parsed.topic));
  }

  const withScore = ordered
    .map((article) => ({ article, score: scoreTextMatch(article, parsed.normalized) }))
    .filter((item) => item.score > 0.2)
    .sort((a, b) => b.score - a.score);

  return withScore.map((item) => item.article);
}

export function safeMarkdownUrl(url: string): string {
  const value = String(url || '').trim();
  if (!value) return '';

  if (value.startsWith('/')) return value;

  try {
    const parsed = new URL(value);
    const safeProtocols = new Set(['http:', 'https:', 'mailto:']);
    return safeProtocols.has(parsed.protocol) ? value : '';
  } catch {
    return '';
  }
}

export function isLikelySpam(text: string): boolean {
  const value = String(text || '').toLowerCase();
  if (!value) return false;

  const links = value.match(/https?:\/\//g) || [];
  if (links.length > 8) return true;

  if (/(.)\1{8,}/.test(value)) return true;

  const tokens = value.split(/\s+/).filter(Boolean);
  if (tokens.length < 20) return false;

  const unique = new Set(tokens);
  return unique.size / tokens.length < 0.2;
}

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __miniWikiRateLimit__: Map<string, RateLimitBucket> | undefined;
}

const rateStore = globalThis.__miniWikiRateLimit__ || (globalThis.__miniWikiRateLimit__ = new Map<string, RateLimitBucket>());

export function checkRateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = rateStore.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateStore.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterMs: Math.max(0, bucket.resetAt - now) };
  }

  bucket.count += 1;
  rateStore.set(key, bucket);
  return { ok: true, retryAfterMs: 0 };
}

export function safeErrorDetails(error: unknown): { error: string; details?: string } {
  const message = error instanceof Error ? error.message : 'Unknown error';
  if (process.env.NODE_ENV === 'production') {
    return { error: 'Request failed' };
  }
  return { error: 'Request failed', details: message };
}
