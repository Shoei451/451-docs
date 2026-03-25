# 451-docs

Personal notes site — [451-docs.netlify.app](https://451-docs.netlify.app)

Static frontend + Netlify Functions. Markdown content lives in a separate private repository ([md-contents](https://github.com/Shoei451/md-contents)) and is served via GitHub API at request time. No build step required for content updates.

---

## Architecture

```
Browser
  │
  ├── GET /              → index.html (static)
  │     └── fetch /api/posts  → Netlify Function → GitHub API
  │                               md-contents/451-docs/public_posts/
  │
  └── GET /post.html?slug=xxx
        └── fetch /api/post?slug=xxx → Netlify Function → GitHub API
                                        md-contents/451-docs/public_posts/{slug}.md
```

All Markdown is fetched at runtime from `md-contents` (private repo) via the GitHub Contents API. The `451-docs` repo contains only code — no generated HTML, no copied JSON files.

Protected posts (password-gated) remain on Supabase for now and will be migrated to Netlify Functions in Phase 2.

---

## Repository Layout

```
451-docs/                          ← this repo (public)
├── index.html                     ← home page
├── post.html                      ← single-post viewer (slug-based)
├── protected-post.html            ← password-gated post viewer (Supabase)
├── netlify.toml                   ← Functions config + API redirects
├── netlify/
│   └── functions/
│       ├── posts.js               ← GET /api/posts
│       ├── post.js                ← GET /api/post?slug=
│       └── _lib/
│           ├── github.js          ← GitHub Contents API wrapper
│           └── frontmatter.js     ← shared frontmatter parser
├── build.js                       ← local dev fallback (not used in prod)
├── package.json
├── css/
│   ├── styles.css
│   ├── theme.css
│   ├── home.css
│   └── protected-post.css
├── js/
│   ├── script.js
│   ├── theme-toggle.js
│   ├── index-logic.js
│   ├── config.js                  ← Supabase config (gitignored)
│   └── supabase-client.js
└── images/

md-contents/                       ← separate private repo
└── 451-docs/
    ├── public_posts/              ← served via /api/posts + /api/post
    │   ├── seikei.md
    │   └── chinese-dinasities-table-1.md
    └── protected_posts/           ← not served (future: Netlify Function auth)
        └── past-exam1.md
```

---

## Adding a Post

1. Write `your-post.md` in `md-contents/451-docs/public_posts/` with frontmatter:

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

2. Push to `md-contents` main branch.
3. The post is live immediately — no rebuild needed.

### `components` field

Controls which libraries `post.html` loads for this post. Omitting the block defaults both to `false`.

| Key | Default | When to enable |
|---|---|---|
| `katex` | `false` | Post contains math expressions (`$...$` or `$$...$$`) |
| `highlight` | `false` | Post contains fenced code blocks |

---

## Netlify Environment Variables

Set these in Netlify → Site settings → Environment variables:

| Variable | Value | Notes |
|---|---|---|
| `GITHUB_TOKEN` | GitHub PAT | Needs `contents: read` on `md-contents`. Fine-grained PAT recommended. |

Without `GITHUB_TOKEN` the Functions fall back to unauthenticated GitHub API (60 req/hr rate limit).

---

## Local Development

### Option A — netlify dev (recommended)

Runs Functions locally with real GitHub API calls. Requires `GITHUB_TOKEN` in `.env`.

```bash
# .env (gitignored)
GITHUB_TOKEN=github_pat_...

npm run dev   # starts netlify dev
```

Open `http://localhost:8888`.

### Option B — static fallback

If you don't want to call the GitHub API locally, copy some MD files and build static JSON:

```bash
mkdir -p content/posts
cp /path/to/md-contents/451-docs/public_posts/*.md content/posts/
node build.js          # generates posts-data/*.json
npx serve .            # open http://localhost:3000
```

`index-logic.js` falls back to `window.PUBLIC_POSTS` (from `js/home-data.js`) when `/api/posts` fails — so static JSON works as a fallback.

---

## Deployment

Push to `main` → Netlify auto-deploys. No build command needed (`netlify.toml` sets `echo 'No build step'`).

Content updates in `md-contents` are live instantly without a Netlify deploy.

---

## Roadmap

See [md/roadmap.md](./md/roadmap.md) for the execution roadmap and [md/plan.md](./md/plan.md) for the design summary.

| Phase | Status | Description |
|---|---|---|
| 1 — slug system | ✅ Done | Single `post.html`, no per-post HTML files |
| 1 — Netlify Functions | ✅ Done | md-contents served via GitHub API |
| 2 — Protected posts | 🔜 Next | Netlify Function auth replacing Supabase dependency |
| 3 — RSS | Planned | |
| 3 — JS/CSS consolidation | Planned | |
