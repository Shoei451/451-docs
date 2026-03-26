# Changelog

All notable project changes for `451-docs`.

---

## 2026-03-26

### Completed
- Protected content flow is fully server-driven via Netlify Functions:
  - `GET /api/protected-posts` returns protected post metadata.
  - `GET /api/protected-post?slug=&password=` validates password on the server and returns post data without exposing frontmatter `password`.
- Shared backend utilities were introduced under `netlify/functions/_lib/`:
  - `github.js` for GitHub Contents API access
  - `frontmatter.js` for frontmatter parsing and post DTO builders
  - `cors.js` for CORS headers and OPTIONS handling
- Subfolder slugs are supported for both public and protected posts.
- Frontend post utilities were consolidated in `js/post-common.js`:
  - dynamic component loading (KaTeX and highlight.js)
  - TOC generation
  - table scroll wrappers
  - page loader controls
- Home page (`js/index-logic.js`) now merges public and protected metadata into one date-sorted card feed.

### Notes
- The current runtime architecture no longer requires generated post files in this repository.
- Some legacy scaffolding still exists and is tracked in `md/roadmap.md` and `md/todo.md`.

---

## 2026-03-25

### Completed
- Architecture moved from build-generated local content to runtime content delivery through Netlify Functions and GitHub Contents API.
- Public post endpoints were introduced:
  - `GET /api/posts`
  - `GET /api/post?slug=`
- Single post page routing via `post.html?slug=` was established.
- `netlify.toml` was updated for `/api/*` redirects and functions directory mapping.

---

## Before 2026-03-25

### Legacy behavior
- Per-post static generation flow (older build-based approach).
- Earlier protected-post logic included client-heavy handling before server-side validation was introduced.
