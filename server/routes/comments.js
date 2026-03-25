const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const { run, get, all } = require('../db/database');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:pageId', optionalAuth, async (req, res, next) => {
  try {
    const page = await get('SELECT * FROM pages WHERE id = ?', [req.params.pageId]);

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    if (page.visibility === 'private' && page.owner_id !== req.user?.id) {
      return res.status(403).json({ error: 'You do not have access to this page' });
    }

    const comments = await all(
      `SELECT c.id, c.page_id, c.user_id, c.content, c.created_at, u.username
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.page_id = ?
       ORDER BY c.created_at ASC`,
      [req.params.pageId]
    );

    return res.json(comments);
  } catch (error) {
    return next(error);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { pageId, content } = req.body;

    if (!pageId || !content || !content.trim()) {
      return res.status(400).json({ error: 'pageId and content are required' });
    }

    const page = await get('SELECT * FROM pages WHERE id = ?', [pageId]);
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    if (page.visibility === 'private' && page.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have access to comment on this page' });
    }

    const id = uuidv4();
    const createdAt = dayjs().toISOString();

    await run(
      `INSERT INTO comments (id, page_id, user_id, content, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, pageId, req.user.id, content.trim(), createdAt]
    );

    const comment = await get(
      `SELECT c.id, c.page_id, c.user_id, c.content, c.created_at, u.username
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.id = ?`,
      [id]
    );

    return res.status(201).json(comment);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
