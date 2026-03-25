# UI Guidelines

This document defines visual and interaction standards for Mini Wiki Platform.

## Visual Identity

- Primary accent is user-configurable through profile settings.
- Base palette emphasizes off-white surfaces with slate contrast.
- Graph workspace intentionally uses deep dark background for node contrast.
- Logo and favicon are original, platform-specific assets.

## Layout System

- Shell layout: sticky top navbar + left sidebar + main content area.
- Card pattern: rounded border, subtle shadow (`shadow-card`), concise spacing.
- Primary spacing rhythm: 4/6/8/12/16px increments through Tailwind utilities.

## Typography

- Use clear, modern sans-serif stack for UI legibility.
- Heading hierarchy:
  - H1 route titles
  - H2 section titles
  - H3 sub-panels
- Keep body text compact and scannable for knowledge-heavy pages.

## Motion Principles

- All page transitions use fade + vertical slide (`AnimatedWrapper`).
- Modal appearance uses scale + fade (`Modal`).
- Hover interactions use gentle elevation (`y: -1` to `y: -3`).
- Motion should communicate hierarchy, not distract from reading.

## Modal Standards

Use modals for focused workflows:

- Create page
- Edit page
- Profile customization
- Graph node details

Rules:

- Click outside closes modal.
- Header always includes clear title + close action.
- Body should scroll when content exceeds viewport.

## Component Design Rules

- Components must be route-agnostic where possible.
- Keep API data fetching in pages or context layers.
- Reusable controls (`LikeButton`, `ViewCounter`, `SearchBar`) should be stateless when practical.
- Preserve responsive behavior from mobile to desktop.

## Color and Theme System

Theme classes:

- `theme-light`
- `theme-dark`
- `theme-custom`

User profile settings control:

- `--accent-color`
- body theme class
- card style mode (`rounded | glass | minimal`)

## Accessibility and UX Quality

- Maintain semantic heading structure.
- Buttons and links must have visible hover/focus affordance.
- Inputs must keep clear labels.
- Route changes should preserve orientation via clear page headers.

## Graph UX Guidance

- Dark canvas required for visual legibility of glowing nodes.
- Hover should highlight connected links.
- Search should focus/highlight matching node.
- Node click should expose metadata and navigation actions.
