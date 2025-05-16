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
- 📲 PWA (Service Worker + Workbox)
- 🧪 Jest + React Testing Library

## 開発方法 🚀

### インストール

```bash
npm install
```

### 環境変数の設定

`.env`ファイルを作成し、以下の内容を設定してください：

```
VITE_OPENAI_API_KEY="your-api-key-here"
VITE_OPENAI_MODEL="gpt-4o"
```

### 開発サーバーの起動

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

### テスト実行

```bash
npm test
```

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
