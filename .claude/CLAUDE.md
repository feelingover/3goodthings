# 3 Good Things - プロジェクトガイド

## プロジェクトについて

**3 Good Things**は、毎日3つの良いことを記録し、AIからのコメントをもらえる習慣化支援PWAアプリケーション。

### プロジェクト目的

日々の小さな幸せを記録し、振り返ることで、ポジティブな思考を促進し、メンタルウェルビーイングをサポートすることを目的としたシンプルな日記アプリ。美しく使いやすいMaterial Designインターフェースにより、ユーザーエクスペリエンスの向上を図る。

### 核となる機能

- ✅ 毎日3つの良いことを記録（最大1000文字/項目）
- ✅ Material Design 3に基づく洗練されたUI
- ✅ 保存と連動した自動AIコメント取得
- ✅ OpenAI API活用の応援コメント
- ✅ オフライン対応（PWA）
- ✅ 過去の記録を振り返る履歴機能
- ✅ ダークモード対応（Light/Dark/System）
- ✅ エントリー編集・削除機能
- ✅ データエクスポート（JSON/CSV）
- ✅ アクセシビリティ対応（WAI-ARIA、キーボードナビゲーション）

### 技術スタック（簡潔版）

- **Frontend**: React 19 + TypeScript + Vite
- **UI Design**: Material Design 3（CSS変数ベース）
- **Storage**: IndexedDB（Dexie.js）
- **API**: OpenAI API（GPT-4o）
- **Backend**: Cloudflare Workers（APIプロキシ）
- **PWA**: Service Worker + Workbox
- **Testing**: Jest + React Testing Library

---

## 現在のフォーカス

### 直近完了：Sprint 4（エンゲージメント機能 - Phase 1）✅

**完了した作業**:

- ✅ 統計・インサイト表示（Phase 1）
  - 連続記録日数（ストリーク）カウンター 🔥
  - 総記録日数、今週・今月の記録数
  - 記録した良いこと（総項目数）
  - Material Design 3スタイル
  - useMemoによるパフォーマンス最適化
- ✅ テスト拡充：+16テスト追加（statsCalculator + StatsView）
- ✅ テストパス率：100% (92/92 tests) 達成

**期待効果**:

- 継続率 +25% 見込み
- ユーザーエンゲージメント向上

### 次のステップ：Sprint 4（Phase 2/3）

**計画中の機能**:

1. **月間カレンダービュー（Phase 2）**
   - カレンダーグリッド（7×6）
   - 記録した日をハイライト表示
   - 月切り替えボタン

2. **頻出ワード表示（Phase 3）**
   - テキスト解析（MeCab.js or kuromoji.js）
   - 頻出ワードトップ10リスト

3. **リマインダー機能（オプション）**
   - プッシュ通知
   - Service Worker経由
   - 通知設定画面

---

## 開発ガイドライン

### よく使うコマンド

```bash
# 開発サーバー起動（2つのターミナルで実行）
npm run workers:dev  # Terminal 1: Cloudflare Workers
npm run dev          # Terminal 2: Frontend

# ビルド
npm run build        # プロダクションビルド
npm run preview      # ビルド結果のプレビュー

# テスト
npm test             # 全テスト実行
npm test -- --watch  # ウォッチモード
npm test -- --coverage  # カバレッジレポート

# デプロイ
npm run workers:deploy  # Cloudflare Workersデプロイ

# コード品質
npm run lint         # ESLintによるコード検証
```

### 環境セットアップ

**Cloudflare Workers設定**:
```bash
# OpenAI API keyを設定
wrangler secret put OPENAI_API_KEY

# （オプション）モデルを指定
wrangler secret put OPENAI_MODEL  # デフォルトはgpt-4o
```

**フロントエンド設定**（`.env`ファイル）:
```env
# 開発環境
VITE_API_ENDPOINT="http://localhost:8787"

# 本番環境（デプロイ後に更新）
# VITE_API_ENDPOINT="https://your-worker-name.your-subdomain.workers.dev"
```

### コミットメッセージルール

- **feat**: 新機能追加
- **fix**: バグ修正
- **refactor**: リファクタリング
- **test**: テスト追加・修正
- **docs**: ドキュメント更新
- **style**: コードスタイル修正（機能変更なし）

**例**:
```
feat: Sprint 3 - App.tsxリファクタリング + パフォーマンス最適化

完了した作業:
1. カスタムフック分離
2. refreshTrigger完全削除
3. パフォーマンス最適化

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### PR作成手順

1. 機能ブランチ作成（`feat/sprint-x-feature-name`）
2. 実装とテスト
3. コミット（論理的な単位で分割）
4. PRを作成
5. テストパス確認
6. マージ

---

## プロジェクト哲学

### シンプルに保つ

余計な機能は追加せず、コア体験に集中する。

### ユーザーの自律性

データはローカルに保存され、ユーザーが完全に管理する。

### 無料アクセス

基本機能は広くアクセス可能に。

### ポジティブ体験

アプリとの各インタラクションがユーザーの気分を向上させることを目指す。

### 美しさと機能性の融合

見た目の美しさと使いやすさを両立させる。

---

## 関連ドキュメント

詳細な情報は以下のファイルを参照してください：

- **開発履歴と実装状況**: [@.claude/progress.md](.claude/progress.md)
  - Sprint 1-3の完全な記録
  - 技術的ハイライト
  - 学んだこと
  - Git管理情報

- **システム設計**: [@.claude/rules/architecture.md](.claude/rules/architecture.md)
  - コンポーネント構造
  - データモデル
  - 状態管理パターン
  - ファイル構成

- **セットアップ手順**: [@.claude/rules/development.md](.claude/rules/development.md)
  - 技術スタック詳細
  - 開発環境セットアップ
  - Cloudflare Workers設定
  - ビルド・デプロイ手順

- **テスト方針**: [@.claude/rules/testing.md](.claude/rules/testing.md)
  - テスト戦略
  - テストパターン
  - カバレッジ情報
  - CI/CD統合

- **UI/UX原則**: [@.claude/rules/design-principles.md](.claude/rules/design-principles.md)
  - Material Design 3適用ルール
  - カラーシステム
  - タイポグラフィ
  - アクセシビリティガイドライン

---

## プロジェクト健全性指標

| 指標 | 状態 | 目標 |
| ---- | ---- | ---- |
| テストパス率 | **100%** (92/92) ✅ | 100% |
| コードカバレッジ | 約75% | 70%+ ✅ |
| TypeScript エラー | 0件 ✅ | 0件 |
| 本番ビルド | 成功 ✅ | 成功 |
| アクセシビリティ | 88/100 | 90+ 📈 |
| メンテナンス性 | 高 ✅ | 高 |
| 視覚的一貫性 | 高（Material Design 3） ✅ | 高 |

---

**最終更新**: 2026-01-08
