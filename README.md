# 451-docs

Personal notes site — [451-docs.netlify.app](https://451-docs.netlify.app)

Static frontend + Netlify Functions. Markdown content lives in a separate private repository and is fetched at runtime via the GitHub Contents API. No build step required for content updates.

---

## Architecture

```
Browser
  │
  ├── GET /                    → index.html (static)
  │     ├── fetch /api/posts        → Netlify Function → GitHub API
  │     └── fetch /api/protected-posts → Netlify Function → GitHub API
  │                                      md-contents/451-docs/protected_posts/
  │
  ├── GET /post.html?slug=xxx
  │     ├── fetch /api/posts?site=...   → Netlify Function (site accent/ui)
  │     └── fetch /api/post?slug=xxx    → Netlify Function → GitHub API
  │                                        md-contents/451-docs/public_posts/{slug}.md
  │
  └── GET /protected-post.html?slug=xxx
        ├── fetch /api/posts?site=...    → Netlify Function (site accent/ui)
        └── fetch /api/protected-post?slug=xxx&password=xxx
                                            → Netlify Function → GitHub API
                                              md-contents/451-docs/protected_posts/{slug}.md
                                              (password verified server-side)
```

All Markdown is fetched at runtime from `md-contents` (private repo) via the GitHub Contents API. The `451-docs` repo contains only code — no generated HTML, no copied JSON files.

---

## Repository Layout

```
451-docs/                          ← this repo (public)
├── index.html                     ← home page (card grid + sidebar)
├── post.html                      ← public post viewer (?slug=)
├── protected-post.html            ← password-gated post viewer (?slug=)
├── netlify.toml                   ← Functions config + /api/* redirects
├── package.json
│
├── netlify/
│   └── functions/
│       ├── posts.js               ← GET /api/posts
│       ├── post.js                ← GET /api/post?slug=
│       ├── protected-posts.js     ← GET /api/protected-posts
│       ├── protected-post.js      ← GET /api/protected-post?slug=&password=
│       └── _lib/
│           ├── github.js          ← GitHub Contents API wrapper
│           ├── frontmatter.js     ← shared frontmatter parser + post builders
│           ├──config.js           ← cofiguration (REPO, BASE_PUBLIC, BASE_PROTECTED)
│           └── cors.js            ← shared CORS headers + OPTIONS handler
│
├── css/
│   ├── styles.css                 ← global styles, sidebar, TOC, loader
│   ├── theme.css                  ← dark/light theme toggle button
│   ├── home.css                   ← profile hero + card grid
│   └── protected-post.css         ← password overlay + post header
│
├── js/
│   ├── theme-toggle.js            ← dark mode persistence (localStorage)
│   ├── index-logic.js             ← home page: fetch posts, render cards, category filter
│   ├── post-common.js             ← shared: ComponentLoader, buildToc(), loaderStart/Done()
│   ├── public-post.js
│   ├── protected-post.js          ← password form logic, slug validation, post render
│   └── script.js                  ← (legacy TOC, kept for reference)
│
└── images/

md-contents/                       ← separate private repo
└── 451-docs/
    ├── public_posts/              ← served via /api/posts + /api/post
    │   ├── some-post.md
    │   └── subfolder/some-post.md ← subfolders supported
    └── protected_posts/           ← served via /api/protected-posts + /api/protected-post
        ├── past-exam1.md
        └── geography/topic.md     ← subfolders supported
```

---

## Adding a Post

### Public post

Create `your-post.md` in `md-contents/451-docs/public_posts/` with frontmatter:

```markdown
---
title: Post Title
date: 2026-03-10
description: One-line description shown on the index card.
thumbnail: https://example.com/image.png
category: history
components:
  katex: false
  highlight: false
---

# Content here...
```

Push to `md-contents` main branch. The post is live immediately — no rebuild needed.

### Protected post

Create `your-post.md` in `md-contents/451-docs/protected_posts/` with frontmatter:

```markdown
---
title: Post Title
date: 2026-03-10
excerpt: One-line description shown on the index card.
thumbnail: https://example.com/image.png
category: 受験
tags: 東大, 英語
password: mysecret
components.katex: false
components.highlight: false
---

# Content here...
```

The password is verified server-side by the Netlify Function. It is never sent to the browser.

### `components` field

Controls which libraries `post.html` / `protected-post.html` load for this post. Omitting the block defaults both to `false`.

| Key         | Default | When to enable                                        |
| ----------- | ------- | ----------------------------------------------------- |
| `katex`     | `false` | Post contains math expressions (`$...$` or `$$...$$`) |
| `highlight` | `false` | Post contains fenced code blocks                      |

### Frontmatter rules

All fields must be written **without leading spaces**. Indented lines are interpreted as nested blocks (the `components:` key uses this intentionally). A misplaced space before `title:` will cause the parser to silently skip the field.

```yaml
# ✓ correct
title: My Post
date: 2026-03-10

# ✗ wrong — title will not be parsed
 title: My Post
```

### Subfolder slugs

Both `public_posts/` and `protected_posts/` support subfolders of arbitrary depth. The slug mirrors the path relative to the base directory.

```
protected_posts/geography/landforms.md  →  slug: geography/landforms
public_posts/math/calculus/limits.md    →  slug: math/calculus/limits
```

Link as: `post.html?slug=math/calculus/limits`

---

## Netlify Environment Variables

Set in Netlify → Site settings → Environment variables:

| Variable       | Value      | Notes                                                                                                                                        |
| -------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `GITHUB_TOKEN` | GitHub PAT | Needs `contents: read` on `md-contents`. Fine-grained PAT recommended. Without this, the GitHub API falls back to 60 req/hr unauthenticated. |

---

## Local Development— netlify dev

Runs Functions locally with real GitHub API calls. Requires `GITHUB_TOKEN` in `.env`.

```bash
# .env (gitignored)
GITHUB_TOKEN=github_pat_...

npm run dev   # starts netlify dev
```

Open `http://localhost:8888`.

---

## Deployment

Push to `main` → Netlify auto-deploys. No build command (`netlify.toml` sets `echo 'No build step'`).

Content updates in `md-contents` are live instantly without a Netlify deploy.

---

## API Reference

All routes return `application/json` with CORS headers (`Access-Control-Allow-Origin: *`).

| Route                                 | Method | Description                                                                                           |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| `/api/posts`                          | GET    | Public post metadata list, sorted by date descending. No content field.                               |
| `/api/post?slug=`                     | GET    | Full public post including parsed Markdown content. `404` if not found.                               |
| `/api/protected-posts`                | GET    | Protected post metadata list (no content, no password). Cached 60s.                                   |
| `/api/protected-post?slug=&password=` | GET    | Full protected post after server-side password verification. `401` on wrong password or missing post. |

---

## Design System

Font stack: `DM Serif Display` (headings) + `DM Sans` (body).

CSS variables (defined in `css/styles.css`):

| Variable    | Light     | Dark      |
| ----------- | --------- | --------- |
| `--bg`      | `#ffffff` | `#0f172a` |
| `--surface` | `#f9fafb` | `#1e293b` |
| `--text`    | `#222`    | `#f1f5f9` |
| `--sub`     | `#6b7280` | `#94a3b8` |
| `--border`  | `#e5e7eb` | `#334155` |
| `--accent`  | `#3b82f6` | `#60a5fa` |

Dark mode is toggled by `body.dark` and persisted to `localStorage` via `js/theme-toggle.js`.

`--accent` is overridden per site from `netlify/functions/_lib/config.js` (`accent`, `accentDark`), and this override is applied on `index.html`, `post.html`, and `protected-post.html`.

---

## Roadmap

See [`md/roadmap.md`](./md/roadmap.md) for the full execution roadmap.

| Phase                    | Status  | Description                                               |
| ------------------------ | ------- | --------------------------------------------------------- |
| 1 — slug system          | ✅ Done | Single `post.html`, no per-post HTML files                |
| 1 — Netlify Functions    | ✅ Done | md-contents served via GitHub API at runtime              |
| 2 — Protected posts      | ✅ Done | Server-side password verification, no Supabase dependency |
| 3 — RSS                  | Planned |                                                           |
| 3 — JS/CSS consolidation | Planned |                                                           |
