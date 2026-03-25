/**
 * Netlify Function: protected-posts
 * Route: GET /api/protected-posts
 *
 * Returns metadata list of protected posts (no content, no password).
 */

const { listFiles, fetchRaw } = require('./_lib/github');
const { buildMeta }           = require('./_lib/frontmatter');

const BASE = '451-docs/private_posts';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type':                 'application/json',
};

let cache = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  if (cache && Date.now() - cache.cachedAt < CACHE_TTL_MS) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify(cache.data) };
  }

  try {
    const files = await listFiles(BASE);

    const metaList = (await Promise.all(
      files.map(async (file) => {
        const slug = file.name.replace(/\.md$/i, '');
        const raw  = await fetchRaw(BASE, slug);
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