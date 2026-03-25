# API Reference

Base URL (Production): `${NEXT_PUBLIC_APP_URL}`

Examples:
- Local: `http://localhost:3000`
- Vercel: `https://your-project-name.vercel.app`

All endpoints are served by Next.js API routes under `/api`.

## Articles

### GET `/api/articles`

List articles.

Query params:
- `q` (optional): keyword or topic query (`#history`)

### POST `/api/articles`

Create article.

Request:

```json
{
  "title": "The Industrial Revolution",
  "content": "# ...markdown...",
  "tags": ["history", "technology"],
  "authorUsername": "alex"
}
```

### GET `/api/articles/:slug`

Get one article by slug.

### PUT `/api/articles/:slug`

Update article (owner-only behavior enforced by `editorUsername`).

Request:

```json
{
  "title": "Updated title",
  "content": "# Updated markdown",
  "tags": ["history"],
  "editorUsername": "alex"
}
```

### DELETE `/api/articles/:slug?username=:username`

Delete article (owner-only behavior enforced by username query parameter).

### POST `/api/articles/:slug/view`

Increment article view count.

### POST `/api/articles/:slug/like`

Add like for a user (one-like-per-user behavior).

Request:

```json
{
  "username": "alex"
}
```

## Profiles

### GET `/api/profiles/:username`

Get profile by username.

### POST `/api/profiles/:username`

Create/update profile theme color.

Request:

```json
{
  "themeColor": "#2563eb"
}
```

## Error Format

Errors return JSON with:

```json
{
  "error": "Human-readable message"
}
```

In non-production mode, responses may also include `details`.

## Rate Limiting

Write-heavy endpoints include in-memory rate limiting:
- article create/update/delete
- likes/views
- profile updates

For multi-instance production scale, replace with shared-store rate limiting.
