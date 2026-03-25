了解です。それでは、現状のTODO・方針を反映した 451-docs サイト改修設計書（ドラフト版） を作ります。構成は「目的 → フェーズ → 技術詳細 → 実装ロードマップ → 補足」としました。


---

451-docs 改修設計書（ドラフト版）

1. 目的

現行のパスワード付き記事は Supabase anonkey + RLS に依存しており、パスワードは見せかけでしかない。

これを改善し、Netlify Functions + private repo を用いた本物のアクセス制御を導入する。

同時に、保守性・自動化・将来の拡張性を確保する。



---

2. フェーズ別設計

Phase 1（最小コスト・最大効果）

目標: 配信モデルを単純化し、将来のFunctions導入の前提を作る

1. slug指定方式の導入（単一HTML化）

draft/ → posts/ 移動不要

URL例: post.html?slug=post1 または /post/post1

効果: 保守性向上、Functionsとの相性向上



2. md→htmlビルドの共通化

build_latest.jsを整理

変更があったmdのみを対象にビルド

目次生成やテンプレート処理を共通化

効果: 再ビルドが高速、保守コスト削減



3. GitHub Actionsによる自動ビルド

package.json + workflowを構築

効果: 手動操作不要で公開可能、ミス防止





---

Phase 2（構造固まった後）

目標: 本物のアクセス制御を導入

4. private repoの作成

mdコンテンツを451-docsから分離

build時にNetlifyで追加

効果: リポジトリ自体のセキュリティ向上



5. Netlify Functions導入

Edge Functionを利用して記事のアクセス制御

Supabaseに依存せずにパスワード保護可能



6. パスワード付き記事の再実装

slug方式 + Functionsで動的制御





---

Phase 3（運用・改善）

7. RSS整備


8. filetree.md自動生成（451-websiteからコピペ可）


9. jsファイルの共通化・デザイン共通化


10. 不要ファイルの削除とアーカイブ


11. ファイル命名方式の改善（js/config.jsなど）




---

3. 技術詳細

Slug方式

静的HTMLを1枚にまとめ、URLパラメータで記事切り替え

これにより Static → pseudo dynamic site に転換


Buildスクリプト

draft/のmdを検知してhtml生成

目次生成やテンプレート共通化


Functions

ユーザ認証情報 + slug でアクセス制御

Edge FunctionはNetlify上で即時実行


Private Repo

mdコンテンツ専用

公開リポジトリには含めない


GitHub Actions

build_latest.js をトリガー

生成されたhtmlをNetlifyにデプロイ




---

4. 実装ロードマップ（最小コスト順）

Step	作業内容	所要時間目安	備考

1	slug方式導入（post.html 1枚 + URLパラメータ）	1〜2h	すべての前提
2	build_latest.js整理（md→html共通化、目次共通化）	2〜3h	再ビルド高速化
3	GitHub Actions自動化	1h	自動デプロイの核
4	private repo作成 + md分離	0.5〜1h	slug方式後に作成
5	Netlify Functions導入（Edge Function）	2h	本物のアクセス制御
6	パスワード付き記事再実装	1〜2h	Functions + slugで制御
7	RSS整備	1h	Optional
8	filetree.md自動生成	1h	既存コピペで簡単
9	js共通化・デザイン共通化	1〜2h	Optional
10	不要ファイル整理	0.5h	Optional
11	ファイル命名方式改善	0.5h	Optional



---

5. 補足

Slug方式が最優先

すべてのPhase 2・3作業はslug方式導入後の効率が劇的に上がる


Security

現状のパスワード付き記事は見せかけ

Edge Function + private repo で本物のアクセス制御が可能


将来性

Static → pseudo dynamic構成により、追加機能や新しい記事形式に柔軟対応




---

この設計書は 実装に直結できるレベル で作成しています。
希望であれば、次は post.html最小テンプレ + slug routing + build_latest.js修正版 + Functions最小構成例 を追加して、即差し替え可能な状態にできます。

作りますか？