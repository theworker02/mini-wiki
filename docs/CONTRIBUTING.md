# Contributing

Thank you for contributing to Mini Wiki.

This project follows a minimal-change policy: extend existing architecture first, avoid duplication, and keep deployment behavior stable.

## Workflow

1. Branch from `main`.
2. Keep changes scoped and avoid duplicate systems/files.
3. Run local checks (`npm run dev`, `npm run build`).
4. Update docs when behavior, security, permissions, API, or deployment flow changes.
5. Open a pull request with test notes.

## Branch Naming

- `feature/<short-name>`
- `fix/<short-name>`
- `docs/<short-name>`
- `refactor/<short-name>`
- `chore/<short-name>`

## Commit Format

Use Conventional Commits:

```text
type(scope): summary
```

Examples:
- `feat(permissions): add apply-to-edit moderation flow`
- `fix(api): enforce editor-only direct article updates`
- `docs(deploy): clarify NEXT_PUBLIC_APP_URL post-deploy update`

## Architecture Rules

- Reuse existing routes/components/utilities before introducing new files.
- Do not create parallel implementations (for example `SearchBarNew`, `PermissionsV2`).
- Keep role and moderation logic centralized in shared data/API layers.
- Keep URL/domain configuration centralized in environment variables.

## Security Requirements

- Treat all input as untrusted.
- Validate/sanitize article title, content, tags, search query, username, and profile payloads.
- Keep markdown rendering hardened (no raw HTML execution, safe link protocols only).
- Preserve route-level rate limiting and permission checks.
- Do not expose secrets or stack traces in production responses.

## Permissions Contribution Rules

When editing permission logic, verify all four roles:

- `guest`: read-only
- `user`: can create pending articles and submit edit requests
- `editor`: can directly edit articles
- `admin`: can approve/reject submissions and promote users

Any role change must include:
- API enforcement (not just UI gating)
- UI state updates
- doc updates in `docs/README.md` and `docs/CHANGELOG.md`

## Deployment Rules

- Keep production domain in one place: `NEXT_PUBLIC_APP_URL`.
- Never hardcode production URLs across multiple files.
- If environment variables change in Vercel, redeploy.
- Validate post-deploy: search, `#topic`, likes/views, permissions, and moderation actions.

## PR Checklist

- App runs locally without blank screens.
- Build succeeds.
- No duplicate files/components/configs were introduced.
- Permission routes are protected against direct URL/API misuse.
- Docs updated for behavior/deployment/security changes.
- Changelog updated.
