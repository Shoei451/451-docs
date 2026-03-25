/**
 * _lib/frontmatter.js — shared frontmatter parser
 *
 * Handles one level of nested blocks (e.g. components:) and boolean coercion.
 */

const DEFAULT_COMPONENTS = { katex: false, highlight: false };

/**
 * Parse raw Markdown string into { meta, content }.
 */
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

/**
 * Normalize tags field: accepts "tag1, tag2" or ["tag1","tag2"] JSON.
 */
function normalizeTags(raw) {
  if (!raw || !String(raw).trim()) return [];
  const s = String(raw).trim();
  if (s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s.replace(/'/g, '"'));
      return Array.isArray(parsed) ? parsed.map(t => String(t).trim()).filter(Boolean) : [];
    } catch { /* fallthrough */ }
  }
  return s.split(',').map(t => t.trim()).filter(Boolean);
}

/**
 * Build public post metadata (no content, no password).
 */
function buildMeta(filename, rawMd) {
  const slug = filename.replace(/\.md$/i, '');
  const { meta } = parseFrontmatter(rawMd);

  return {
    slug,
    title:       meta.title       || slug,
    date:        meta.date        || '',
    description: meta.description || meta.excerpt || '',
    excerpt:     meta.excerpt     || meta.description || '',
    thumbnail:   meta.thumbnail   || '',
    category:    meta.category    || '',
    tags:        normalizeTags(meta.tags),
    components:  Object.assign({}, DEFAULT_COMPONENTS,
                   typeof meta.components === 'object' ? meta.components : {}),
  };
}

/**
 * Build full post data including content (for post viewer).
 * Strips the password field before returning.
 */
function buildPostData(filename, rawMd) {
  const slug = filename.replace(/\.md$/i, '');
  const { meta, content } = parseFrontmatter(rawMd);

  return {
    slug,
    title:       meta.title       || slug,
    date:        meta.date        || '',
    description: meta.description || meta.excerpt || '',
    excerpt:     meta.excerpt     || meta.description || '',
    thumbnail:   meta.thumbnail   || '',
    category:    meta.category    || '',
    tags:        normalizeTags(meta.tags),
    components:  Object.assign({}, DEFAULT_COMPONENTS,
                   typeof meta.components === 'object' ? meta.components : {}),
    content,
    // password is intentionally omitted
  };
}

/**
 * Return the raw password value from frontmatter (for server-side verification only).
 */
function getPassword(rawMd) {
  const { meta } = parseFrontmatter(rawMd);
  return meta.password || null;
}

module.exports = { parseFrontmatter, buildMeta, buildPostData, getPassword, DEFAULT_COMPONENTS };