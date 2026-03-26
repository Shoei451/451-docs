'use strict';

/**
 * _lib/config.js
 * Multi-site configuration.
 *
 * To add a new site:
 *   1. Add an entry to SITES.
 *   2. Set BASE_PROTECTED only if the site has password-protected posts.
 *      Omitting it makes /api/protected-posts return [] silently.
 *   3. Set window.SITE_ID in the site's index.html to match the id field.
 *
 * md-contents repo layout:
 *   Shoei451/md-contents
 *   ├── 451-docs/
 *   │   ├── public_posts/
 *   │   └── protected_posts/
 *   └── shoei451-website/
 *       └── public_posts/       ← no protected_posts for this site
 */

const REPO = 'Shoei451/md-contents';

const SITES = [
  {
    id:             '451-docs',
    BASE_PUBLIC:    '451-docs/public_posts',
    BASE_PROTECTED: '451-docs/protected_posts',  // optional — omit if not needed
    accent:         '#3b82f6',
    accentDark:     '#60a5fa',
  },
  {
    id:          'shoei451-website',
    BASE_PUBLIC: 'shoei451-website/public_posts',
    // BASE_PROTECTED intentionally absent — /api/protected-posts returns []
    accent:      '#e99700',
    accentDark:  '#f5be4c',
  },
];

/**
 * Look up a site config by id.
 * Falls back to SITES[0] if id is missing or unknown (backward compat).
 */
function getSite(id) {
  if (!id) return SITES[0];
  return SITES.find(s => s.id === id) ?? SITES[0];
}

module.exports = { REPO, SITES, getSite };