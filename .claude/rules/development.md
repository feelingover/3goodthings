# 3 Good Things - 開発環境セットアップ

## 技術スタック概要

### フロントエンド
- **メインフレームワーク**: React 19.1.0
- **言語**: TypeScript 5.8.3
- **ビルドツール**: Vite 6.3.5
- **スタイリング**: CSS (Material Design 3 システム)
- **PWA対応**: vite-plugin-pwa 1.0.0
- **デザインシステム**: Material Design 3 (CSS変数ベース)

### バックエンド
- **APIプロキシ**: Cloudflare Workers
- **AI統合**: OpenAI API (openai 4.98.0)

### データストレージ
- **クライアントDB**: IndexedDB (Dexie.js 4.0.11)
- **キャッシュ**: Service Worker (Workbox 7.3.0)

### テスト
- **フレームワーク**: Jest 29.7.0
- **UIテスト**: React Testing Library 16.3.0

## 開発環境要件

### 必要条件
- Node.js (最新LTS以降推奨)
- npm (最新バージョン推奨)
- Cloudflare Wrangler CLI (Workers開発用)

## セットアップ手順

### 1. Cloudflare Workersの設定

```bash
# Cloudflare Wranglerでシークレットを設定
wrangler secret put OPENAI_API_KEY
# プロンプトが表示されたらあなたのOpenAI API キーを入力

# (オプション) モデルを指定する場合
wrangler secret put OPENAI_MODEL
# デフォルトはgpt-4o
```

### 2. フロントエンドの設定

`.env`ファイルを作成：

```env
# 開発環境
VITE_API_ENDPOINT="http://localhost:8787"

# 本番環境（デプロイ後に更新）
# VITE_API_ENDPOINT="https://your-worker-name.your-subdomain.workers.dev"
```

### 3. 開発サーバーの起動

**ターミナル1** - Cloudflare Workers:
```bash
npm run workers:dev
```

**ターミナル2** - フロントエンド:
```bash
npm run dev
```

## 開発コマンド

### フロントエンド
- `npm install`: 依存関係インストール
- `npm run dev`: 開発サーバー起動 (Vite)
- `npm run build`: プロダクションビルド
- `npm run preview`: ビルド結果のプレビュー
- `npm test`: Jestテスト実行
- `npm run lint`: ESLintによるコード検証

### Cloudflare Workers
- `npm run workers:dev`: Workersローカル開発サーバー起動
- `npm run workers:deploy`: Workersを本番環境にデプロイ

## 主要依存関係

### コア依存関係
- **React**: UIコンポーネントとレンダリング
- **Dexie.js**: IndexedDBのラッピングライブラリ
- **OpenAI**: OpenAI APIとの通信クライアント（Workers側）
- **Workbox**: PWA用Service Workerライブラリ

### 開発依存関係
- **TypeScript**: 静的型付け
- **Vite**: 高速ビルドツール
- **ESLint**: コード品質チェック
- **Jest/RTL**: テストフレームワーク
- **Wrangler**: Cloudflare Workers CLI

## UIデザインシステム

### Material Design 3の実装
- **デザイントークン**: CSS変数を使用したデザイン値の一元管理
- **カラーシステム**: プライマリ、セカンダリ、サーフェスカラーの体系的な適用
- **タイポグラフィ**: 階層的なフォントスケールと視認性重視の設定
- **コンポーネントシステム**: Material Designガイドラインに準拠したUI要素
- **エレベーション**: 影によるインターフェース階層の表現
- **インタラクション**: 統一されたアニメーションとトランジション

### カスタムCSS変数
```css
:root {
  --md-primary: #6750A4;
  --md-primary-light: #D0BCFF;
  --md-primary-dark: #381E72;
  --md-secondary: #625B71;
  --md-surface: #FFFBFE;
  --md-background: #F6F6F6;

  /* その他のデザイン変数 */
}
```

## クライアント環境要件

### ブラウザ対応
- 最新のChrome, Firefox, Safari, Edge
- IndexedDBをサポートするブラウザ環境

### パフォーマンス
- 低～中程度のCPU/メモリ使用量
- オフライン動作可能

### ストレージ
- IndexedDBによるデータ保存
- 長期使用でも比較的小さなストレージ使用量

## アーキテクチャの技術的制約

### クライアントサイドのみの構成
- サーバーレスアーキテクチャ（Cloudflare Workers除く）
- すべてのデータ処理をクライアント側で実行

### OpenAI API依存
- オンライン時のみAIコメント機能が利用可能
- APIキーはCloudflare Workers側で管理（セキュア）

### IndexedDBの制限
- ブラウザのストレージ制限に依存
- クライアント側での永続化のみ（クラウド同期なし）

## デプロイ手順

### Cloudflare Workersのデプロイ

```bash
# Cloudflare Workersのデプロイ
npm run workers:deploy

# デプロイ後、.envファイルのVITE_API_ENDPOINTを更新
```

### フロントエンドのデプロイ

Webアプリケーション:
- 静的ホスティングサービス（GitHub Pages, Netlifyなど）での配布
- PWAとしてインストール可能

オフライン対応:
- Service Workerによるアセットのキャッシュ
- オフライン起動と基本機能の確保

## セキュリティ考慮事項

### APIキー
- Cloudflare Workers側でOpenAI API keyを管理（セキュア）
- フロントエンドにはAPI keyを露出しない
- 環境変数およびWrangler secretsで管理

### データプライバシー
- すべてのデータはローカル保存のみ
- 外部サーバーへのデータ送信は特定機能（AIコメント）のみ
- CORS設定により許可されたオリジンからのみアクセス可能

## ビルド/パッケージング

### ビルドプロセス
1. TypeScriptコンパイル
2. Viteによるバンドル
3. PWA用Service Workerの生成
4. 静的アセットの最適化

### 成果物
- HTML/CSS/JSの最適化されたバンドル
- Service Workerファイル
- マニフェストファイル（PWA用）
- アイコンセット

## パフォーマンス最適化

### レンダリングパフォーマンス
- React最新バージョンの利用によるレンダリング最適化
- React.memo、useCallback、useMemoの活用
- CSS変数による効率的なスタイル計算

### ネットワーク最適化
- アセットのプリキャッシング
- オフライン対応による通信量削減
- Cloudflare Workersによる低レイテンシAPI呼び出し

### データ管理最適化
- IndexedDBによる効率的なデータクエリ
- インデックス設計による検索最適化
- 部分更新による全件再読み込みの回避

## アクセシビリティ

### 現在の対応状況
- 色コントラスト比の確保
- フォーカス可能な要素の明示的なアウトライン
- WAI-ARIA属性の包括的な追加
- キーボードナビゲーション完全対応
- スクリーンリーダー対応

## UXデザイン改善計画

### フィードバックメカニズム
- アニメーションによるユーザーアクション結果の視覚化
- エラー表示の改善とガイダンス提供

### レスポンシブ設計
- モバイル、タブレット、デスクトップ対応のレイアウト
- タッチインタラクションの最適化

### 今後の検討項目
- さらなるアニメーションの洗練
- ユーザー設定オプションの追加
