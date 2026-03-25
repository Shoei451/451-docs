// =====================================================
// Supabase 設定
// =====================================================
const SUPABASE_CONFIG = {
  url:     (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG.SUPABASE_URL  : '',
  anonKey: (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG.SUPABASE_KEY  : ''
};

// =====================================================
// ユーティリティ
// =====================================================
function formatDateStr(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return y + '年' + parseInt(m) + '月' + parseInt(d) + '日';
}

// slug から href を生成（新slug方式 + 旧outputFile の両方に対応）
function resolveHref(post) {
  if (post.slug) return `post.html?slug=${encodeURIComponent(post.slug)}`;
  // 後方互換: outputFile が posts/xxx.html 形式だった旧データ
  if (post.outputFile) return post.outputFile;
  return '#';
}

// =====================================================
// カード生成
// =====================================================
function createPublicCard(p) {
  const a = document.createElement('a');
  a.href             = resolveHref(p);
  a.className        = 'card';
  a.dataset.date     = p.date     || '';
  a.dataset.category = p.category || '';
  a.innerHTML = `
    <div class="card-img-wrap">
      <img src="${p.thumbnail || 'https://picsum.photos/600/300'}" alt="" loading="lazy" />
    </div>
    <div class="card-body">
      <h2 class="card-title">${p.title}</h2>
      <p class="card-desc">${p.description || ''}</p>
      <span class="card-date">${formatDateStr(p.date)}</span>
    </div>
  `;
  return a;
}

function createProtectedCard(p) {
  const isoDate     = p.created_at ? p.created_at.slice(0, 10) : '';
  const displayDate = p.created_at ? new Date(p.created_at).toLocaleDateString('ja-JP') : '';
  const a = document.createElement('a');
  a.href             = 'protected-post.html?slug=' + encodeURIComponent(p.slug);
  a.className        = 'card card--protected';
  a.dataset.date     = isoDate;
  a.dataset.category = p.category || '';
  a.innerHTML = `
    <div class="card-img-wrap">
      <div class="card-protected-thumb">🔒</div>
    </div>
    <div class="card-body">
      <span class="card-protected-badge">Protected</span>
      <h2 class="card-title">${p.title}</h2>
      <p class="card-desc">${p.excerpt || 'パスワードで保護された記事です。'}</p>
      <span class="card-date">${displayDate}</span>
    </div>
  `;
  return a;
}

// =====================================================
// 初期化
// =====================================================
async function initialize() {
  const container = document.getElementById('home-container');
  const countEl   = document.getElementById('posts-count');
  const tocList   = document.getElementById('tocList');

  // 1. 公開記事一覧を /api/posts から取得
  let publicPosts = [];
  try {
    const res = await fetch('/api/posts');
    if (res.ok) publicPosts = await res.json();
  } catch (e) {
    console.warn('Failed to fetch /api/posts:', e);
    // フォールバック: home-data.js が残っていればそちらを使う
    publicPosts = window.PUBLIC_POSTS || [];
  }
  const allCards = publicPosts.map(p => ({
    card: createPublicCard(p),
    date: p.date || ''
  }));

  // 2. Supabaseが有効なら保護記事を追加
  if (SUPABASE_CONFIG.url && !SUPABASE_CONFIG.url.includes('your-project')) {
    try {
      const client = new SupabaseClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
      const result = await client.getProtectedPostsMeta();
      if (result.success && result.posts.length > 0) {
        result.posts.forEach(p => {
          allCards.push({
            card: createProtectedCard(p),
            date: p.created_at ? p.created_at.slice(0, 10) : ''
          });
        });
        if (countEl) {
          countEl.textContent =
            (publicPosts.length + result.posts.length) + ' posts';
        }
      }
    } catch (e) {
      console.warn('保護記事の取得に失敗しました:', e);
    }
  }

  // 3. 日付降順ソート
  allCards.sort((a, b) => b.date.localeCompare(a.date));

  // 4. カテゴリ収集
  const categories = [...new Set(
    allCards.map(({ card }) => card.dataset.category).filter(Boolean)
  )].sort();

  // 5. サイドバー：カテゴリフィルター + Posts 一覧
  if (tocList) {
    if (categories.length > 0) {
      const filterWrap = document.createElement('div');
      filterWrap.id = 'category-filters';
      filterWrap.style.cssText = 'margin-bottom: 20px;';

      const makeBtn = (label, value) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.dataset.cat = value;
        btn.style.cssText = `
          display: block; width: 100%; text-align: left;
          background: none; border: none; cursor: pointer;
          padding: 6px 0; font-size: 0.9rem;
          color: var(--sub); font-weight: 600;
          letter-spacing: 0.04em; text-transform: uppercase;
          border-bottom: 2px solid transparent;
          transition: color 0.2s, border-color 0.2s;
        `;
        btn.addEventListener('mouseenter', () => {
          if (!btn.classList.contains('active')) btn.style.color = 'var(--text)';
        });
        btn.addEventListener('mouseleave', () => {
          if (!btn.classList.contains('active')) btn.style.color = 'var(--sub)';
        });
        return btn;
      };

      const allBtn = makeBtn('All', '');
      allBtn.classList.add('active');
      allBtn.style.color = 'var(--text)';
      allBtn.style.borderBottomColor = 'var(--accent)';
      filterWrap.appendChild(allBtn);
      categories.forEach(cat => filterWrap.appendChild(makeBtn(cat, cat)));

      filterWrap.addEventListener('click', e => {
        const btn = e.target.closest('button[data-cat]');
        if (!btn) return;
        const selected = btn.dataset.cat;

        filterWrap.querySelectorAll('button').forEach(b => {
          b.classList.remove('active');
          b.style.color = 'var(--sub)';
          b.style.borderBottomColor = 'transparent';
        });
        btn.classList.add('active');
        btn.style.color = 'var(--text)';
        btn.style.borderBottomColor = 'var(--accent)';

        container.querySelectorAll('.card').forEach(card => {
          card.style.display =
            (!selected || card.dataset.category === selected) ? '' : 'none';
        });
        tocList.querySelectorAll('a[data-cat]').forEach(a => {
          a.style.display =
            (!selected || a.dataset.cat === selected) ? '' : 'none';
        });
      });

      tocList.before(filterWrap);
    }

    allCards.forEach(({ card }) => {
      const a = document.createElement('a');
      a.href        = card.href;
      a.textContent = card.querySelector('.card-title')?.textContent || '(no title)';
      a.dataset.cat = card.dataset.category || '';
      tocList.appendChild(a);
    });
  }

  // 6. カードをレンダリング
  if (countEl && !countEl.textContent.includes('posts')) {
    countEl.textContent = allCards.length + ' posts';
  }
  allCards.forEach(({ card }) => container.appendChild(card));
}

document.addEventListener('DOMContentLoaded', initialize);

// =====================================================
// サイドバー開閉
// =====================================================
(function () {
  const toggle  = document.getElementById('tocToggle');
  const overlay = document.getElementById('overlay');
  if (!toggle || !overlay) return;
  const close = () => document.body.classList.remove('toc-open');
  toggle.addEventListener('click', () => document.body.classList.toggle('toc-open'));
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();