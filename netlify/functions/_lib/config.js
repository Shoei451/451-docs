"use strict";

/**
 * _lib/config.js
 * Multi-site configuration.
 *
 * Adding a new site:
 *   1. Add an entry to SITES.
 *   2. Omit BASE_PROTECTED if the site has no protected posts.
 *   3. Add netlify.toml redirects for the new site's path prefix.
 *      The ?site= param in the redirect URL is the only place SITE_ID appears.
 *
 * netlify.toml redirect pattern:
 *   /api/posts          → /.netlify/functions/posts?site=451-docs
 *   /blog/api/posts     → /.netlify/functions/posts?site=shoei451-website
 */

const REPO = "Shoei451/md-contents";

const SITES = [
  {
    id: "451-docs",
    BASE_PUBLIC: "451-docs/public_posts",
    BASE_PROTECTED: "451-docs/protected_posts",
    accent: "#3b82f6",
    accentDark: "#60a5fa",
    ui: {
      siteTitle: "My Notes",
      ownerLabel: "Shoei451",
      heroLabel: "Personal Notes",
      heroTitle: "My<br><em>Notes.</em>",
      heroBio:
        "I am a passionate note-taker who loves to capture thoughts, ideas, and knowledge in a structured way. This is my personal space to share insights, reflections, and learnings on various topics.",
      postsHeading: "Notes",
      footerText: "© 2026 Shoei451",
      avatarUrl: "https://picsum.photos/seed/profile42/200/200",
      links: [
        {
          label: "GitHub",
          href: "https://github.com/Shoei451",
          icon: "github",
        },
      ],
    },
  },
  {
    id: "shoei451-website",
    BASE_PUBLIC: "shoei451-website/public_posts",
    // BASE_PROTECTED intentionally absent
    accent: "#e99700",
    accentDark: "#f5be4c",
    ui: {
      siteTitle: "Docs | shoei451",
      ownerLabel: "Shoei451",
      heroLabel: "Developer Notes",
      heroTitle: "Shoei451<br><em>Docs.</em>",
      heroBio:
        "Here are some notes and documentation related to my projects, experiments, and learnings. This is a space for sharing insights, guides, and technical details about my work.",
      postsHeading: "Documentations",
      footerText: "© 2026 Shoei451",
      avatarUrl: "https://picsum.photos/seed/profile451/200/200",
      links: [],
    },
  },
];

/**
 * Look up a site config by id.
 * Falls back to SITES[0] (451-docs) if id is missing or unknown.
 */
function getSite(id) {
  if (!id) return SITES[0];
  return SITES.find((s) => s.id === id) ?? SITES[0];
}

module.exports = { REPO, SITES, getSite };
