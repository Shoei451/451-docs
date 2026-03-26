'use strict';

/**
 * _lib/frontmatter.js
 * Frontmatter parser + post data builders shared by all Netlify Functions.
 */

const DEFAULT_COMPONENTS = { katex: false, highlight: false };

/**
 * Parse YAML-like frontmatter from a raw Markdown string.
 * Returns { meta, content }.
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
 * Normalize optional string fields.
 * Returns '' for missing keys AND for keys that exist but are empty/whitespace.
 */
function str(val) {
  if (val === undefined || val === null) return '';
  return String(val).trim();
}

/**
 * Build metadata object for public post list (no content, no password).
 */
function buildMeta(slug, rawMd) {
  const { meta } = parseFrontmatter(rawMd);
  return {
    slug,
    title:       str(meta.title)       || slug,
    date:        str(meta.date),
    description: str(meta.description),
    thumbnail:   str(meta.thumbnail),   // '' when missing or blank
    category:    str(meta.category),
    components:  Object.assign({}, DEFAULT_COMPONENTS,
                   typeof meta.components === 'object' ? meta.components : {}),
  };
}

/**
 * Build full post data for public post viewer (includes content).
 */
function buildPostData(slug, rawMd) {
  const { meta, content } = parseFrontmatter(rawMd);
  return {
    slug,
    title:       str(meta.title)       || slug,
    date:        str(meta.date),
    description: str(meta.description),
    thumbnail:   str(meta.thumbnail),
    category:    str(meta.category),
    components:  Object.assign({}, DEFAULT_COMPONENTS,
                   typeof meta.components === 'object' ? meta.components : {}),
    content,
  };
}

/**
 * Build metadata for protected post list (no content, no password).
 */
function buildProtectedMeta(slug, rawMd) {
  const { meta } = parseFrontmatter(rawMd);
  return {
    slug,
    title:     str(meta.title)     || slug,
    date:      str(meta.date),
    excerpt:   str(meta.excerpt),
    thumbnail: str(meta.thumbnail),
    category:  str(meta.category),
    tags:      meta.tags ? meta.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
  };
}

/**
 * Build full post data for protected post viewer (includes content, never password).
 */
function buildProtectedPostData(slug, rawMd) {
  const { meta, content } = parseFrontmatter(rawMd);
  return {
    slug,
    title:      str(meta.title)      || slug,
    date:       str(meta.date),
    excerpt:    str(meta.excerpt),
    thumbnail:  str(meta.thumbnail),
    category:   str(meta.category),
    tags:       meta.tags ? meta.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    components: Object.assign({}, DEFAULT_COMPONENTS,
                  typeof meta.components === 'object' ? meta.components : {}),
    content,
  };
}

/**
 * Verify a plaintext password against the frontmatter `password` field.
 */
function checkPassword(rawMd, password) {
  const { meta } = parseFrontmatter(rawMd);
  return !!(meta.password && meta.password === password);
}

module.exports = {
  parseFrontmatter,
  buildMeta,
  buildPostData,
  buildProtectedMeta,
  buildProtectedPostData,
  checkPassword,
};