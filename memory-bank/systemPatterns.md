# 3 Good Things - システムパターン

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

## データモデル

### 主要エンティティ

1. **EntryItem**: 個々の「良いこと」のエントリー
   ```typescript
   interface EntryItem {
     id?: number;
     content: string;    // 内容（最大1000文字）
     createdAt: Date;    // 作成日時
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
├── EntryForm
│   └── (入力フォームコンポーネント)
├── AiComment
│   └── (AIコメント表示コンポーネント)
└── EntryList
    └── (過去のエントリー表示)
```

## データフローパターン

1. **記録作成フロー**:
   ```
   User Input → EntryForm → useEntries Hook → Database → UI Update
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
