/**
 * Netlify Function: posts
 * Route: GET /api/posts
 *
 * Returns JSON array of post metadata (no content body).
 * index.html uses this to render the card grid.
 */

const { listPosts, fetchPost } = require('./_lib/github');
const { buildPostData }        = require('./_lib/frontmatter');

// Simple in-process cache: { data, cachedAt }
// Netlify spins up a new instance per cold start, so this only helps
// within a single warm invocation burst — still cuts GitHub API calls
// significantly during rapid page loads.
let cache = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type':                 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  // Cache hit
  if (cache && Date.now() - cache.cachedAt < CACHE_TTL_MS) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify(cache.data) };
  }

  try {
    const files = await listPosts();

    // Fetch each file and extract metadata (no content)
    const posts = await Promise.all(
      files.map(async (file) => {
        const slug = file.name.replace(/\.md$/i, '');
        const raw  = await fetchPost(slug);
        if (!raw) return null;
        const { slug: s, title, date, description, thumbnail, category, components } =
          buildPostData(file.name, raw);
        return { slug: s, title, date, description, thumbnail, category, components };
      })
    );

    const metaList = posts
      .filter(Boolean)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    cache = { data: metaList, cachedAt: Date.now() };

    return { statusCode: 200, headers: CORS, body: JSON.stringify(metaList) };

  } catch (err) {
    console.error('[posts] error:', err);
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: 'Failed to fetch posts list.' }),
    };
  }
};