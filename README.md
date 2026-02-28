# 451-docs

A lightweight static notes site with:

- Public posts generated from Markdown
- Optional password-protected posts served via Supabase
- A small browser-based toolbox

## Project Structure

- `index.html`: Home page
- `build2.js`: Markdown-to-HTML build script
- `posts/`: Generated HTML posts (and temporary Markdown input before build)
- `drafts/`: Markdown source files after build
- `posts.json`: Metadata index for public posts
- `js/home-data.js`: Auto-generated list used by the home page
- `protected-post.html`: Protected post viewer
- `js/supabase-client.js`: Supabase API client for protected content
- `toolbox/`: Utility pages (e.g., password hasher, Dropbox link converter)

## How Public Post Build Works

1. Put Markdown files in `posts/`.
2. Run:

```bash
node build2.js
```

3. The script will:
- Convert `posts/*.md` to `posts/*.html`
- Update `posts.json`
- Regenerate `js/home-data.js`
- Sync parts of `index.html` (post count / script injection)
- Move processed `.md` files to `drafts/`

## Optional Watch Mode

```bash
node build2.js --watch
```

This watches `posts/` for new Markdown files and rebuilds automatically.

## Protected Posts (Supabase)

Protected posts are fetched client-side from Supabase.

- Config file: `js/config.js`
- Required keys:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`

The page `protected-post.html` + `js/protected-post.js` handles password input and rendering.

## Local Preview

This is a static site. Use any local static server, for example:

```bash
npx serve .
```

Then open the local URL in your browser.

## Notes

- No npm package setup is required for the current build script.
- Generated and source content are intentionally split between `posts/` and `drafts/` by `build2.js`.
