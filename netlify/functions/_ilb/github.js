/**
 * github.js — thin wrapper around GitHub Contents API
 *
 * Uses GITHUB_TOKEN env var (set in Netlify environment variables).
 * Never exposed to the browser.
 *
 * Repo layout assumed:
 *   md-contents/
 *   └── 451-docs/
 *       └── public_posts/
 *           ├── seikei.md
 *           └── ...
 */

const REPO  = 'Shoei451/md-contents';
const BASE  = '451-docs/public_posts';
const API   = 'https://api.github.com';

function headers() {
  const token = process.env.GITHUB_TOKEN;
  return {
    'Accept':               'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

/**
 * List all .md files in public_posts/.
 * Returns array of { name, path, sha, download_url }.
 */
async function listPosts() {
  const url = `${API}/repos/${REPO}/contents/${BASE}`;
  const res = await fetch(url, { headers: headers() });

  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${await res.text()}`);
  }

  const items = await res.json();
  return items.filter(item => item.name.endsWith('.md'));
}

/**
 * Fetch raw Markdown content of a single post by slug.
 * slug = filename without .md extension.
 */
async function fetchPost(slug) {
  const url = `${API}/repos/${REPO}/contents/${BASE}/${slug}.md`;
  const res = await fetch(url, { headers: headers() });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${await res.text()}`);

  const json = await res.json();
  // Content is base64-encoded by the API
  return Buffer.from(json.content, 'base64').toString('utf-8');
}

module.exports = { listPosts, fetchPost };