#!/usr/bin/env node

const fs   = require("fs");
const path = require("path");

// -------------------------------------------------------------------
// インライン要素
// -------------------------------------------------------------------

function inline(text) {
  return text
    .replace(/\$([^$\n]+?)\$/g, '<span class="math-inline">$$$1$$</span>')
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/==(.+?)==/g, "<mark>$1</mark>")
    .replace(/\\([\\`*_{}\[\]()#+\-.!|~])/g, "$1");
}

function stripInline(text) {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
    .replace(/\*\*(.+?)\*\*/g,    "$1")
    .replace(/\*(.+?)\*/g,          "$1")
    .replace(/`([^`]+)`/g,           "$1")
    .replace(/==(.+?)==/g,           "$1")
    .replace(/\\([\\`*_{}\[\]()#+\-.!|~])/g, "$1");
}

function escape(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// -------------------------------------------------------------------
// ブロック要素パーサー
// -------------------------------------------------------------------

function parseMarkdown(md) {
  md = md.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = md.split("\n");
  const html  = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "$$") {
      const mathLines = [];
      i++;
      while (i < lines.length && lines[i].trim() !== "$$") {
        mathLines.push(lines[i]);
        i++;
      }
      html.push(`<div class="math-block">$$${mathLines.join("\n")}$$</div>`);
      i++; continue;
    }

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(escape(lines[i]));
        i++;
      }
      html.push(`<pre><code class="language-${lang}">${code.join("\n")}</code></pre>`);
      i++; continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)/);
    if (heading) {
      const level = Math.min(heading[1].length + 1, 6);
      html.push(`<h${level}>${escape(stripInline(heading[2]))}</h${level}>`);
      i++; continue;
    }

    if (/^---+$/.test(line.trim())) {
      html.push("<hr>");
      i++; continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(inline(lines[i].replace(/^>\s?/, "")));
        i++;
      }
      html.push(`<blockquote><p>${quoteLines.join("<br>")}</p></blockquote>`);
      continue;
    }

    if (/^\|.+\|$/.test(line)) {
      const tableLines = [];
      while (i < lines.length && /^\|.+\|$/.test(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      const hasSeparator = tableLines.length >= 2 && /^\|[\s\-:|]+\|$/.test(tableLines[1]);
      let tableHtml = "<table>";
      tableLines.forEach((tline, idx) => {
        if (hasSeparator && idx === 1) return;
        const cells = tline.slice(1, -1).split("|").map(c => c.trim());
        const tag = (hasSeparator && idx === 0) ? "th" : "td";
        tableHtml += `<tr>${cells.map(c => `<${tag}>${inline(c)}</${tag}>`).join("")}</tr>`;
      });
      tableHtml += "</table>";
      html.push(tableHtml);
      continue;
    }

    if (/^(\s*)[-*]\s/.test(line)) {
      html.push(parseList(lines, i, false));
      i = parseListEnd(lines, i, false);
      continue;
    }

    if (/^(\s*)\d+\.\s/.test(line)) {
      html.push(parseList(lines, i, true));
      i = parseListEnd(lines, i, true);
      continue;
    }

    if (line.trim() === "") {
      i++; continue;
    }

    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].match(/^#/) &&
      !lines[i].startsWith("```") &&
      !lines[i].startsWith("$$") &&
      !/^\|.+\|$/.test(lines[i]) &&
      !/^>\s?/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    if (para.length) html.push(`<p>${inline(para.join(" "))}</p>`);
  }

  return html.join("\n");
}

// -------------------------------------------------------------------
// ネストリストパーサー
// -------------------------------------------------------------------

function getIndent(line) {
  return line.match(/^(\s*)/)[1].length;
}

function parseList(lines, startI, ordered) {
  const baseIndent = getIndent(lines[startI]);
  const tag = ordered ? "ol" : "ul";
  let html = `<${tag}>`;
  let i = startI;

  while (i < lines.length) {
    const line   = lines[i];
    const indent = getIndent(line);
    if (indent < baseIndent) break;

    const isItem = ordered ? /^(\s*)\d+\.\s/.test(line) : /^(\s*)[-*]\s/.test(line);
    if (!isItem) break;

    if (indent === baseIndent) {
      const checkMatch = line.match(/^(\s*)[-*]\s\[([ x])\]\s+(.*)/);
      let content;
      if (checkMatch) {
        const checked = checkMatch[2] === "x" ? "checked" : "";
        content = `<input type="checkbox" disabled ${checked}> ${inline(checkMatch[3])}`;
      } else {
        const text = line.replace(/^(\s*)([-*]|\d+\.)\s+/, "");
        content = inline(text);
      }

      const nextLine = lines[i + 1];
      if (nextLine && getIndent(nextLine) > baseIndent) {
        const nextOrdered = /^(\s*)\d+\.\s/.test(nextLine);
        html += `<li>${content}${parseList(lines, i + 1, nextOrdered)}</li>`;
        i = parseListEnd(lines, i + 1, nextOrdered);
      } else {
        html += `<li>${content}</li>`;
        i++;
      }
    } else {
      break;
    }
  }

  return html + `</${tag}>`;
}

function parseListEnd(lines, startI, ordered) {
  const baseIndent = getIndent(lines[startI]);
  let i = startI;
  while (i < lines.length) {
    const line   = lines[i];
    const indent = getIndent(line);
    if (indent < baseIndent) break;
    const isItem = ordered ? /^(\s*)\d+\.\s/.test(line) : /^(\s*)[-*]\s/.test(line);
    if (!isItem) break;
    i++;
  }
  return i;
}

// -------------------------------------------------------------------
// Front Matter パーサー
// -------------------------------------------------------------------

function parseFrontMatter(content) {
  content = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const meta = {};
  match[1].split("\n").forEach(line => {
    const [key, ...rest] = line.split(":");
    if (key) meta[key.trim()] = rest.join(":").trim();
  });

  return { meta, body: match[2] };
}

// -------------------------------------------------------------------
// HTML テンプレート（back-link ボタン追加済み）
// -------------------------------------------------------------------

function renderPost({ title, date, thumbnail, body }) {
  const thumbTag = thumbnail ? `<img src="${thumbnail}" class="thumbnail" alt="">` : "";

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escape(title)}</title>
  <link rel="icon" href="../images/451-docs-favicon.png">
  <link rel="stylesheet" href="../css/styles.css">
  <link rel="stylesheet" href="../css/theme.css">
  <!-- KaTeX -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"
    onload="renderMathInElement(document.body, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$',  right: '$',  display: false}
      ]
    })">
  </script>
</head>
<body>

<!-- ホームへ戻るボタン -->
<a href="../index.html" class="back-link" aria-label="ホームへ戻る">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
  <span>Home</span>
</a>

<!-- ダークモードトグル -->
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

<div class="overlay" id="overlay"></div>

<button class="toc-toggle" id="tocToggle">
  <span class="icon">☰</span>
  <span class="label">目次</span>
</button>

<aside class="toc" id="toc">
  <h3>目次</h3>
  <nav id="tocList"></nav>
</aside>

<article class="article" id="article">
  ${thumbTag}
  <h1>${escape(title)}</h1>
  <p class="post-meta">${formatDate(date)}</p>

  <nav class="toc-box" id="tocBox">
    <h3>目次</h3>
    <ul></ul>
  </nav>

  ${body}
  <footer class="site-footer-bottom">
  <p>© 2026 Shoei451</p>
</footer>
</article>

<script src="../js/script.js"></script>
<script src="../js/theme-toggle.js"></script>
</body>
</html>`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${y}年${parseInt(m)}月${parseInt(d)}日`;
}

// -------------------------------------------------------------------
// index.html 自動更新（新プロフィールレイアウト対応）
// -------------------------------------------------------------------

// -------------------------------------------------------------------
// build2.js の renderIndexCards を以下に差し替える
// 変更点：
//   1. 静的カード生成 (${cards}) を廃止 → JS で動的生成
//   2. <div id="home-container"> を空にする（JSで埋める）
//   3. <span id="posts-count"> を追加（保護記事込みのカウント更新用）
//   4. スクリプト末尾に config.js / supabase-client.js の読み込みと
//      Supabase フェッチコードを追加
// -------------------------------------------------------------------

function renderIndexCards(posts) {
  // 公開記事のデータを JSON として静的埋め込み（JS側で使う）
  const postsJson = JSON.stringify(
    posts.sort((a, b) => b.date.localeCompare(a.date))
  );

  const count = posts.length;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Notes</title>
  <link rel="icon" href="images/451-docs-favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/styles.css">
  <link rel="stylesheet" href="css/theme.css">
  <link rel="stylesheet" href="css/home.css">
  <style>
    /* 保護記事カード用追加スタイル */
    .card--protected { border-color: var(--accent, #268bd2); }
    .card-protected-thumb {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      aspect-ratio: 16/9;
      font-size: 2.5rem;
      background: var(--entry, #073642);
    }
    .card-protected-badge {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background: var(--accent, #268bd2);
      color: #fff;
      padding: 2px 10px;
      border-radius: 20px;
      margin-bottom: 6px;
    }
  </style>
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
    <span class="posts-count" id="posts-count">${count} posts</span>
  </div>
  <!-- カードはJSで動的生成 -->
  <div class="home-container" id="home-container"></div>
</main>

<footer class="site-footer-bottom">
  <p>© 2026 Shoei451<br>Created with assistance from Claude AI and ChatGPT.</p>
</footer>

<script src="js/script.js"></script>
<script src="js/theme-toggle.js"></script>
<script src="js/config.js"></script>
<script src="js/supabase-client.js"></script>
<script>
// =====================================================
// 公開記事データ（build 時に静的埋め込み・降順ソート済み）
// =====================================================
const PUBLIC_POSTS = ${postsJson};

// =====================================================
// Supabase 設定（js/config.js の SITE_CONFIG から参照）
// =====================================================
const SUPABASE_CONFIG = {
  url:     (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG.SUPABASE_URL      : '',
  anonKey: (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG.SUPABASE_ANON_KEY : ''
};

// =====================================================
// ユーティリティ
// =====================================================
function formatDateStr(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return y + '年' + parseInt(m) + '月' + parseInt(d) + '日';
}

// =====================================================
// カード生成
// =====================================================
function createPublicCard(p) {
  const a = document.createElement('a');
  a.href = 'posts/' + p.outputFile;
  a.className = 'card';
  // data-date: 日付降順挿入で使う
  a.dataset.date = p.date || '';
  a.innerHTML = \`
    <div class="card-img-wrap">
      <img src="\${p.thumbnail || 'https://picsum.photos/600/300'}" alt="" loading="lazy" />
    </div>
    <div class="card-body">
      <h2 class="card-title">\${p.title}</h2>
      <p class="card-desc">\${p.description || ''}</p>
      <span class="card-date">\${formatDateStr(p.date)}</span>
    </div>
  \`;
  return a;
}

function createProtectedCard(p) {
  const isoDate = p.created_at ? p.created_at.slice(0, 10) : '';
  const displayDate = p.created_at
    ? new Date(p.created_at).toLocaleDateString('ja-JP')
    : '';
  const a = document.createElement('a');
  a.href = 'protected-post.html?slug=' + encodeURIComponent(p.slug);
  a.className = 'card card--protected';
  a.dataset.date = isoDate;
  a.innerHTML = \`
    <div class="card-img-wrap">
      <div class="card-protected-thumb">🔒</div>
    </div>
    <div class="card-body">
      <span class="card-protected-badge">Protected</span>
      <h2 class="card-title">\${p.title}</h2>
      <p class="card-desc">\${p.excerpt || 'パスワードで保護された記事です。'}</p>
      <span class="card-date">\${displayDate}</span>
    </div>
  \`;
  return a;
}

// 日付降順を維持しながら container に挿入
function insertByDate(container, card, isoDate) {
  const existing = [...container.querySelectorAll('.card')];
  const before = existing.find(el => (el.dataset.date || '') < isoDate);
  if (before) container.insertBefore(card, before);
  else container.appendChild(card);
}

// =====================================================
// 初期化
// =====================================================
async function initialize() {
  const container = document.getElementById('home-container');
  const countEl   = document.getElementById('posts-count');

  // 1. 公開記事をレンダリング
  PUBLIC_POSTS.forEach(p => container.appendChild(createPublicCard(p)));

  // 2. Supabase が有効なら保護記事を取得して日付順に挿入
  if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url.includes('your-project')) return;

  try {
    const client = new SupabaseClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    const result = await client.getProtectedPostsMeta();
    if (!result.success || result.posts.length === 0) return;

    result.posts
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .forEach(p => {
        const card    = createProtectedCard(p);
        const isoDate = p.created_at ? p.created_at.slice(0, 10) : '';
        insertByDate(container, card, isoDate);
      });

    if (countEl) {
      countEl.textContent = (PUBLIC_POSTS.length + result.posts.length) + ' posts';
    }
  } catch (e) {
    console.warn('保護記事の取得に失敗しました:', e);
  }
}

document.addEventListener('DOMContentLoaded', initialize);
</script>
</body>
</html>`;
}


// -------------------------------------------------------------------
// メイン処理
// -------------------------------------------------------------------

const POSTS_DIR  = path.join(__dirname, "posts");
const OUTPUT_DIR = path.join(__dirname, "posts");
const DRAFTS_DIR = path.join(__dirname, "drafts");
const META_FILE  = path.join(__dirname, "posts.json");

function build() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR);
    console.log("posts/ を作成しました。");
    return;
  }

  const mdFiles = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith(".md"));
  if (mdFiles.length === 0) {
    console.log("posts/ に .md ファイルが見つかりません。");
    return;
  }

  let allMeta = [];
  if (fs.existsSync(META_FILE)) {
    allMeta = JSON.parse(fs.readFileSync(META_FILE, "utf8"));
  }

  mdFiles.forEach(filename => {
    const content = fs.readFileSync(path.join(POSTS_DIR, filename), "utf8");
    const { meta, body } = parseFrontMatter(content);
    const htmlBody = parseMarkdown(body);

    const outputName = filename.replace(/\.md$/, ".html");
    const outputPath = path.join(OUTPUT_DIR, outputName);

    const html = renderPost({
      title:     meta.title     || filename,
      date:      meta.date      || "",
      thumbnail: meta.thumbnail || "",
      body:      htmlBody,
    });

    fs.writeFileSync(outputPath, html, "utf8");
    console.log(`✓ ${filename} → posts/${outputName}`);

    const newMeta = {
      title:       meta.title       || filename,
      date:        meta.date        || "",
      description: meta.description || "",
      thumbnail:   meta.thumbnail   || "",
      outputFile:  outputName,
    };
    const existingIdx = allMeta.findIndex(p => p.outputFile === outputName);
    if (existingIdx >= 0) allMeta[existingIdx] = newMeta;
    else allMeta.push(newMeta);
  });

  fs.writeFileSync(META_FILE, JSON.stringify(allMeta, null, 2), "utf8");
  const indexHtml = renderIndexCards(allMeta);
  fs.writeFileSync(path.join(__dirname, "index.html"), indexHtml, "utf8");
  console.log("✓ index.html を更新しました");

  if (!fs.existsSync(DRAFTS_DIR)) fs.mkdirSync(DRAFTS_DIR);
  mdFiles.forEach(filename => {
    const src  = path.join(POSTS_DIR, filename);
    const dest = path.join(DRAFTS_DIR, filename);
    fs.renameSync(src, dest);
    console.log(`📦 ${filename} → drafts/`);
  });
}

build();

if (process.argv.includes("--watch")) {
  console.log("\n👀 posts/ を監視中... (Ctrl+C で終了)\n");
  fs.watch(POSTS_DIR, (eventType, filename) => {
    if (filename && filename.endsWith(".md")) {
      console.log(`\n変更検知: ${filename}`);
      build();
    }
  });
}