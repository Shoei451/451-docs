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