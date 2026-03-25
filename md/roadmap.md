# 451-docs ロードマップ

最終更新: 2026-03-25

## 現状サマリー（2026-03-25時点）

- 完了: slug方式 (`post.html?slug=`) への移行
- 完了: `md-contents`（private）+ Netlify Functions での公開記事配信
- 完了: 保護記事フローの Netlify Function 化（Supabase依存ゼロ）
- 完了: 目次が目次自身を表示する不具合の解消
- 継続課題: Netlifyデプロイエラー（`_lib/` bundler問題 → インライン化で対応中）
- 継続課題: 一般記事メタデータのindex表示（frontmatterのインデントバグ）

---

## フロントマター仕様（統一版）

### 公開記事（`451-docs/public_posts/`）

```yaml
---
title: 記事タイトル
date: 2026-03-25
description: index.htmlのカードに表示される1行説明
thumbnail: https://example.com/image.png
category: history
components:
  katex: false
  highlight: false
---
```

| フィールド | 必須 | 用途 |
|---|---|---|
| `title` | ○ | カードタイトル・ページタイトル |
| `date` | ○ | カードの日付表示・ソート |
| `description` | 推奨 | カードの説明文 |
| `thumbnail` | 任意 | カード画像 |
| `category` | 任意 | サイドバーフィルター |
| `components.katex` | 任意 | KaTeX読み込み（デフォルト: false） |
| `components.highlight` | 任意 | Highlight.js読み込み（デフォルト: false） |

### 保護記事（`451-docs/private_posts/`）

```yaml
---
title: 記事タイトル
date: 2026-03-25
excerpt: index.htmlのカードに表示される1行説明
thumbnail: https://example.com/image.png
category: 受験
tags: 東大, 英語
password: mysecret
components:
  katex: false
  highlight: false
---
```

| フィールド | 必須 | 用途 |
|---|---|---|
| `title` | ○ | カードタイトル・ページタイトル |
| `date` | ○ | カードの日付表示・ソート |
| `password` | ○ | 認証パスワード（平文）|
| `excerpt` | 推奨 | カードの説明文 |
| `thumbnail` | 任意 | カード画像 |
| `category` | 任意 | サイドバーフィルター |
| `tags` | 任意 | タグ（カンマ区切り） |
| `components.katex` | 任意 | KaTeX読み込み |
| `components.highlight` | 任意 | Highlight.js読み込み |

**注意：** フィールドはインデントなしで書く。先頭スペースがあるとパーサーがネストブロックと誤認する。

---

## P1（最優先） — 進行中

### 1. Netlifyデプロイエラーの修正 🔄
- 原因: `require('./_lib/...')` がNetlify bundlerに解決されない
- 対応: 全Functionをインライン化（`_lib/` への依存を排除）
- 完了条件: デプロイが成功し `/api/posts` が200を返す

### 2. 一般記事メタデータのindex表示修正 🔄
- 原因: frontmatterの先頭スペースによりパーサーがフィールドを読み取れない
- 対応: 既存MDファイルのインデントを修正する
- 完了条件: index.htmlに日付・description・categoryが表示される

### 3. Supabase依存の完全削除 ✅
- `protected-post.html` から `config.js` / `supabase-client.js` の読み込みを削除
- パスワード検証をNetlify Function（GitHub API経由）に移行
- 完了条件: Supabaseキーなしで保護記事フローが動作 → 達成

### 4. 目次バグの解消 ✅
- `buildToc()` で `#tocBox` / `#toc` 内の見出しを除外
- `post.html` / `protected-post.js` 両方に適用
- 完了条件: 目次内に「目次」項目が出ない → 達成

---

## P2（次点）

### 5. Supabase依存の段階的削除
- `js/config.js` / `js/supabase-client.js` の参照箇所を棚卸し
- `index.html` から不要な読み込みを削除
- 完了条件: 保護記事に関するSupabase依存がコード上から消える

### 6. RSS整備
- 完了条件: `rss.xml` を生成または配信し、最新記事が反映される

### 7. フロント共通化（JS/CSS）
- 完了条件: 共通処理の重複が削減される

### 8. 不要ファイルの削除とアーカイブ
- `_ilb/`（typo）ディレクトリの削除
- `posts-data/`、`posts.json`、`js/home-data.js` の整理
- 完了条件: 未使用ファイルが棚卸し済み

---

## P3（低優先）

9. ファイル命名・構造整理
10. `filetree` 自動生成
11. `package.json` + GitHub workflow 見直し
12. Edge Function 関連の過去知見の整理

---

## 完了済み

- slug指定での記事表示 (`post.html?slug=`) への移行
- `md-contents`（private repo）分離 + Netlify Functions導入
- 保護記事フローのFunctions化（Supabase → GitHub API）
- 目次が目次自身を表示するバグの解消

---

## フェーズ目安

| フェーズ | 対象 | 期間目安 |
|---|---|---|
| Phase 1: Stabilize | P1（1・2） | 今日中 |
| Phase 2: Cleanup | P2（5・8） | 今週中 |
| Phase 3: Operations | P2（6・7）〜P3 | 2週間〜 |