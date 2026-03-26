'use strict';

/**
 * Netlify Function: posts
 * Route: GET /api/posts
 * Returns metadata list of public posts (no content).
 */

const { listFiles, fetchRaw }    = require('./_lib/github');
const { buildMeta }              = require('./_lib/frontmatter');
const { CORS, handleOptions }    = require('./_lib/cors');

const REPO = 'Shoei451/md-contents';
const BASE = '451-docs/public_posts';

let cache = null;
const CACHE_TTL_MS = 60 * 1000;

exports.handler = async (event) => {
  const preflight = handleOptions(event);
  if (preflight) return preflight;

  if (cache && Date.now() - cache.cachedAt < CACHE_TTL_MS) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify(cache.data) };
  }

  try {
    const files = await listFiles(REPO, BASE);

    const metaList = (await Promise.all(
      files.map(async ({ path }) => {
        const slug = path.replace(`${BASE}/`, '').replace(/\.md$/i, '');
        const raw  = await fetchRaw(REPO, BASE, slug);
        return raw ? buildMeta(slug, raw) : null;
      })
    ))
      .filter(Boolean)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    cache = { data: metaList, cachedAt: Date.now() };
    return { statusCode: 200, headers: CORS, body: JSON.stringify(metaList) };

  } catch (err) {
    console.error('[posts]', err);
    return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'Failed to fetch posts.' }) };
  }
};