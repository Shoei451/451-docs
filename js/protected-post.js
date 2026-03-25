// =====================================================
// URL から slug を取得
// =====================================================
const params = new URLSearchParams(window.location.search);
const slug   = params.get('slug');

if (!slug) {
  document.getElementById('post-title').textContent = 'slug が指定されていません';
  document.getElementById('password-overlay').classList.add('hidden');
  document.getElementById('post-header').style.display = '';
}

const form          = document.getElementById('password-form');
const passwordInput = document.getElementById('password-input');
const passwordError = document.getElementById('password-error');
const pwOverlay     = document.getElementById('password-overlay');
const spinner       = document.getElementById('loading-spinner');
const submitText    = document.getElementById('submit-text');
const contentEl     = document.getElementById('markdown-content');

// =====================================================
// ComponentLoader（post.html と同じ実装）
// =====================================================
const ComponentLoader = (() => {
  const loaded = new Set();

  function loadCSS(href) {
    if (loaded.has(href)) return Promise.resolve();
    return new Promise(resolve => {
      const el  = document.createElement('link');
      el.rel    = 'stylesheet';
      el.href   = href;
      el.onload = el.onerror = () => { loaded.add(href); resolve(); };
      document.head.appendChild(el);
    });
  }

  function loadJS(src) {
    if (loaded.has(src)) return Promise.resolve();
    return new Promise(resolve => {
      const el   = document.createElement('script');
      el.src     = src;
      el.onload  = el.onerror = () => { loaded.add(src); resolve(); };
      document.head.appendChild(el);
    });
  }

  return { loadCSS, loadJS };
})();

async function loadComponents(components) {
  const c    = components || {};
  const jobs = [];

  if (c.katex) {
    jobs.push(
      ComponentLoader.loadCSS(
        'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css'
      ).then(() =>
        ComponentLoader.loadJS(
          'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'
        )
      ).then(() =>
        ComponentLoader.loadJS(
          'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js'
        )
      )
    );
  }

  if (c.highlight) {
    const isDark   = document.body.classList.contains('dark');
    const themeCDN = isDark
      ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
      : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
    jobs.push(
      ComponentLoader.loadCSS(themeCDN).then(() =>
        ComponentLoader.loadJS(
          'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js'
        )
      )
    );
  }

  await Promise.all(jobs);
}

// =====================================================
// 保護記事を Netlify Function 経由で取得
// =====================================================
async function fetchProtectedPost(slug, password) {
  const url = `/api/protected-post?slug=${encodeURIComponent(slug)}&password=${encodeURIComponent(password)}`;
  const res = await fetch(url);

  if (res.status === 401) return { success: false, error: 'invalid_password' };
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { success: false, error: body.error || 'server_error' };
  }

  const post = await res.json();
  return { success: true, post };
}

// =====================================================
// 目次生成
// =====================================================
function buildToc() {
  const article  = document.getElementById('article');
  // #tocBox・#toc 内の見出し（「目次」自体）を除外する
  const headings = [...article.querySelectorAll('h2, h3, h4')]
    .filter(h => !h.closest('#tocBox, #toc'));

  if (!headings.length) return;

  const tocToggle = document.getElementById('tocToggle');
  const tocBoxEl  = document.getElementById('tocBox');
  const tocList   = document.getElementById('tocList');
  const tocBox    = tocBoxEl.querySelector('ul');

  tocToggle.style.display = '';
  tocBoxEl.style.display  = '';

  headings.forEach((heading, i) => {
    const id = 'section-' + i;
    heading.id = id;

    const makeLink = () => {
      const a = document.createElement('a');
      a.href = '#' + id;
      a.textContent = heading.textContent;
      if (heading.tagName === 'H2') a.classList.add('h2');
      if (heading.tagName === 'H3') a.classList.add('h3');
      if (heading.tagName === 'H4') a.classList.add('h4');
      return a;
    };

    tocList.appendChild(makeLink());

    const li = document.createElement('li');
    if (heading.tagName === 'H2') li.classList.add('h2');
    if (heading.tagName === 'H3') li.classList.add('h3');
    if (heading.tagName === 'H4') li.classList.add('h4');
    li.appendChild(makeLink());
    tocBox.appendChild(li);
  });

  const overlay = document.getElementById('overlay');
  const close   = () => document.body.classList.remove('toc-open');

  tocToggle.addEventListener('click', () => document.body.classList.toggle('toc-open'));
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  document.addEventListener('click', e => {
    if (e.target.matches('.toc a, .toc-box a')) {
      e.preventDefault();
      const target = document.querySelector(e.target.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      close();
    }
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.toc a').forEach(a => a.classList.remove('active'));
        const active = document.querySelector(`.toc a[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px' });

  headings.forEach(h => observer.observe(h));
}

// =====================================================
// 認証成功後の描画
// =====================================================
async function renderPost(post) {
  // コンポーネントを先に読み込む
  await loadComponents(post.components);

  // ヘッダー
  document.getElementById('post-title').textContent = post.title || slug;
  document.title = (post.title || slug) + ' — My Notes';

  if (post.date) {
    const [y, m, d] = post.date.split('-');
    document.getElementById('post-meta').textContent =
      `${y}年${parseInt(m)}月${parseInt(d)}日`;
  }

  const tagsEl = document.getElementById('post-tags');
  tagsEl.innerHTML = '';
  (post.tags || []).forEach(tag => {
    const span = document.createElement('span');
    span.className = 'post-tag';
    span.textContent = tag;
    tagsEl.appendChild(span);
  });

  document.getElementById('post-header').style.display = '';

  // Markdown → HTML
  marked.use({ mangle: false, headerIds: false });
  contentEl.innerHTML = marked.parse(post.content || '');

  // KaTeX
  if (post.components?.katex && typeof renderMathInElement !== 'undefined') {
    renderMathInElement(contentEl, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$',  right: '$',  display: false },
      ],
      throwOnError: false,
    });
  }

  // Highlight.js
  if (post.components?.highlight && typeof hljs !== 'undefined') {
    contentEl.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));

    new MutationObserver(() => {
      const dark  = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css';
      const light = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
      ComponentLoader.loadCSS(
        document.body.classList.contains('dark') ? dark : light
      );
    }).observe(document.body, { attributeFilter: ['class'] });
  }

  // パスワード画面を非表示
  pwOverlay.classList.add('hidden');

  // 目次を生成
  buildToc();
}

// =====================================================
// パスワード送信
// =====================================================
form.addEventListener('submit', async e => {
  e.preventDefault();
  passwordError.classList.remove('show');
  spinner.classList.add('show');
  submitText.style.display = 'none';

  try {
    const result = await fetchProtectedPost(slug, passwordInput.value);

    if (result.success) {
      sessionStorage.setItem('pw_' + slug, passwordInput.value);
      await renderPost(result.post);
    } else {
      passwordError.textContent = result.error === 'server_error'
        ? 'エラーが発生しました。後ほど再試行してください。'
        : 'パスワードが違います。';
      passwordError.classList.add('show');
      passwordInput.value = '';
      passwordInput.focus();
    }
  } catch (err) {
    console.error(err);
    passwordError.textContent = 'エラーが発生しました。後ほど再試行してください。';
    passwordError.classList.add('show');
  } finally {
    spinner.classList.remove('show');
    submitText.style.display = 'inline';
  }
});

// =====================================================
// セッションに保存済みのパスワードで自動ログイン
// =====================================================
window.addEventListener('DOMContentLoaded', () => {
  const saved = sessionStorage.getItem('pw_' + slug);
  if (saved) {
    passwordInput.value = saved;
    form.dispatchEvent(new Event('submit'));
  } else {
    passwordInput.focus();
  }
});