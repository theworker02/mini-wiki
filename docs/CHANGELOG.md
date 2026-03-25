# Changelog

All notable changes are documented in this file.

## [8.1.0] - Phase 8 Final Hardening

### Added

- Added structured role permissions across API and UI:
  - `guest`
  - `user`
  - `editor`
  - `admin`
- Added article-level **Apply to Edit** flow for non-editor users
- Added admin moderation actions for:
  - pending article approval/rejection
  - edit request approval/rejection
- Added admin-driven editor promotion flow through existing profile API/UI

### Changed

- Updated article listing and article detail visibility to respect role + status (`published`, `pending`, `rejected`)
- Updated article creation behavior:
  - users create `pending` articles
  - editors/admins publish immediately
- Updated edit route behavior to enforce editor/admin direct edit permissions
- Updated docs for Phase 8 deployment + permissions workflow

### Fixed

- Fixed role consistency for `guest` profile handling
- Fixed direct edit exposure by enforcing server-side permission checks on mutation routes
- Fixed edit-request validation to require meaningful intent or proposed changes

## [8.0.0] - Phase 8

### Added

- Added final Vercel deployment workflow documentation with post-deploy domain update steps
- Added centralized production domain metadata behavior via `NEXT_PUBLIC_APP_URL`

### Changed

- Updated package version to `8.0.0`
- Updated environment variable examples for Vercel-first deployment
- Updated deployment docs with redeploy and custom-domain guidance
- Updated README and contributing guidance for production deployment operations
- Updated API documentation to reflect current Next.js serverless endpoints

### Fixed

- Removed stale localhost-only and Vite-specific URL guidance from production env examples
- Aligned docs with current architecture to prevent broken deployment assumptions

## [7.0.0] - Phase 7

### Added

- Added Phase 7 factual seed dataset (Industrial Revolution, Ancient Rome, World War II, Renaissance, Cold War, Internet, Space Exploration)
- Added ownership enforcement for edit/delete flows
- Added topic-query search mode (`#topic`) across API and UI
- Added security headers in Next.js config
- Added API route rate limiting on write-heavy endpoints

### Changed

- Hardened article/profile input sanitization and validation using shared utility functions
- Upgraded markdown rendering safety with URL sanitization and `skipHtml`
- Unified search parsing and filtering behavior across client and server
- Improved editor UX with inline validation, smart assist summary, and suggested tags
- Improved error handling to avoid leaking internal details in production

### Fixed

- Fixed editor initial value synchronization issues during async load
- Fixed delete and update route permission checks to avoid unauthorized writes
- Fixed malformed slug and malformed query handling in API routes
- Fixed search UI clarity for active `#topic` mode

## [6.0.0] - Phase 6

### Added

- Migrated architecture to Next.js App Router for Vercel deployment
- Added serverless API routes for articles and profiles
- Added PostgreSQL integration via `DATABASE_URL`
- Implemented article CRUD with markdown support
- Added instant fuzzy search and related articles engine
- Added connected map visualization for article relationships
- Added views and likes tracking with duplicate-like protection
- Added basic profile preferences (username + theme color)
- Added deployment-ready docs and Vercel config

## [5.0.0] - Phase 5

### Added

- Lore/knowledge base index with keyword browsing (`/lore`)
- Interactive knowledge graph page (`/graph`) with node modal
- Bidirectional related-article synchronization on save
- Engagement model with page views + per-user likes
- Fuzzy real-time search suggestions via Fuse.js
- Profile customization modal (accent/theme/card style)
- Original branding assets (custom logo + favicon)
- `UI_GUIDELINES.md` documentation

### Changed

- Page editor upgraded to split markdown editor + live preview
- Frontend API/socket configuration moved to env-driven values
- Lore endpoint now permission-filters private page visibility
- Graph rendering upgraded with focus/highlight effects

### Fixed

- Like route now enforces page access rules
- Relation suggestion endpoint restricted to page owner
- Related article display now resolves titles instead of raw IDs

## [3.0.0] - Phase 3

### Added

- JWT authentication (register/login)
- User account storage with bcrypt password hashing
- Public/private page visibility
- Owner-only edit authorization
- AI summaries via OpenAI API
- Real-time collaborative editing with Socket.io
- Comments system

## [2.0.0] - Phase 2

### Added

- Tagging support and filtered search behavior
- Enhanced editor and UI polish

## [1.0.0] - Phase 1

### Added

- Initial full-stack wiki CRUD foundation
- Markdown rendering
- Basic search and sidebar navigation
