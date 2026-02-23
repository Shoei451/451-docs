いい判断。順番に整理しよう。

---

## バグ修正から先にやる

**問題1: `index.html` でJSエラーが出る**

`script.js` は `post1.html` 用なのに `index.html` でも読み込まれてる。`tocToggle` などが `null` になってクラッシュする。

一番シンプルな修正は存在チェックを入れること。ファイルはコンテキスト内にあるので直接修正版を作る。次にMarkdown生成の仕組みを作る。動作確認用のサンプル記事も作っておく。ちゃんと動いてる。出力ファイルをまとめてコピーする。---

## まとめ

**バグ修正（script.js）**

`tocToggle` などが `null` のときはブロック全体をスキップするガードを冒頭に追加した。`if (tocToggle && overlay && article)` で囲むだけで、`index.html` でのクラッシュがなくなる。

`index.html` には `theme.css` と `theme-toggle.js` の読み込みを追加済み（コメントで場所を明示した）。

---

**Markdown生成（build.js）**

Node.js 標準ライブラリだけで動く。外部パッケージ不要。

```
posts/
  2026-02-23-note-design.md   ← ここにMarkdownを書く
  2026-02-20-ui-subtraction.md
```

各ファイルの先頭に Front Matter を書くだけ：

```yaml
---
title: 思考を深めるノート設計
date: 2026-02-23
description: 余白・構造化・アウトライン思考について。
thumbnail: https://picsum.photos/1200/500
---
```

あとは `node build.js` で `index.html` と各記事HTMLが自動生成・自動更新される。`--watch` オプションをつけると `posts/` を監視して変更のたびに自動ビルドする。

---

**次のステップ候補**

- `marked` や `unified` を入れてMarkdownパーサーをより堅牢にする（今の軽量実装は複雑なネストや引用に弱い）
- GitHub Actionsで `push` したら自動ビルド → GitHub Pagesにデプロイ

---


お疲れ様でした！整理すると今回作ったものはこんな構成です：

```
note-project/
├── build.js          # md → HTML 変換ツール
├── index.html        # 自動生成されるカード一覧
├── posts/
│   └── *.md          # ここにObsidianで書いて置くだけ
├── css/
│   ├── styles.css    # 表・引用・チェックボックス追記済み
│   ├── theme.css
│   └── home.css
└── js/
    ├── script.js     # h4まで目次対応
    └── theme-toggle.js
```

ワークフローとしては **Obsidianで書く → front matterを付ける → `node build.js`** だけで完結する形になりました。

次にやるとしたら、

- シンタックスハイライト（Prism.jsなどをCDNで追加するだけ）
- GitHub Pagesへのデプロイ

あたりが自然なステップです。何かあればどうぞ。

---


プロジェクトの構造を確認してから作ります。方針を固めてから実装します。

**方針：**
- `index.html` → ヒーローセクション（プロフィール）＋記事カード一覧
- 各postの `build.js` テンプレート → ホームへ戻るボタン追加
- `css/home.css` → プロフィールレイアウト対応に拡張

まず `index.html` と `css/home.css` を作り、次に `build.js` のテンプレ部分を更新します。次に `home.css` を全面的に書き直します。次に `build.js` のテンプレートにback-linkボタンを追加し、`renderIndexCards` も新しいHTML構造に対応させます。`styles.css` に back-link のスタイルを追記します。既存の `styles.css` に back-link スタイルを追記した完全版を作ります。最後に全ファイルを outputs にコピーします。4ファイルを更新しました。変更点をまとめます。

---

## 変更ファイル一覧

**`index.html`** — プロフィールページ化
- アバター画像 + 名前 + bio + SNSリンクのヒーローセクション
- 区切り線（グラデーション）で記事一覧と分離
- カードに `card-img-wrap` でホバー時の画像ズームを追加
- 記事数カウンター表示

**`css/home.css`** — ヒーロー＋カードの全スタイル
- `DM Serif Display`（セリフイタリック）＋ `DM Sans` でタイポグラフィを強化
- プロフィールリンクは pill 型ボタン、ホバーで accent カラーに変化
- カードはボーダー＋ホバー時に accent ボーダー

**`css/styles.css`** — `.back-link` スタイルを追記
- 左上に固定配置の「← Home」ボタン
- ホバーで左にスライド（`translateX(-3px)`）
- `body:has(.back-link) .toc-toggle` で目次ボタンを右に自動退避

**`build.js`** — post テンプレートに back-link を追加
- `<a href="../index.html" class="back-link">` をトップに挿入
- `renderIndexCards` も新しいHTMLカード構造に対応

---

**差し替えが必要な箇所：**
- アバター画像 `src="https://picsum.photos/seed/profile42/200/200"` → 自分の写真のパス
- GitHub / X の `href` → 実際のURL
- bio テキスト → 好みの自己紹介文