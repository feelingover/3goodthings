# 3 Good Things ✨🌈

毎日3つの良いことを記録するシンプルな日記アプリです。OpenAI APIを使って、記録した内容に対して一言コメントをもらうことができます。  
毎日をちょっとハッピーにしよう！😊

## 主な機能 🛠️

- 🌟 毎日3つの良いことを記録（最大1000文字/項目）
- 🤖 OpenAI APIからの応援コメント
- 📱 オフライン対応（PWA）
- 📅 履歴閲覧

## 技術スタック 🧑‍💻

- 🟦 TypeScript
- ⚛️ React
- 💾 IndexedDB (Dexie.js)
- 🤖 OpenAI API
- ☁️ Cloudflare Workers (APIプロキシ)
- 📲 PWA (Service Worker + Workbox)
- 🧪 Jest + React Testing Library

## 開発方法 🚀

### インストール

```bash
npm install
```

### 環境変数の設定

#### 1. Cloudflare Workersの設定

Cloudflare Workersを使ってOpenAI APIを安全に呼び出します。

```bash
# Cloudflare Wranglerでシークレットを設定
wrangler secret put OPENAI_API_KEY
# プロンプトが表示されたらあなたのOpenAI API キーを入力

# (オプション) モデルを指定する場合
wrangler secret put OPENAI_MODEL
# デフォルトはgpt-4o
```

#### 2. フロントエンドの設定

`.env`ファイルを作成し、Cloudflare WorkersのエンドポイントURLを設定してください：

```
# 開発環境
VITE_API_ENDPOINT="http://localhost:8787"

# 本番環境（デプロイ後に更新）
# VITE_API_ENDPOINT="https://your-worker-name.your-subdomain.workers.dev"
```

### 開発サーバーの起動

#### 1. Cloudflare Workersの起動（ターミナル1）

```bash
npm run workers:dev
```

#### 2. フロントエンドの起動（ターミナル2）

```bash
npm run dev
```

### ビルド・デプロイ

#### フロントエンドのビルド

```bash
npm run build
```

#### Cloudflare Workersのデプロイ

```bash
npm run workers:deploy
```

デプロイ後、`.env`ファイルの`VITE_API_ENDPOINT`をデプロイされたWorkers URLに更新してください。

### テスト実行

```bash
npm test
```

## セキュリティ 🔒

このアプリケーションは、**Cloudflare Workers**を使用してOpenAI APIキーをブラウザから隠蔽しています。フロントエンドはAPIキーに直接アクセスせず、Workersを経由してOpenAI APIを呼び出します。

### セキュリティのベストプラクティス

- ✅ API キーはCloudflare Workersの環境変数として安全に保存
- ✅ フロントエンドからはAPIキーに直接アクセス不可
- ✅ CORS設定により、許可されたオリジンからのみアクセス可能
- ✅ サーバーサイドでレート制限やログ管理が可能

## プロジェクト構成 🗂️

```
src/
├── assets/          # 画像やアイコンなど 🖼️
├── components/      # コンポーネント 🧩
│   ├── EntryForm/   # 記録入力フォーム ✍️
│   ├── EntryList/   # 記録一覧表示 📋
│   └── AiComment/   # AIコメント表示 🤖
├── db/              # Dexie.js DB設定 💾
├── hooks/           # カスタムフック 🪝
├── services/        # 外部サービス連携 🌐
├── types/           # 型定義 📝
└── utils/           # ユーティリティ 🛠️
```

## ライセンス 📄

MIT
