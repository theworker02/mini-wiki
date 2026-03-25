# Mini Wiki Platform (Phase 8)

Mini Wiki is a production-ready, deployment-focused knowledge platform built on Next.js App Router with serverless API routes and PostgreSQL-ready data access.

## Screenshots

### Homepage

![Mini Wiki homepage](../assets/GitHub2.png)

### Article View

![Mini Wiki article page](../assets/GitHub1.png)

### Editor Experience

![Mini Wiki sign up page](../assets/GitHub3.png)

Phase 8 finalizes:
- Vercel deployment readiness
- domain-first configuration
- structured role permissions
- controlled editing with an "Apply to Edit" workflow

## What Is Implemented

- Markdown article platform with create, read, update, delete
- Real-time search suggestions with fuzzy matching
- `#topic` tag filtering
- Related-article recommendations
- Knowledge graph page and connected navigation
- Views + likes engagement tracking
- Profile preferences (username + accent color)
- Production-safe input sanitization and rate limiting
- Role-based permissions with admin moderation

## Permissions Model

### Guest
- Can read published content only
- Cannot create, edit, like, or submit edit requests

### User (default)
- Can read published content
- Can create new articles (created as `pending` for admin review)
- Cannot directly edit existing articles
- Can submit edit requests through **Apply to Edit**

### Editor (approved editor)
- Can directly edit existing articles
- Can create articles that publish immediately

### Admin
- Can approve/reject pending article submissions
- Can approve/reject edit requests
- Can promote users to editor
- Can moderate content lifecycle end-to-end

## Apply to Edit Workflow

1. A non-editor user opens an article.
2. They click **Apply to Edit** and submit intent/proposed changes.
3. A pending edit request is stored.
4. Admin reviews and approves or rejects.
5. If approved, the requested update is applied and article remains/publishes as `published`.

## Real Seed Content

When the database is empty, the app seeds interconnected factual content:
- The Industrial Revolution
- Ancient Rome
- World War II
- The Renaissance
- The Cold War
- The Internet
- Space Exploration

## Local Setup

1. Copy env template:

```bash
cp .env.example .env.local
```

2. Set environment variables:

```env
DATABASE_URL=postgres://username:password@your-neon-host.neon.tech/miniwiki?sslmode=require
NEXT_PUBLIC_APP_URL=http://localhost:3000
KV_REST_API_URL=
```

3. Install and run:

```bash
npm install
npm run dev
```

4. Open `http://localhost:3000`.

## Vercel Deployment

1. Push repository to GitHub.
2. Import repository into Vercel.
3. Set environment variables in Vercel:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_APP_URL`
   - `KV_REST_API_URL` (optional)
4. Deploy.
5. After first deploy, copy assigned Vercel domain (example: `https://mini-wiki-abc123.vercel.app`).
6. Update `NEXT_PUBLIC_APP_URL` in Vercel to that exact live URL.
7. Redeploy.

## Single Domain Configuration Point

`NEXT_PUBLIC_APP_URL` is the single source of truth for production URL usage.

It powers:
- metadata base URL
- canonical URL generation
- Open Graph URL generation

To switch from preview URL to custom domain, only update `NEXT_PUBLIC_APP_URL` and redeploy.

## Search Behavior

- Normal query example: `history`
- Topic query example: `#history`
- `#topic` search filters by tags and is indicated in the UI
- Search inputs are sanitized before use

## Security and Hardening

- Input validation + sanitization for article/profile/search payloads
- Safe markdown rendering (`skipHtml` + safe URL transform)
- Slug, username, tags, and theme validation utilities
- API rate limiting on write-heavy endpoints
- Production-safe error responses (no stack leaks)
- Ownership and role checks on mutation routes

## Project Structure

```text
mini-wiki/
  app/
    api/articles/route.ts
    api/articles/[slug]/route.ts
    api/articles/[slug]/like/route.ts
    api/articles/[slug]/view/route.ts
    api/profiles/[username]/route.ts
    article/[slug]/page.tsx
    create/page.tsx
    edit/[slug]/page.tsx
    page.tsx
    layout.tsx
  components/
    ArticleCard.tsx
    Editor.tsx
    Navbar.tsx
    ProfileProvider.tsx
    RelatedArticles.tsx
    SearchBar.tsx
  lib/
    db.ts
    utils.ts
```

## Related Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [API.md](./API.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [LICENSE](./LICENSE)


## 🚀 Live Demo

[Open App](https://mini-wiki-1.vercel.app)
