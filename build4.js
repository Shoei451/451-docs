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
// 個別記事 HTML テンプレート
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
// メイン処理
// -------------------------------------------------------------------

const POSTS_DIR    = path.join(__dirname, "posts");
const OUTPUT_DIR   = path.join(__dirname, "posts");
const DRAFTS_DIR   = path.join(__dirname, "drafts");
const META_FILE    = path.join(__dirname, "posts.json");
const HOME_DATA_JS = path.join(__dirname, "js", "home-data.js");

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

  // posts.json を読み込み（なければ空）
  let allMeta = [];
  if (fs.existsSync(META_FILE)) {
    allMeta = JSON.parse(fs.readFileSync(META_FILE, "utf8"));
  }

  // 各 .md を HTML に変換してメタ情報を更新
  mdFiles.forEach(filename => {
    const content = fs.readFileSync(path.join(POSTS_DIR, filename), "utf8");
    const { meta, body } = parseFrontMatter(content);
    const htmlBody = parseMarkdown(body);

    const outputName = filename.replace(/\.md$/, ".html");
    const outputPath = path.join(OUTPUT_DIR, outputName);

    fs.writeFileSync(outputPath, renderPost({
      title:     meta.title     || filename,
      date:      meta.date      || "",
      thumbnail: meta.thumbnail || "",
      body:      htmlBody,
    }), "utf8");
    console.log(`✓ ${filename} → posts/${outputName}`);

    const newMeta = {
      title:       meta.title       || filename,
      date:        meta.date        || "",
      description: meta.description || "",
      thumbnail:   meta.thumbnail   || "",
      category:    meta.category    || "",
      outputFile:  outputName,
    };
    const idx = allMeta.findIndex(p => p.outputFile === outputName);
    if (idx >= 0) allMeta[idx] = newMeta;
    else allMeta.push(newMeta);
  });

  // posts.json を更新
  fs.writeFileSync(META_FILE, JSON.stringify(allMeta, null, 2), "utf8");
  console.log("✓ posts.json を更新しました");

  // js/home-data.js を更新（index.html はそのまま静的）
  const sorted = [...allMeta].sort((a, b) => b.date.localeCompare(a.date));
  const homeDataJs = `// Auto-generated by build2.js — DO NOT EDIT MANUALLY\nwindow.PUBLIC_POSTS = ${JSON.stringify(sorted, null, 2)};\n`;
  fs.writeFileSync(HOME_DATA_JS, homeDataJs, "utf8");
  console.log("✓ js/home-data.js を更新しました");

  // .md を drafts/ に移動
  if (!fs.existsSync(DRAFTS_DIR)) fs.mkdirSync(DRAFTS_DIR);
  mdFiles.forEach(filename => {
    fs.renameSync(
      path.join(POSTS_DIR, filename),
      path.join(DRAFTS_DIR, filename)
    );
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