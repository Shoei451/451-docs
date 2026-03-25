/**
 * Netlify Function: post
 * Route: GET /api/post?slug={slug}
 *
 * Returns full post JSON including Markdown content.
 * post.html fetches this after reading the slug from the URL.
 */

const { fetchPost }     = require('./_lib/github');
const { buildPostData } = require('./_lib/frontmatter');

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

  // Basic validation: slug must be alphanumeric + hyphens/underscores only
  if (!slug || !/^[\w-]+$/.test(slug)) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'Invalid or missing slug.' }),
    };
  }

  try {
    const raw = await fetchPost(slug);

    if (!raw) {
      return {
        statusCode: 404,
        headers: CORS,
        body: JSON.stringify({ error: 'Post not found.' }),
      };
    }

    const postData = buildPostData(`${slug}.md`, raw);

    return { statusCode: 200, headers: CORS, body: JSON.stringify(postData) };

  } catch (err) {
    console.error('[post] error:', err);
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: 'Failed to fetch post.' }),
    };
  }
};