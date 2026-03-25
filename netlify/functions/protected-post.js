/**
 * Netlify Function: protected-post
 * Route: GET /api/protected-post?slug={slug}&password={raw_password}
 *
 * Verifies password server-side against frontmatter `password` field.
 * Never returns the password field to the client.
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

async function fetchRaw(slug) {
  const res = await fetch(`${API}/repos/${REPO}/contents/${BASE}/${slug}.md`, { headers: ghHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return Buffer.from(json.content, 'base64').toString('utf-8');
}

// ── Frontmatter parser ──────────────────────────────────
const DEFAULT_COMPONENTS = { katex: false, highlight: false };

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

function buildPostData(slug, rawMd) {
  const { meta, content } = parseFrontmatter(rawMd);

  // password は絶対に返さない
  return {
    slug,
    title:      meta.title      || slug,
    date:       meta.date       || '',
    excerpt:    meta.excerpt    || '',
    thumbnail:  meta.thumbnail  || '',
    category:   meta.category   || '',
    tags:       meta.tags ? meta.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    components: Object.assign({}, DEFAULT_COMPONENTS,
                  typeof meta.components === 'object' ? meta.components : {}),
    content,
  };
}

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

  const slug     = (event.queryStringParameters?.slug     || '').trim();
  const password = (event.queryStringParameters?.password || '').trim();

  if (!slug || !/^[\w-]+$/.test(slug)) {
    return { statusCode: 400, headers: CORS,
             body: JSON.stringify({ error: 'Invalid or missing slug.' }) };
  }

  if (!password) {
    return { statusCode: 400, headers: CORS,
             body: JSON.stringify({ error: 'Password required.' }) };
  }

  try {
    const raw = await fetchRaw(slug);

    // "not found" と "wrong password" を区別しない
    if (!raw) {
      return { statusCode: 401, headers: CORS,
               body: JSON.stringify({ error: 'Invalid password or post not found.' }) };
    }

    const { meta } = parseFrontmatter(raw);
    if (!meta.password || meta.password !== password) {
      return { statusCode: 401, headers: CORS,
               body: JSON.stringify({ error: 'Invalid password or post not found.' }) };
    }

    return { statusCode: 200, headers: CORS,
             body: JSON.stringify(buildPostData(slug, raw)) };

  } catch (err) {
    console.error('[protected-post] error:', err);
    return { statusCode: 502, headers: CORS,
             body: JSON.stringify({ error: 'Failed to fetch post.' }) };
  }
};