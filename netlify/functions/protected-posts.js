/**
 * Netlify Function: protected-posts
 * Route: GET /api/protected-posts
 *
 * Returns metadata list of protected posts (no content, no password).
 * Reads from md-contents/451-docs/private_posts/ via GitHub API.
 *
 * NOTE: _lib/ helpers are intentionally inlined here to avoid
 * Netlify bundler issues with local require() resolution.
 */

// ── GitHub API ──────────────────────────────────────────
const REPO = 'Shoei451/md-contents';
const BASE = '451-docs/private_posts';
const API  = 'https://api.github.com';

function ghHeaders() {
  const token = process.env.GITHUB_TOKEN;
  return {
    'Accept':               'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function listFiles() {
  const res = await fetch(`${API}/repos/${REPO}/contents/${BASE}`, { headers: ghHeaders() });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const items = await res.json();
  return items.filter(item => item.name.endsWith('.md'));
}

async function fetchRaw(slug) {
  const res = await fetch(`${API}/repos/${REPO}/contents/${BASE}/${slug}.md`, { headers: ghHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return Buffer.from(json.content, 'base64').toString('utf-8');
}

// ── Frontmatter parser ──────────────────────────────────
function parseFrontmatter(raw) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw };

  const meta = {};
  let block = null;

  for (const line of match[1].split('\n')) {
    if (/^\s+\S/.test(line)) {
      if (!block) continue;
      const c = line.indexOf(':');
      if (c === -1) continue;
      const k = line.slice(0, c).trim();
      const v = line.slice(c + 1).trim();
      if (k) meta[block][k] = v === 'true' ? true : v === 'false' ? false : v;
      continue;
    }
    block = null;
    const c = line.indexOf(':');
    if (c === -1) continue;
    const k = line.slice(0, c).trim();
    const v = line.slice(c + 1).trim();
    if (!k) continue;
    if (v === '') { meta[k] = {}; block = k; } else { meta[k] = v; }
  }

  return { meta, content: match[2] };
}

function buildMeta(filename, rawMd) {
  const slug = filename.replace(/\.md$/i, '');
  const { meta } = parseFrontmatter(rawMd);

  // password は絶対に返さない
  return {
    slug,
    title:     meta.title     || slug,
    date:      meta.date      || '',
    excerpt:   meta.excerpt   || '',
    thumbnail: meta.thumbnail || '',
    category:  meta.category  || '',
    tags:      meta.tags ? meta.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
  };
}

// ── In-process cache ────────────────────────────────────
let cache = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

// ── Handler ─────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type':                 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  if (cache && Date.now() - cache.cachedAt < CACHE_TTL_MS) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify(cache.data) };
  }

  try {
    const files = await listFiles();

    const metaList = (await Promise.all(
      files.map(async (file) => {
        const slug = file.name.replace(/\.md$/i, '');
        const raw  = await fetchRaw(slug);
        return raw ? buildMeta(file.name, raw) : null;
      })
    ))
      .filter(Boolean)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    cache = { data: metaList, cachedAt: Date.now() };
    return { statusCode: 200, headers: CORS, body: JSON.stringify(metaList) };

  } catch (err) {
    console.error('[protected-posts] error:', err);
    return { statusCode: 502, headers: CORS,
             body: JSON.stringify({ error: 'Failed to fetch protected posts list.' }) };
  }
};