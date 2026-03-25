/**
 * Netlify Function: protected-post
 * Route: GET /api/protected-post?slug={slug}&password={raw_password}
 *
 * Verifies password server-side against frontmatter `password` field.
 * Never returns the password field to the client.
 */

const { fetchRaw }              = require('./_lib/github');
const { buildPostData, getPassword } = require('./_lib/frontmatter');

const BASE = '451-docs/private_posts';

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
    const raw = await fetchRaw(BASE, slug);

    // Same 401 for "not found" and "wrong password" — don't leak post existence
    if (!raw) {
      return { statusCode: 401, headers: CORS,
               body: JSON.stringify({ error: 'Invalid password or post not found.' }) };
    }

    const storedPassword = getPassword(raw);
    if (!storedPassword || storedPassword !== password) {
      return { statusCode: 401, headers: CORS,
               body: JSON.stringify({ error: 'Invalid password or post not found.' }) };
    }

    return { statusCode: 200, headers: CORS,
             body: JSON.stringify(buildPostData(`${slug}.md`, raw)) };

  } catch (err) {
    console.error('[protected-post] error:', err);
    return { statusCode: 502, headers: CORS,
             body: JSON.stringify({ error: 'Failed to fetch post.' }) };
  }
};