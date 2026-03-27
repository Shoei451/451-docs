# 451-docs Project Plan (Summary)

Last updated: 2026-03-26

## Objective

Run a lightweight notes site where Markdown content stays in a private repository and the public site serves content at runtime through Netlify Functions.

## Current architecture baseline

- Public and protected posts are fetched from `Shoei451/md-contents` via GitHub Contents API.
- `post.html?slug=` is the single public post viewer.
- `protected-post.html?slug=` is the single password-gated viewer.
- Password checks for protected posts happen on the server (`/api/protected-post`), not in browser-only logic.
- Per-post optional libraries (`katex`, `highlight`) are loaded dynamically from frontmatter flags.

## What is complete

- Runtime API delivery for public posts.
- Runtime API delivery for protected posts.
- Shared helper layers for frontmatter parsing, GitHub access, and CORS.
- Unified home feed rendering for public and protected metadata.

## What remains

- Align release/versioning metadata with current architecture state.
- Optional product improvements (RSS, further JS/CSS cleanup) after stabilization.

## Source-of-truth links

- Execution status and priorities: `md/roadmap.md`
- Completed history: `md/changelog.md`
- Quick capture inbox: `md/todo.md`
