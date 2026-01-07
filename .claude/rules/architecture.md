# 3 Good Things - システムアーキテクチャ

## アーキテクチャ概要

「3 Good Things」は、クライアントサイドのみで動作するReactアプリケーションで、以下のアーキテクチャパターンに基づいて設計されています：

```
[ユーザーインターフェース (React Components)]
          ↑↓
[カスタムフック (React Hooks)]
          ↑↓
[データサービス (IndexedDB/OpenAI)]
          ↑↓
[ローカルストレージ (IndexedDB)]  [外部API (OpenAI)]
```

## デザインシステム

### Material Design 3パターン

アプリケーション全体でMaterial Design 3の原則に基づいた一貫したデザインシステムを採用しています：

```
[デザイントークン (CSS変数)]
          ↓
[基本スタイル (Typography, Color, Spacing)]
          ↓
[コアコンポーネント (Buttons, Cards, Forms)]
          ↓
[複合コンポーネント (EntryForm, AiComment, EntryList)]
```

### CSSシステム設計

```css
/* デザイントークン */
:root {
  /* カラーパレット */
  --md-primary: #6750A4;
  --md-primary-light: #D0BCFF;

  /* エレベーション */
  --md-shadow-1: 0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15);

  /* アニメーション */
  --md-transition-standard: 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  /* スペーシング */
  --md-spacing-unit: 8px;
}
```

### 視覚的パターン

- **カード型コンテナ**: 情報の塊をカード型のコンテナでグループ化
- **エレベーションシステム**: シャドウによる階層の表現
- **アウトラインフォーム**: 境界線を持つ入力フィールド
- **ピルボタン**: 角丸の強調されたアクションボタン
- **視覚的フィードバック**: ホバー、アクティブ状態などのインタラクションフィードバック

## データモデル

### 主要エンティティ

1. **EntryItem**: 個々の「良いこと」のエントリー
   ```typescript
   interface EntryItem {
     id?: number;
     content: string;    // 内容（最大1000文字）
     createdAt: Date;    // 作成日時
     aiComment?: string; // この項目に対するAIコメント
     hasRequestedComment: boolean; // コメントをリクエスト済みかどうか
   }
   ```

2. **DailyEntry**: 1日あたりの記録（3つのEntryItemを持つ）
   ```typescript
   interface DailyEntry {
     id?: number;
     date: string;       // 日付（YYYY-MM-DD形式）
     items: EntryItem[]; // 最大3つの「良いこと」
     aiComment?: string; // OpenAI APIからのコメント
     hasRequestedComment: boolean; // コメントをリクエスト済みかどうか
   }
   ```

## データベース設計

Dexie.jsを使用したIndexedDBの実装：

```typescript
class AppDatabase extends Dexie {
  dailyEntries!: Table<DailyEntry, number>;
  entryItems!: Table<EntryItem, number>;

  constructor() {
    super(config.db.name);

    this.version(config.db.version).stores({
      dailyEntries: '++id, date',        // 日付でインデックス化
      entryItems: '++id, &[date+index]', // 日付+インデックスの複合ユニーク
    });
  }

  // データアクセスメソッド
  // ...
}
```

## コンポーネント構造

```
App
├── EntryForm (Material Design対応)
│   └── (入力フォームコンポーネント)
├── AiComment (Material Design対応)
│   └── (AIコメント表示コンポーネント)
└── EntryList (Material Design対応)
    └── (過去のエントリー表示)
```

## データフローパターン

1. **記録作成とコメント自動取得フロー**:
   ```
   User Input → EntryForm → useEntries Hook → Database → UI Update
                   ↓
         自動コメントリクエスト
                   ↓
             OpenAI Service → AiComment Component
   ```

2. **履歴表示フロー**:
   ```
   EntryList Component → useEntries Hook → Database → UI Update
   ```

## APIインテグレーション

OpenAI APIとのインテグレーション：

```typescript
export async function getAiComment(goodThings: string[]): Promise<string> {
  // ネットワーク接続チェック
  if (!navigator.onLine) {
    throw new Error('ネットワーク接続がありません');
  }

  // APIキー検証
  if (!config.openai.apiKey) {
    throw new Error('OpenAI APIキーが設定されていません');
  }

  // APIリクエスト
  const response = await openai.chat.completions.create({
    model: config.openai.model,
    messages: [
      { role: 'system', content: '友達のように気軽にコメントする日本語アシスタントです。' },
      { role: 'user', content: prompt }
    ],
    max_tokens: config.openai.maxTokens,
  });

  return response.choices[0]?.message?.content || 'コメントを取得できませんでした';
}
```

## オフラインパターン

1. **Service Workerによるキャッシュ**:
   - アプリケーションアセット（HTML, CSS, JS）のキャッシング
   - Workboxを使用したPWA実装

2. **オフラインデータアクセス**:
   - IndexedDBによるローカルデータベース管理
   - オフラインでも記録の閲覧・作成が可能

3. **ネットワーク状態検知**:
   ```typescript
   export function checkNetworkConnection(): boolean {
     return navigator.onLine;
   }
   ```

4. **グレースフル機能劣化**:
   - オフライン時にはAIコメント機能を無効化
   - 記録機能は引き続き利用可能

## UIインタラクションパターン

1. **フィードバックアニメーション**:
   - ボタンクリック時のリップルエフェクト
   - カード要素のホバーエレベーション変化
   - フォーム入力時の動的フィードバック

2. **状態遷移アニメーション**:
   - タブ切り替え時のスムーズな遷移
   - コンテンツのフェードイン/アウト
   - エラー表示のスライドイン

3. **ローディングパターン**:
   - スピナーアニメーション
   - スケルトンUI（未実装）

## エラーハンドリングパターン

1. **API通信エラー**:
   - ネットワーク接続エラーの検出と通知
   - APIキー不在時のフォールバック処理

2. **データベース操作エラー**:
   - トランザクションエラー時のリトライロジック
   - データ整合性検証

## キャッシュ管理戦略

1. **データキャッシング**:
   - IndexedDBによるデータの永続化
   - アプリケーションデータの完全オフラインアクセス

2. **アプリケーションキャッシング**:
   - Service Workerによるアプリケーションシェルのキャッシング
   - 静的アセットのプリキャッシング
