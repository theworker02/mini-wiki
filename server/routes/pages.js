const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { run, get, all, rebuildLoreIndex, extractKeywords } = require('../db/database');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

function parseJSON(value, fallback) {
  try {
    const parsed = JSON.parse(value || '');
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => String(tag || '').trim().toLowerCase())
    .filter(Boolean)
    .filter((tag, index, arr) => arr.indexOf(tag) === index);
}

function normalizeRelated(ids) {
  if (!Array.isArray(ids)) return [];
  return ids
    .map((id) => String(id || '').trim())
    .filter(Boolean)
    .filter((id, index, arr) => arr.indexOf(id) === index);
}

function normalizeCategory(category) {
  const text = String(category || '').trim();
  if (!text) return 'General';
  return text.slice(0, 48);
}

function fallbackSummary(content) {
  const clean = (content || '').replace(/[#>*_\-\[\]()`]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return 'No summary available yet.';
  const sentences = clean.match(/[^.!?]+[.!?]+/g) || [clean];
  return sentences.slice(0, 3).join(' ').trim();
}

function canAccessPage(pageRow, viewerId) {
  return pageRow.visibility === 'public' || pageRow.owner_id === viewerId;
}

function toClientPage(row, viewerId, extra = {}) {
  return {
    id: row.id,
    owner_id: row.owner_id,
    title: row.title,
    content: row.content,
    tags: parseJSON(row.tags, []),
    category: normalizeCategory(row.category),
    related_articles: parseJSON(row.related_articles, []),
    visibility: row.visibility,
    ai_summary: row.ai_summary || fallbackSummary(row.content),
    views: row.views || 0,
    likes: row.likes || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    canEdit: Boolean(viewerId && row.owner_id === viewerId),
    ...extra
  };
}

async function filterLinkablePageIds(ids, userId) {
  if (!ids.length) return [];
  const placeholders = ids.map(() => '?').join(', ');
  const rows = await all(
    `SELECT id
     FROM pages
     WHERE id IN (${placeholders})
       AND (visibility = 'public' OR owner_id = ?)`,
    [...ids, userId]
  );
  const allowed = new Set(rows.map((row) => row.id));
  return ids.filter((id) => allowed.has(id));
}

async function resolveRelatedDetails(relatedIds, viewerId) {
  if (!relatedIds.length) return [];

  const placeholders = relatedIds.map(() => '?').join(', ');
  const rows = await all(
    `SELECT id, title, visibility, owner_id
     FROM pages
     WHERE id IN (${placeholders})`,
    relatedIds
  );

  const pageMap = new Map(rows.map((row) => [row.id, row]));

  return relatedIds
    .map((id) => pageMap.get(id))
    .filter((row) => row && canAccessPage(row, viewerId))
    .map((row) => ({
      id: row.id,
      title: row.title,
      visibility: row.visibility
    }));
}

async function syncBidirectionalLinks(pageId, relatedIds) {
  const targetSet = new Set(relatedIds.filter((id) => id !== pageId));
  const rows = await all('SELECT id, related_articles FROM pages WHERE id <> ?', [pageId]);

  for (const row of rows) {
    const current = parseJSON(row.related_articles, []);
    const hasLink = current.includes(pageId);
    const shouldLink = targetSet.has(row.id);

    if (shouldLink && !hasLink) {
      const next = [...current, pageId].filter((id, index, arr) => arr.indexOf(id) === index);
      await run(
        `UPDATE pages
         SET related_articles = ?, updated_at = ?
         WHERE id = ?`,
        [JSON.stringify(next), dayjs().toISOString(), row.id]
      );
      continue;
    }

    if (!shouldLink && hasLink) {
      const next = current.filter((id) => id !== pageId);
      await run(
        `UPDATE pages
         SET related_articles = ?, updated_at = ?
         WHERE id = ?`,
        [JSON.stringify(next), dayjs().toISOString(), row.id]
      );
    }
  }
}

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim().toLowerCase();

    const rows = req.user?.id
      ? await all(
          `SELECT p.*
           FROM pages p
           WHERE p.visibility = 'public' OR p.owner_id = ?
           ORDER BY p.updated_at DESC`,
          [req.user.id]
        )
      : await all(
          `SELECT p.*
           FROM pages p
           WHERE p.visibility = 'public'
           ORDER BY p.updated_at DESC`
        );

    let pages = rows.map((row) => toClientPage(row, req.user?.id || null));

    if (search) {
      const tokens = search.split(/\s+/).filter(Boolean);

      pages = pages
        .map((page) => {
          const haystackTitle = page.title.toLowerCase();
          const haystackContent = page.content.toLowerCase();
          const haystackTags = page.tags.join(' ').toLowerCase();
          const haystackCategory = String(page.category || '').toLowerCase();
          let score = 0;

          if (haystackTitle.includes(search)) score += 5;
          if (haystackTags.includes(search)) score += 3;
          if (haystackContent.includes(search)) score += 2;
          if (haystackCategory.includes(search)) score += 2;

          tokens.forEach((token) => {
            if (haystackTitle.includes(token)) score += 2;
            if (haystackContent.includes(token)) score += 1;
            if (haystackTags.includes(token)) score += 1;
            if (haystackCategory.includes(token)) score += 1;
          });

          return { page, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.page);
    }

    return res.json(pages);
  } catch (error) {
    return next(error);
  }
});

router.get('/graph', optionalAuth, async (req, res, next) => {
  try {
    const rows = req.user?.id
      ? await all(
          `SELECT * FROM pages
           WHERE visibility = 'public' OR owner_id = ?
           ORDER BY updated_at DESC`,
          [req.user.id]
        )
      : await all(
          `SELECT * FROM pages
           WHERE visibility = 'public'
           ORDER BY updated_at DESC`
        );

    const pages = rows.map((row) => toClientPage(row, req.user?.id || null));
    const nodeMap = new Map(pages.map((page) => [page.id, page]));
    const linkSet = new Set();
    const links = [];

    pages.forEach((page) => {
      page.related_articles.forEach((targetId) => {
        if (!nodeMap.has(targetId)) return;
        const key = [page.id, targetId].sort().join('::');
        if (linkSet.has(key)) return;

        linkSet.add(key);
        links.push({ source: page.id, target: targetId });
      });
    });

    const nodes = pages.map((page) => ({
      id: page.id,
      title: page.title,
      summary: page.ai_summary,
      category: page.category || 'General',
      views: page.views,
      likes: page.likes
    }));

    return res.json({ nodes, links });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id/suggestions', authMiddleware, async (req, res, next) => {
  try {
    const page = await get('SELECT * FROM pages WHERE id = ?', [req.params.id]);

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    if (page.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the owner can request relation suggestions' });
    }

    const others = await all(
      `SELECT * FROM pages
       WHERE id <> ?
         AND (visibility = 'public' OR owner_id = ?)
       ORDER BY updated_at DESC`,
      [req.params.id, req.user.id]
    );

    const sourceTokens = new Set(extractKeywords(`${page.title} ${page.content}`));

    const scored = others
      .map((candidate) => {
        const candidateTokens = new Set(extractKeywords(`${candidate.title} ${candidate.content}`));
        let overlap = 0;
        sourceTokens.forEach((token) => {
          if (candidateTokens.has(token)) overlap += 1;
        });

        const titleA = (page.title || '').toLowerCase();
        const titleB = (candidate.title || '').toLowerCase();
        const titleBoost = titleA.includes(titleB) || titleB.includes(titleA) ? 2 : 0;

        return {
          page: toClientPage(candidate, req.user.id),
          score: overlap + titleBoost
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item) => item.page);

    return res.json(scored);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const page = await get('SELECT * FROM pages WHERE id = ?', [req.params.id]);

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    if (!canAccessPage(page, req.user?.id)) {
      return res.status(403).json({ error: 'You do not have access to this page' });
    }

    await run('UPDATE pages SET views = views + 1 WHERE id = ?', [req.params.id]);
    const updated = await get('SELECT * FROM pages WHERE id = ?', [req.params.id]);

    const relatedIds = parseJSON(updated.related_articles, []);
    const relatedDetails = await resolveRelatedDetails(relatedIds, req.user?.id || null);

    return res.json(
      toClientPage(updated, req.user?.id || null, {
        related_page_details: relatedDetails
      })
    );
  } catch (error) {
    return next(error);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const {
      title,
      content = '',
      tags = [],
      category = 'General',
      visibility = 'public',
      ai_summary = null,
      related_articles = []
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const id = uuidv4();
    const now = dayjs().toISOString();
    const safeTags = normalizeTags(tags);
    const safeCategory = normalizeCategory(category);
    const safeVisibility = visibility === 'private' ? 'private' : 'public';
    const safeRelated = await filterLinkablePageIds(normalizeRelated(related_articles), req.user.id);

    await run(
      `INSERT INTO pages
       (id, owner_id, title, content, tags, category, visibility, ai_summary, related_articles, views, likes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`,
      [
        id,
        req.user.id,
        title.trim(),
        content,
        JSON.stringify(safeTags),
        safeCategory,
        safeVisibility,
        ai_summary,
        JSON.stringify(safeRelated),
        now,
        now
      ]
    );

    await syncBidirectionalLinks(id, safeRelated);
    await rebuildLoreIndex();

    const created = await get('SELECT * FROM pages WHERE id = ?', [id]);
    const relatedDetails = await resolveRelatedDetails(safeRelated, req.user.id);

    return res.status(201).json(
      toClientPage(created, req.user.id, {
        related_page_details: relatedDetails
      })
    );
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const existing = await get('SELECT * FROM pages WHERE id = ?', [req.params.id]);

    if (!existing) {
      return res.status(404).json({ error: 'Page not found' });
    }

    if (existing.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the owner can edit this page' });
    }

    const {
      title,
      content = '',
      tags = [],
      category = existing.category || 'General',
      visibility = existing.visibility,
      ai_summary = null,
      related_articles = []
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const safeTags = normalizeTags(tags);
    const safeCategory = normalizeCategory(category);
    const safeVisibility = visibility === 'private' ? 'private' : 'public';
    const safeRelated = await filterLinkablePageIds(
      normalizeRelated(related_articles).filter((pageId) => pageId !== req.params.id),
      req.user.id
    );

    await run(
      `UPDATE pages
       SET title = ?, content = ?, tags = ?, category = ?, visibility = ?, ai_summary = ?, related_articles = ?, updated_at = ?
       WHERE id = ?`,
      [
        title.trim(),
        content,
        JSON.stringify(safeTags),
        safeCategory,
        safeVisibility,
        ai_summary,
        JSON.stringify(safeRelated),
        dayjs().toISOString(),
        req.params.id
      ]
    );

    await syncBidirectionalLinks(req.params.id, safeRelated);
    await rebuildLoreIndex();

    const updated = await get('SELECT * FROM pages WHERE id = ?', [req.params.id]);
    const relatedDetails = await resolveRelatedDetails(safeRelated, req.user.id);

    return res.json(
      toClientPage(updated, req.user.id, {
        related_page_details: relatedDetails
      })
    );
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/like', authMiddleware, async (req, res, next) => {
  try {
    const page = await get('SELECT * FROM pages WHERE id = ?', [req.params.id]);

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    if (!canAccessPage(page, req.user.id)) {
      return res.status(403).json({ error: 'You do not have access to this page' });
    }

    const existingLike = await get(
      'SELECT page_id FROM page_likes WHERE page_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (existingLike) {
      return res.json({
        liked: false,
        likes: page.likes,
        message: 'You already liked this page'
      });
    }

    await run(
      `INSERT INTO page_likes (page_id, user_id, created_at)
       VALUES (?, ?, ?)`,
      [req.params.id, req.user.id, dayjs().toISOString()]
    );

    await run('UPDATE pages SET likes = likes + 1 WHERE id = ?', [req.params.id]);
    const updated = await get('SELECT likes FROM pages WHERE id = ?', [req.params.id]);

    return res.json({ liked: true, likes: updated.likes });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
