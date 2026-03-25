# Architecture

Mini Wiki Platform uses a modular client/server architecture designed for progressive enhancement and eventual PostgreSQL migration.

## System Overview

- React SPA frontend (`client`)
- Express API backend (`server`)
- SQLite file database (`server/db/wiki.db`)
- Socket.io event channel for collaborative editing and like updates
- OpenAI API for summary generation

## Frontend Architecture

### Core Layers

- `context/AuthContext.jsx`
  - token/session lifecycle
  - profile preferences and theme application
- `utils/api.js`
  - centralized API client
  - environment-driven API + socket URLs
- `pages/*`
  - route-level screens (`Home`, `View`, `Edit`, `LorePage`, `Profile`, `GraphPage`, auth pages)
- `components/*`
  - reusable UI modules (editor, comments, search, graph, modals)

### UX Structure

- Sidebar-driven primary navigation
- Modal workflows for create/edit/profile customization
- Framer Motion for route transitions, hover elevation, and modal animations
- Graph canvas on dedicated `/graph` route for network exploration

## Backend Architecture

### API Modules

- `routes/auth.js`: register/login
- `routes/pages.js`: page CRUD-like flows, graph data, likes, relation suggestions
- `routes/lore.js`: keyword glossary/index retrieval
- `routes/comments.js`: page comments
- `routes/profile.js`: profile settings + user activity stats
- `routes/ai.js`: summary generation endpoint

### Middleware

- `authMiddleware`: required JWT authentication
- `optionalAuth`: best-effort user context for mixed public/private routes

### Realtime Layer

- `sockets/editorSocket.js`
  - collaborative content updates (`content-change`)
  - page room presence events
  - like update broadcasts

## Data Model

### users

- `id` (TEXT UUID, PK)
- `username` (TEXT, unique)
- `password_hash` (TEXT)
- `created_at` (TEXT ISO)

### user_profiles

- `user_id` (TEXT, PK/FK users.id)
- `accent_color` (TEXT)
- `theme` (`light | dark | custom`)
- `card_style` (`rounded | glass | minimal`)
- `updated_at` (TEXT ISO)

### pages

- `id` (TEXT UUID, PK)
- `owner_id` (TEXT FK users.id)
- `title` (TEXT)
- `content` (TEXT)
- `tags` (TEXT JSON array)
- `visibility` (`public | private`)
- `ai_summary` (TEXT)
- `related_articles` (TEXT JSON array of page IDs)
- `views` (INTEGER)
- `likes` (INTEGER)
- `created_at` (TEXT ISO)
- `updated_at` (TEXT ISO)

### page_likes

- `page_id` (TEXT FK pages.id)
- `user_id` (TEXT FK users.id)
- `created_at` (TEXT ISO)
- composite PK (`page_id`, `user_id`) for duplicate prevention

### comments

- `id` (TEXT UUID, PK)
- `page_id` (TEXT FK pages.id)
- `user_id` (TEXT FK users.id)
- `content` (TEXT)
- `created_at` (TEXT ISO)

### lore

- `id` (TEXT PK)
- `keyword` (TEXT)
- `related_page_ids` (TEXT JSON array)
- `updated_at` (TEXT ISO)

## Lore System Design

1. On page create/update, backend rebuilds lore index.
2. Keyword extraction scans page title/content and removes stopwords.
3. Keywords map to related page IDs in `lore` table.
4. Lore route filters related pages by access permissions.
5. UI surfaces knowledge base in sidebar and dedicated `/lore` page.

## Knowledge Graph Design

1. Each page stores explicit relationships in `related_articles`.
2. Backend enforces bidirectional links during save/update.
3. `/api/pages/graph` emits `nodes` and `links` payload.
4. `GraphView` renders network with zoom/pan/highlight behavior.
5. Node details modal links users directly into page workflows.

## Engagement Tracking

- `views` increments on successful page load (`GET /pages/:id`)
- `likes` increments through like endpoint with duplicate guard table
- profile stats aggregate page-level likes/views for owner dashboards

## Data Flow Example: Edit + Graph Update

1. User opens edit modal.
2. Client requests relation suggestions.
3. User edits content and related links.
4. Client submits PUT `/api/pages/:id`.
5. Server updates page, syncs bidirectional links, rebuilds lore.
6. Graph/lore endpoints now return updated connected structure.

## Migration Readiness Notes

- UUID primary keys and ISO timestamps are portable to PostgreSQL.
- JSON stored as TEXT can map to `jsonb` in PostgreSQL migration.
- route contracts are designed to remain stable during DB swap.
