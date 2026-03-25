const express = require('express');
const dayjs = require('dayjs');
const { run, get, all } = require('../db/database');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await get('SELECT id, username, created_at FROM users WHERE id = ?', [req.user.id]);
    const profile = await get('SELECT * FROM user_profiles WHERE user_id = ?', [req.user.id]);

    const pages = await all(
      `SELECT id, title, visibility, views, likes, updated_at
       FROM pages
       WHERE owner_id = ?
       ORDER BY updated_at DESC`,
      [req.user.id]
    );

    const stats = pages.reduce(
      (acc, page) => {
        acc.pages += 1;
        acc.totalViews += Number(page.views || 0);
        acc.totalLikes += Number(page.likes || 0);
        return acc;
      },
      { pages: 0, totalViews: 0, totalLikes: 0 }
    );

    return res.json({
      user,
      profile,
      stats,
      pages
    });
  } catch (error) {
    return next(error);
  }
});

router.put('/me', authMiddleware, async (req, res, next) => {
  try {
    const { accent_color, theme, card_style } = req.body;

    const safeTheme = ['light', 'dark', 'custom'].includes(theme) ? theme : 'light';
    const safeCardStyle = ['rounded', 'glass', 'minimal'].includes(card_style)
      ? card_style
      : 'rounded';
    const safeAccent = /^#[0-9a-fA-F]{6}$/.test(String(accent_color || ''))
      ? String(accent_color)
      : '#2563eb';

    await run(
      `UPDATE user_profiles
       SET accent_color = ?, theme = ?, card_style = ?, updated_at = ?
       WHERE user_id = ?`,
      [safeAccent, safeTheme, safeCardStyle, dayjs().toISOString(), req.user.id]
    );

    const updated = await get('SELECT * FROM user_profiles WHERE user_id = ?', [req.user.id]);

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

router.get('/:username', optionalAuth, async (req, res, next) => {
  try {
    const username = String(req.params.username || '').trim().toLowerCase();
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const user = await get('SELECT id, username, created_at FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isOwnerView = req.user?.id === user.id;
    const pages = isOwnerView
      ? await all(
          `SELECT id, title, visibility, likes, views, updated_at
           FROM pages
           WHERE owner_id = ?
           ORDER BY updated_at DESC`,
          [user.id]
        )
      : await all(
          `SELECT id, title, visibility, likes, views, updated_at
           FROM pages
           WHERE owner_id = ? AND visibility = 'public'
           ORDER BY updated_at DESC`,
          [user.id]
        );

    const stats = pages.reduce(
      (acc, page) => {
        acc.pages += 1;
        acc.totalLikes += Number(page.likes || 0);
        acc.totalViews += Number(page.views || 0);
        return acc;
      },
      { pages: 0, totalLikes: 0, totalViews: 0 }
    );

    const topLiked = [...pages]
      .sort((a, b) => Number(b.likes || 0) - Number(a.likes || 0))
      .slice(0, 3);

    const followersRow = await get('SELECT COUNT(*) AS count FROM follows WHERE following_id = ?', [user.id]);
    const followingRow = await get('SELECT COUNT(*) AS count FROM follows WHERE follower_id = ?', [user.id]);

    const isFollowing = req.user?.id
      ? await get('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?', [req.user.id, user.id])
      : null;

    return res.json({
      user,
      stats,
      pages,
      topLiked,
      followersCount: Number(followersRow?.count || 0),
      followingCount: Number(followingRow?.count || 0),
      isFollowing: Boolean(isFollowing)
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/:username/follow', authMiddleware, async (req, res, next) => {
  try {
    const username = String(req.params.username || '').trim().toLowerCase();
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const target = await get('SELECT id, username FROM users WHERE username = ?', [username]);
    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (target.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const existing = await get(
      `SELECT 1
       FROM follows
       WHERE follower_id = ? AND following_id = ?`,
      [req.user.id, target.id]
    );

    let following = false;
    if (existing) {
      await run(
        `DELETE FROM follows
         WHERE follower_id = ? AND following_id = ?`,
        [req.user.id, target.id]
      );
      following = false;
    } else {
      await run(
        `INSERT INTO follows (follower_id, following_id, created_at)
         VALUES (?, ?, ?)`,
        [req.user.id, target.id, dayjs().toISOString()]
      );
      following = true;
    }

    const followersRow = await get('SELECT COUNT(*) AS count FROM follows WHERE following_id = ?', [target.id]);

    return res.json({
      username: target.username,
      following,
      followersCount: Number(followersRow?.count || 0)
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
