# Changelog

All notable changes to 451-docs.

---

## [3.0.0] — 2026-03-25

### Architecture change: Netlify Functions + md-contents

Content is no longer copied into this repository at build time.
Markdown files live in `md-contents` (private) and are fetched at runtime via the GitHub Contents API through Netlify Functions.

#### Added
- `netlify/functions/posts.js` — `GET /api/posts`: returns post metadata list from `md-contents/451-docs/public_posts/`
- `netlify/functions/post.js` — `GET /api/post?slug=`: returns full post JSON including Markdown content
- `netlify/functions/_lib/github.js` — GitHub Contents API wrapper (uses `GITHUB_TOKEN` env var)
- `netlify/functions/_lib/frontmatter.js` — shared frontmatter parser extracted from build.js; supports nested blocks (e.g. `components:`)
- `netlify.toml` — Functions directory config + `/api/*` redirects
- `components` frontmatter field — per-post opt-in for KaTeX and Highlight.js; unspecified posts load neither library

#### Changed
- `post.html` — now fetches `/api/post?slug=` instead of `posts-data/{slug}.json`
- `index-logic.js` — now fetches `/api/posts` instead of reading `window.PUBLIC_POSTS`; falls back to `window.PUBLIC_POSTS` if the API is unreachable (local dev without `netlify dev`)
- `build.js` — demoted to local dev fallback only; no longer part of the production pipeline
- `package.json` — version bumped to 3.0.0; `npm run dev` now runs `netlify dev`

#### Removed
- `posts-data/` directory — no longer generated in production
- GitHub Actions workflow — `build.yml` and `notify.yml` are no longer needed (no copy step)
- `content/posts/` — no longer used in production (kept for local dev Option B)

---

## [2.0.0] — 2026-03-25

### Architecture change: slug-based routing

#### Added
- `post.html` — single HTML file serves all posts via `?slug=` query parameter
- `build.js` — new build script; outputs `posts-data/{slug}.json` instead of individual HTML files
- `package.json`
- `.github/workflows/build.yml` — auto-build on push or `repository_dispatch` from content repo
- `.github/workflows/notify.yml` (md-contents side) — triggers 451-docs build on `public_posts/` change
- `components` frontmatter field (initial design)

#### Changed
- `index-logic.js` — added `resolveHref()` to support both slug-style and legacy `outputFile` links
- `build.yml` — clones `md-contents` (not `451-docs-content`); copies `451-docs/public_posts/` to `content/posts/`

#### Removed
- Per-post HTML generation — `posts/*.html` files are no longer produced by the build

---

## [1.x] — Prior to 2026-03-25

- `build2.js` converting `posts/*.md` to `posts/*.html`
- `index.html` cards generated from `js/home-data.js`
- Password-protected posts via Supabase `protected_posts` table + client-side SHA-256 check