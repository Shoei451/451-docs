# 451-docs ロードマップ

最終更新: 2026-03-25

## 現状サマリー（2026-03-25時点）

- 完了: slug方式 (`post.html?slug=`) への移行
- 完了: `md-contents`（private）+ Netlify Functions での公開記事配信
- 継続課題: `protected-post.html` は Supabase 依存のまま

---

## todo.md からの移管（優先度順）

### P1（最優先）

1. 保護記事APIの要件定義
- 内容:
  - `protected_posts` をどこに保持するか（`md-contents` 継続 or 別パス）
  - 認証方式（パスワード検証・レート制限・監査ログ方針）
  - クライアントに返す情報の最小化
- 完了条件:
  - API仕様（入力/出力/エラー）をMarkdown 1枚で確定

2. 保護記事向け Netlify Function 実装
- 内容:
  - `GET /api/protected-post?slug=` 相当のFunction追加
  - パスワード照合をサーバー側に移動
  - CORS/エラーハンドリング/入力バリデーション統一
- 完了条件:
  - クライアントからSupabase直アクセスせずに保護記事を取得できる

3. `protected-post.html` / `js/protected-post.js` の置き換え
- 内容:
  - Supabase依存ロジックを削除
  - 新API呼び出しへ置換
  - UX（失敗時メッセージ、再試行）を最低限整備
- 完了条件:
  - Supabaseキーなしで保護記事フローが動作

4. 目次が目次自身を表示する不具合の解消
- 内容:
  - 見出し抽出時に「目次」見出しを除外する
  - 既存記事の表示崩れがないか確認する
- 完了条件:
  - 目次内に「目次」項目が出ない

### P2（次点）

5. Supabase依存の段階的削除
- 内容:
  - `js/config.js` / `js/supabase-client.js` の参照箇所を棚卸し
  - 不要なら削除、必要なら移行期コメントを追加
- 完了条件:
  - 保護記事に関するSupabase依存がコード上から消える

6. RSS整備
- 完了条件:
  - `rss.xml` を生成または配信し、最新記事が反映される

7. フロント共通化（JS/CSS）
- 完了条件:
  - 共通処理（テーマ切替、API呼び出し、レンダリング補助）の重複が削減される

8. 不要ファイルの削除とアーカイブ
- 完了条件:
  - 未使用ファイルが棚卸しされ、削除または `archives/` に移動済み

### P3（低優先）

9. ファイル命名・構造整理
- 完了条件:
  - 意図が不明な命名（例: 汎用すぎる `config.js`）を改善

10. `filetree` 自動生成
- 完了条件:
  - GitHub Actions またはスクリプトで最新構成を出力できる

11. `package.json` + GitHub workflow 見直し
- 内容:
  - 現在の「No build step」運用に対して、CIで最低限のチェックを実行するか判断する
- 完了条件:
  - 「現状維持」または「導入」の方針を明文化し、必要ならworkflowを追加する

12. Edge Function 関連の過去知見の整理
- 内容:
  - 既存メモ・チャットログから要件/制約を抽出する
- 完了条件:
  - 実装判断に使う要点メモが `md/` に1ファイルでまとまる

---

## 完了済み（todo.md 由来）

- slug指定での記事表示に移行し、`post.html` 1枚運用へ移行済み
- 記事表示ロジックの共通化（公開記事の取得/描画）を実施済み
- `md` コンテンツのprivate repo分離を実施済み
- Netlify Functions導入で公開記事配信をサーバー経由に移行済み

---

## フェーズ目安

| フェーズ | 対象優先度 | 期間目安 |
|---|---|---|
| Phase 1: Stabilize | P1 | 1週間 |
| Phase 2: Security Migration | P1〜P2（特に5） | 1〜2週間 |
| Phase 3: Operations & Quality | P2〜P3 | 2週間〜 |

---

## バックログ（要検討）

- Functionsに簡易キャッシュ戦略（TTL/ETag）を導入するか
- 保護記事の監査ログをどこまで保持するか
- コンテンツRepoのブランチ運用（`main` 直pushかPR必須か）
