function renderIndexCards(posts) {
  const cards = posts
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(p => `
    <a href="posts/${p.outputFile}" class="card">
      <div class="card-img-wrap">
        <img src="${p.thumbnail || "https://picsum.photos/600/300"}" alt="" loading="lazy" />
      </div>
      <div class="card-body">
        <h2 class="card-title">${escape(p.title)}</h2>
        <p class="card-desc">${escape(p.description || "")}</p>
        <span class="card-date">${formatDate(p.date)}</span>
      </div>
    </a>`).join("\n");

  const count = posts.length;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Notes - Shoei451</title>
  <link rel="icon" href="images/451-docs-favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/styles.css">
  <link rel="stylesheet" href="css/theme.css">
  <link rel="stylesheet" href="css/home.css">
</head>
<body>

<span class="logo-switches">
  <button id="theme-toggle" aria-label="Toggle Theme">
    <svg id="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
    <svg id="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  </button>
</span>

<header class="profile-hero">
  <div class="profile-hero-inner">
    <div class="profile-left">
      <div class="profile-avatar">
        <!-- src を自分の写真に差し替えてください -->
        <img src="https://picsum.photos/seed/profile42/200/200" alt="Profile" />
      </div>
    </div>
    <div class="profile-right">
      <p class="profile-label">Personal Notes</p>
      <h1 class="profile-name">My<br><em>Notes.</em></h1>
      <p id="451-name">Shoei451</p>
      <p class="profile-bio">
        I am a passionate note-taker who loves to capture thoughts, ideas, and knowledge in a structured way. This is my personal space to share insights, reflections, and learnings on various topics. Here you'll find a mix of technical notes, book summaries, and random musings. My goal is to create a resource that is both useful to myself and interesting to others who stumble upon it. Happy reading!
      </p>
      
      <div class="profile-links">
        <a href="https://github.com/Shoei451" target="_blank" rel="noopener" class="profile-link">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          GitHub
        </a>
        <!--<a href="https://x.com" target="_blank" rel="noopener" class="profile-link">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          X
        </a>-->
      </div>
    </div>
  </div>
</header>

<main class="posts-section">
  <div class="posts-header">
    <h2 class="posts-heading">Notes</h2>
    <span class="posts-count">${count} posts</span>
  </div>
  <div class="home-container">
${cards}
  </div>
</main>

<footer class="site-footer-bottom">
  <p>© 2026 Shoei451<br>Created with assistance from Claude AI and ChatGPT.
</p>
</footer>

<script src="js/script.js"></script>
<script src="js/theme-toggle.js"></script>
</body>
</html>`;
}
