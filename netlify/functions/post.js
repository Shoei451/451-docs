/**
 * Netlify Function: post
 * Route: GET /api/post?slug={slug}
 *
 * Returns full post JSON including Markdown content.
 * _lib/ helpers are inlined to avoid Netlify bundler path issues.
 */

// ── GitHub API ──────────────────────────────────────────
const REPO = 'Shoei451/md-contents';
const BASE = '451-docs/public_posts';
const API  = 'https://api.github.com';

function ghHeaders() {
  const token = process.env.GITHUB_TOKEN;
  return {
    'Accept':               'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchPost(slug) {
  const url = `${API}/repos/${REPO}/contents/${BASE}/${slug}.md`;
  const res = await fetch(url, { headers: ghHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return Buffer.from(json.content, 'base64').toString('utf-8');
}

// ── Frontmatter parser ──────────────────────────────────
const DEFAULT_COMPONENTS = { katex: false, highlight: false };

function buildPostData(filename, rawMd) {
  const slug  = filename.replace(/\.md$/i, '');
  const match = rawMd.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);

  if (!match) {
    return { slug, title: slug, date: '', description: '', thumbnail: '',
             category: '', components: { ...DEFAULT_COMPONENTS }, content: rawMd };
  }

  const meta = {};
  let block  = null;

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

  return {
    slug,
    title:       meta.title       || slug,
    date:        meta.date        || '',
    description: meta.description || '',
    thumbnail:   meta.thumbnail   || '',
    category:    meta.category    || '',
    components:  Object.assign({}, DEFAULT_COMPONENTS,
                   typeof meta.components === 'object' ? meta.components : {}),
    content:     match[2],
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

  const slug = (event.queryStringParameters?.slug || '').trim();
  if (!slug || !/^[\w-]+$/.test(slug)) {
    return { statusCode: 400, headers: CORS,
             body: JSON.stringify({ error: 'Invalid or missing slug.' }) };
  }

  try {
    const raw = await fetchPost(slug);
    if (!raw) {
      return { statusCode: 404, headers: CORS,
               body: JSON.stringify({ error: 'Post not found.' }) };
    }
    return { statusCode: 200, headers: CORS,
             body: JSON.stringify(buildPostData(`${slug}.md`, raw)) };
  } catch (err) {
    console.error('[post] error:', err);
    return { statusCode: 502, headers: CORS,
             body: JSON.stringify({ error: 'Failed to fetch post.' }) };
  }
};