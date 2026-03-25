/**
 * frontmatter.js — shared frontmatter parser for Netlify Functions
 *
 * Handles nested blocks (e.g. components:) and boolean coercion.
 */

const DEFAULT_COMPONENTS = {
  katex:     false,
  highlight: false,
};

/**
 * Parse raw Markdown string into { meta, content }.
 * Supports one level of nesting (e.g. components: block).
 */
function parseFrontmatter(raw) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw };

  const meta = {};
  let currentBlock = null;

  for (const line of match[1].split('\n')) {
    // Indented line → child of current block
    if (/^\s+\S/.test(line)) {
      if (!currentBlock) continue;
      const colon = line.indexOf(':');
      if (colon === -1) continue;
      const key   = line.slice(0, colon).trim();
      const value = line.slice(colon + 1).trim();
      if (key) {
        meta[currentBlock][key] =
          value === 'true'  ? true  :
          value === 'false' ? false :
          value;
      }
      continue;
    }

    // Top-level line
    currentBlock = null;
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key   = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    if (!key) continue;

    if (value === '') {
      meta[key]    = {};
      currentBlock = key;
    } else {
      meta[key] = value;
    }
  }

  return { meta, content: match[2] };
}

/**
 * Build the full post object from a filename + raw MD string.
 */
function buildPostData(filename, rawMd) {
  const slug = filename.replace(/\.md$/i, '');
  const { meta, content } = parseFrontmatter(rawMd);

  const components = Object.assign(
    {},
    DEFAULT_COMPONENTS,
    typeof meta.components === 'object' ? meta.components : {}
  );

  return {
    slug,
    title:       meta.title       || slug,
    date:        meta.date        || '',
    description: meta.description || '',
    thumbnail:   meta.thumbnail   || '',
    category:    meta.category    || '',
    components,
    content,
  };
}

module.exports = { parseFrontmatter, buildPostData, DEFAULT_COMPONENTS };