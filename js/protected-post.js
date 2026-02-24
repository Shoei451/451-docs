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

const supabase      = new SupabaseClient(SITE_CONFIG.SUPABASE_URL, SITE_CONFIG.SUPABASE_ANON_KEY);
const form          = document.getElementById('password-form');
const passwordInput = document.getElementById('password-input');
const passwordError = document.getElementById('password-error');
const pwOverlay     = document.getElementById('password-overlay');
const spinner       = document.getElementById('loading-spinner');
const submitText    = document.getElementById('submit-text');
const contentEl     = document.getElementById('markdown-content');

// =====================================================
// 目次生成（レンダリング完了後に呼ぶ）
// styles.css の .toc / .toc-box / .toc-toggle を使う
// =====================================================
function buildToc() {
  const article  = document.getElementById('article');
  const headings = article.querySelectorAll('h1, h2, h3, h4');
  if (!headings.length) return; // 見出しゼロなら目次不要

  const tocToggle = document.getElementById('tocToggle');
  const overlay   = document.getElementById('overlay');
  const tocList   = document.getElementById('tocList');
  const tocBoxEl  = document.getElementById('tocBox');
  const tocBox    = tocBoxEl.querySelector('ul');

  // サイドバートグルとインライン目次を表示
  tocToggle.style.display = '';
  tocBoxEl.style.display  = '';

  // 各見出しにIDを振り、リンクを生成
  headings.forEach((heading, i) => {
    const id = 'section-' + i;
    heading.id = id;

    const makeLink = () => {
  const a = document.createElement('a');
  a.href = '#' + id;
  a.textContent = heading.textContent;
  if (heading.tagName === 'H2') a.classList.add('h2'); // ★追加
  if (heading.tagName === 'H3') a.classList.add('h3');
  if (heading.tagName === 'H4') a.classList.add('h4');
  return a;
};

// インライン目次の li にも同様に
const li = document.createElement('li');
if (heading.tagName === 'H2') li.classList.add('h2'); // ★追加
if (heading.tagName === 'H3') li.classList.add('h3');
if (heading.tagName === 'H4') li.classList.add('h4');


    // サイドバー
    tocList.appendChild(makeLink());

  });

  // ===== 開閉 =====
  const open  = () => document.body.classList.add('toc-open');
  const close = () => document.body.classList.remove('toc-open');

  tocToggle.addEventListener('click', () => document.body.classList.toggle('toc-open'));
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  // ===== スムーズスクロール =====
  document.addEventListener('click', (e) => {
    if (e.target.matches('.toc a, .toc-box a')) {
      e.preventDefault();
      const target = document.querySelector(e.target.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      close();
    }
  });

  // ===== アクティブハイライト =====
  const observer = new IntersectionObserver((entries) => {
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
// パスワード送信
// =====================================================
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  passwordError.classList.remove('show');
  spinner.classList.add('show');
  submitText.style.display = 'none';

  try {
    const result = await supabase.getProtectedPost(slug, passwordInput.value);

    if (result.success) {
      const post = result.post;

      // ヘッダー
      document.getElementById('post-title').innerHTML =
        `${post.title} </span>`;
      document.title = post.title + ' — My Notes';

      if (post.created_at) {
        document.getElementById('post-meta').textContent =
          new Date(post.created_at).toLocaleDateString('ja-JP');
      }

      const tagsEl = document.getElementById('post-tags');
      (post.tags || []).forEach(tag => {
        const span = document.createElement('span');
        span.className = 'post-tag';
        span.textContent = tag;
        tagsEl.appendChild(span);
      });

      document.getElementById('post-header').style.display = '';

 
      // Markdown → HTML レンダリング
      // headerIds: false で ## 1 のような数字見出しへの自動ID付与を無効化
      marked.use({ mangle: false, headerIds: false });
      contentEl.innerHTML = marked.parse(post.content || '');

      // KaTeX（defer 読み込みのため手動で呼ぶ）
      if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(contentEl, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$',  right: '$',  display: false }
          ],
          throwOnError: false
        });
      }

      // パスワード画面を非表示
      pwOverlay.classList.add('hidden');
      sessionStorage.setItem('pw_' + slug, passwordInput.value);

      // ★ 目次を生成（レンダリング完了後）
      buildToc();

    } else {
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