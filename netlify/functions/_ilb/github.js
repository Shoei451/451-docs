/**
 * _lib/github.js — GitHub Contents API wrapper
 *
 * Reads from md-contents (private repo) using GITHUB_TOKEN env var.
 */

const REPO = 'Shoei451/md-contents';
const API  = 'https://api.github.com';

function ghHeaders() {
  const token = process.env.GITHUB_TOKEN;
  return {
    'Accept':               'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * List all .md files under a given path in md-contents.
 * @param {string} basePath  e.g. '451-docs/public_posts'
 */
async function listFiles(basePath) {
  const res = await fetch(`${API}/repos/${REPO}/contents/${basePath}`, { headers: ghHeaders() });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const items = await res.json();
  return items.filter(item => item.name.endsWith('.md'));
}

/**
 * Fetch raw Markdown content of a single file by path + slug.
 * @param {string} basePath  e.g. '451-docs/public_posts'
 * @param {string} slug      filename without .md
 * @returns {string|null}
 */
async function fetchRaw(basePath, slug) {
  const res = await fetch(
    `${API}/repos/${REPO}/contents/${basePath}/${slug}.md`,
    { headers: ghHeaders() }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return Buffer.from(json.content, 'base64').toString('utf-8');
}

module.exports = { listFiles, fetchRaw };