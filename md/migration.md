# 移行手順書 — slug方式 + private content repo

## 概要

| 旧構成 | 新構成 |
|---|---|
| `posts/*.md` → ビルドで `posts/*.html` 生成 | `content/posts/*.md` → ビルドで `posts-data/*.json` 生成 |
| `posts/seikei.html` へ直接リンク | `post.html?slug=seikei` |
| MDソースが公開リポジトリに混在 | MDソースは `451-docs-content`（private）に分離 |

---

## Step 1: ファイルの追加・置き換え

以下のファイルを 451-docs リポジトリに追加・更新する。

```
451-docs/
├── post.html           ← 新規追加（slug方式の記事ビューア）
├── build.js            ← 新規追加（旧build2.jsを置き換え）
├── package.json        ← 新規追加
├── index-logic.js      ← 更新（resolveHref対応）
└── .github/
    └── workflows/
        └── build.yml   ← 新規追加
```

旧ファイルはすぐには消さなくていい。移行期間中は並存させる。

---

## Step 2: 451-docs-content リポジトリを作成

GitHubで新しい**private**リポジトリを作成する。

リポジトリ名: `451-docs-content`（またはお好みで）

構成:
```
451-docs-content/
├── posts/
│   ├── seikei.md
│   ├── chinese-dinasities-table-1.md
│   └── test.md
└── .github/
    └── workflows/
        └── notify.yml   ← 451-docs-content/.github/workflows/notify.yml
```

`drafts/` にある既存のMDファイルをそのまま `posts/` に移す。

---

## Step 3: Personal Access Token（PAT）を発行

2つのシークレットが必要になる。

### 3-1: CONTENT_REPO_PAT（451-docs側に設定）

451-docs の GitHub Actions が private repo をクローンするために使う。

1. GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 「Generate new token (classic)」をクリック
3. スコープ: `repo` にチェック（Full control of private repositories）
4. 生成されたトークンをコピー
5. `451-docs` リポジトリ → Settings → Secrets and variables → Actions → New repository secret
   - Name: `CONTENT_REPO_PAT`
   - Value: コピーしたトークン

### 3-2: DISPATCH_PAT（451-docs-content側に設定）

451-docs-content が 451-docs の Actions をトリガーするために使う。

1. 上と同様のPATを発行（または同じものを使い回してもよい）
2. `451-docs-content` リポジトリ → Settings → Secrets → New repository secret
   - Name: `DISPATCH_PAT`
   - Value: トークン

---

## Step 4: ローカルでテスト

```bash
# content/posts/ にMDを置いてビルドテスト
mkdir -p content/posts
cp drafts/seikei.md content/posts/
node build.js

# 確認: posts-data/seikei.json が生成される
cat posts-data/seikei.json

# ブラウザで確認（ローカルサーバーが必要）
npx serve .
# → http://localhost:3000/post.html?slug=seikei
```

---

## Step 5: デプロイ

```bash
git add .
git commit -m "feat: migrate to slug-based post system"
git push origin main
```

Netlify が `main` へのpushを検知して自動デプロイ。

---

## Step 6: Netlify のビルドコマンドを更新

Netlify ダッシュボード → 451-docs → Site settings → Build & deploy

| 項目 | 旧値 | 新値 |
|---|---|---|
| Build command | `node build2.js` | `node build.js` |
| Publish directory | `.` | `.`（変更なし） |

---

## Step 7: 旧ファイルの整理（移行完了後）

移行が確認できたら:
- `posts/*.html` を削除（または `posts/` ディレクトリごとarchiveへ）
- `build2.js` を削除（または `archives/` へ移動）
- `drafts/` のMDは `451-docs-content` に移ったので削除

---

## 新しい記事の追加フロー（移行後）

```
1. 451-docs-content/posts/new-post.md を作成・push
   ↓ notify.yml が repository_dispatch を発火
2. 451-docs の build.yml がトリガー
   ↓ private repoをclone → node build.js
3. posts-data/new-post.json が生成・コミット
   ↓ Netlify が自動デプロイ
4. https://451-docs.netlify.app/post.html?slug=new-post が公開
```

---

## ディレクトリ構成（移行後）

```
451-docs/（public）
├── post.html              ← 全記事を担う1枚のHTML
├── index.html
├── protected-post.html
├── build.js
├── package.json
├── posts.json             ← ビルド生成（メタデータ一覧）
├── posts-data/            ← ビルド生成（記事ごとのJSON）
│   ├── seikei.json
│   └── chinese-dinasities-table-1.json
├── js/
│   ├── home-data.js       ← ビルド生成
│   ├── index-logic.js
│   ├── script.js
│   ├── theme-toggle.js
│   ├── config.js
│   └── supabase-client.js
├── css/
└── .github/workflows/build.yml

451-docs-content/（private）
└── posts/
    ├── seikei.md
    ├── chinese-dinasities-table-1.md
    └── test.md
```