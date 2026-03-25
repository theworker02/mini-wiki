const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dayjs = require('dayjs');

const dbPath = path.join(__dirname, 'wiki.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  }
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      return resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      return resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      return resolve(rows);
    });
  });
}

async function ensureColumn(table, column, definition) {
  const columns = await all(`PRAGMA table_info(${table})`);
  const exists = columns.some((item) => item.name === column);
  if (!exists) {
    await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

const STOPWORDS = new Set([
  'about', 'above', 'after', 'again', 'against', 'all', 'also', 'and', 'any', 'are', 'because', 'been',
  'before', 'being', 'below', 'between', 'both', 'but', 'can', 'could', 'did', 'does', 'doing', 'down',
  'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'here', 'how', 'into',
  'its', 'itself', 'just', 'more', 'most', 'other', 'our', 'ours', 'over', 'same', 'should', 'some', 'such',
  'than', 'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those', 'through',
  'under', 'until', 'very', 'was', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'will', 'with',
  'would', 'your', 'yours', 'wiki', 'page'
]);

function extractKeywords(text) {
  const words = (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 3 && !STOPWORDS.has(word));

  const frequency = new Map();
  words.forEach((word) => {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  });

  return [...frequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([word]) => word);
}

async function rebuildLoreIndex() {
  const rows = await all('SELECT id, title, content FROM pages');
  const map = new Map();

  for (const row of rows) {
    const titleBoost = `${row.title || ''} ${row.title || ''}`;
    const keywords = extractKeywords(`${titleBoost} ${row.content || ''}`);

    for (const keyword of keywords) {
      if (!map.has(keyword)) map.set(keyword, new Set());
      map.get(keyword).add(row.id);
    }
  }

  await run('DELETE FROM lore');

  for (const [keyword, idSet] of map.entries()) {
    await run(
      `INSERT INTO lore (id, keyword, related_page_ids, updated_at)
       VALUES (?, ?, ?, ?)`,
      [
        `${keyword}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        keyword,
        JSON.stringify([...idSet]),
        dayjs().toISOString()
      ]
    );
  }
}

async function initDatabase() {
  try {
    await run('PRAGMA foreign_keys = ON');

    await run(
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`
    );

    await run(
      `CREATE TABLE IF NOT EXISTS user_profiles (
        user_id TEXT PRIMARY KEY,
        accent_color TEXT NOT NULL DEFAULT '#2563eb',
        theme TEXT NOT NULL DEFAULT 'light',
        card_style TEXT NOT NULL DEFAULT 'rounded',
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`
    );

    await run(
      `CREATE TABLE IF NOT EXISTS pages (
        id TEXT PRIMARY KEY,
        owner_id TEXT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT NOT NULL DEFAULT '[]',
        category TEXT NOT NULL DEFAULT 'General',
        visibility TEXT NOT NULL DEFAULT 'public',
        ai_summary TEXT,
        related_articles TEXT NOT NULL DEFAULT '[]',
        views INTEGER NOT NULL DEFAULT 0,
        likes INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (owner_id) REFERENCES users(id)
      )`
    );

    await ensureColumn('pages', 'owner_id', 'TEXT');
    await ensureColumn('pages', 'visibility', "TEXT NOT NULL DEFAULT 'public'");
    await ensureColumn('pages', 'ai_summary', 'TEXT');
    await ensureColumn('pages', 'related_articles', "TEXT NOT NULL DEFAULT '[]'");
    await ensureColumn('pages', 'category', "TEXT NOT NULL DEFAULT 'General'");
    await ensureColumn('pages', 'views', 'INTEGER NOT NULL DEFAULT 0');
    await ensureColumn('pages', 'likes', 'INTEGER NOT NULL DEFAULT 0');

    await run(
      `CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        page_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`
    );

    await run(
      `CREATE TABLE IF NOT EXISTS page_likes (
        page_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (page_id, user_id),
        FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`
    );

    await run(
      `CREATE TABLE IF NOT EXISTS follows (
        follower_id TEXT NOT NULL,
        following_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (follower_id, following_id),
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
      )`
    );

    await run(
      `CREATE TABLE IF NOT EXISTS lore (
        id TEXT PRIMARY KEY,
        keyword TEXT NOT NULL,
        related_page_ids TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`
    );

    await run(`CREATE INDEX IF NOT EXISTS idx_pages_owner_visibility ON pages(owner_id, visibility)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_pages_updated_at ON pages(updated_at)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_comments_page_id ON comments(page_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_lore_keyword ON lore(keyword)`);

    await rebuildLoreIndex();
  } catch (error) {
    console.error('Database initialization failed:', error.message);
  }
}

initDatabase();

module.exports = {
  db,
  run,
  get,
  all,
  rebuildLoreIndex,
  extractKeywords
};
