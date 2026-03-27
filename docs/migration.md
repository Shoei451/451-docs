# Migration Notes (Historical)

Last updated: 2026-03-26

This document records the migration from build-generated post files to runtime content delivery.
It is a reference log, not an active implementation guide.

## Migration outcome

The migration objective is complete:

- Content source is a private repo: `Shoei451/md-contents`.
- `451-docs` serves content at runtime via Netlify Functions and GitHub Contents API.
- Public posts:
  - list: `/api/posts`
  - single post: `/api/post?slug=`
- Protected posts:
  - list: `/api/protected-posts`
  - single post with server-side password check: `/api/protected-post?slug=&password=`
- Post routes are slug-based:
  - `post.html?slug=...`
  - `protected-post.html?slug=...`

## What changed from the old model

| Old model | Current model |
|---|---|
| Local markdown copied into this repo and transformed during build | Markdown stays in private repo and is fetched at request time |
| Build artifacts (`posts-data` or per-post generated files) used for rendering | Netlify Functions return metadata/post payloads directly |
| Mixed client-heavy protected flow | Password verification handled on server function |

## Important post-migration note

Some legacy files/scripts remain in the repository and should be treated as cleanup work, not as active architecture:

- `package.json` scripts still reference `build.js` (currently missing).
- `.github/workflows/build.yml` still reflects an older content-copy pipeline.

Track this cleanup in `md/roadmap.md` (M4 and M5).

## Current recommended dev path

1. Run with `netlify dev` for local API + frontend behavior.
2. Keep content changes in `md-contents`.
3. Keep `451-docs` focused on UI and functions code.
