const express = require('express');
const { all } = require('../db/database');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

function parseIds(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const keywordFilter = String(req.query.keyword || '').trim().toLowerCase();

    const rows = keywordFilter
      ? await all(
          `SELECT keyword, related_page_ids
           FROM lore
           WHERE keyword LIKE ?
           ORDER BY keyword ASC`,
          [`%${keywordFilter}%`]
        )
      : await all(
          `SELECT keyword, related_page_ids
           FROM lore
           ORDER BY keyword ASC`
        );

    const visibleEntries = [];

    for (const row of rows) {
      const ids = parseIds(row.related_page_ids);
      if (ids.length === 0) continue;

      const placeholders = ids.map(() => '?').join(', ');
      const pageRows = await all(
        `SELECT id, title, visibility, owner_id
         FROM pages
         WHERE id IN (${placeholders})`,
        ids
      );

      const pageMap = new Map(pageRows.map((page) => [page.id, page]));
      const relatedPages = ids
        .map((id) => pageMap.get(id))
        .filter((page) => page && (page.visibility === 'public' || page.owner_id === req.user?.id))
        .map((page) => ({ id: page.id, title: page.title, visibility: page.visibility }));

      if (relatedPages.length > 0) {
        visibleEntries.push({
          keyword: row.keyword,
          related_pages: relatedPages
        });
      }
    }

    return res.json(visibleEntries);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
