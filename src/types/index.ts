// エントリー項目（各「良いこと」の記録）
export interface EntryItem {
  id?: number;
  content: string;    // 内容（最大1000文字）
  createdAt: Date;    // 作成日時
  aiComment?: string; // この項目に対するOpenAI APIからのコメント
  hasRequestedComment?: boolean; // この項目のコメントをリクエスト済みかどうか
}

// 日毎のエントリー（最大3つのEntryItemを持つ）
export interface DailyEntry {
  id?: number;
  date: string;       // 日付（YYYY-MM-DD形式）
  items: EntryItem[]; // 最大3つの「良いこと」
  aiComment?: string; // OpenAI APIからのコメント
  hasRequestedComment: boolean; // コメントをリクエスト済みかどうか
}
