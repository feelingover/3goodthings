import { useCallback } from 'react';
import type { DailyEntry } from '../types';
import { getAiCommentForItem } from '../services/openai';
import { useNetworkStatus } from './useNetworkStatus';

export interface UseCommentManagementParams {
  saveItemComment: (date: string, itemIndex: number, comment: string) => Promise<void>;
  markItemCommentRequested: (date: string, itemIndex: number) => Promise<void>;
  getEntryByDate: (date: string) => Promise<DailyEntry | null>;
  selectedEntry: DailyEntry | null;
  onSelectedEntryUpdate: (entry: DailyEntry) => void;
}

export interface UseCommentManagementReturn {
  handleSaveItemComment: (
    entry: DailyEntry | null,
    itemIndex: number,
    comment: string
  ) => Promise<void>;

  handleItemCommentRequested: (
    entry: DailyEntry | null,
    itemIndex: number
  ) => Promise<void>;

  handleSaveEntryAndGetComment: (
    savedEntry: DailyEntry,
    items: string[]
  ) => Promise<void>;
}

/**
 * コメント管理フック
 * AIコメント取得・保存の複雑なロジックを集約
 * refreshTriggerが不要になる理由: saveItemCommentとmarkItemCommentRequestedが
 * useEntriesの部分更新により、自動的にReactの再レンダリングをトリガーするため
 */
export function useCommentManagement({
  saveItemComment,
  markItemCommentRequested,
  getEntryByDate,
  selectedEntry,
  onSelectedEntryUpdate
}: UseCommentManagementParams): UseCommentManagementReturn {
  const { isOnline } = useNetworkStatus();

  /**
   * 項目ごとのコメント保存ハンドラー
   */
  const handleSaveItemComment = useCallback(async (
    entry: DailyEntry | null,
    itemIndex: number,
    comment: string
  ) => {
    if (!entry) return;

    try {
      await saveItemComment(entry.date, itemIndex, comment);

      // selectedEntryが更新対象の場合、最新データを再取得して親に通知
      if (selectedEntry && selectedEntry.date === entry.date) {
        const updatedEntry = await getEntryByDate(entry.date);
        if (updatedEntry) {
          onSelectedEntryUpdate(updatedEntry);
        }
      }
      // ↑ refreshTrigger不要！useEntriesの部分更新で自動的にReactが再レンダリング
    } catch (err) {
      console.error('Failed to save item comment:', err);
    }
  }, [saveItemComment, getEntryByDate, selectedEntry, onSelectedEntryUpdate]);

  /**
   * 項目ごとのコメントリクエスト済みマークハンドラー
   */
  const handleItemCommentRequested = useCallback(async (
    entry: DailyEntry | null,
    itemIndex: number
  ) => {
    if (!entry) return;

    try {
      await markItemCommentRequested(entry.date, itemIndex);

      // selectedEntryが更新対象の場合、最新データを再取得して親に通知
      if (selectedEntry && selectedEntry.date === entry.date) {
        const updatedEntry = await getEntryByDate(entry.date);
        if (updatedEntry) {
          onSelectedEntryUpdate(updatedEntry);
        }
      }
      // ↑ refreshTrigger不要！useEntriesの部分更新で自動的にReactが再レンダリング
    } catch (err) {
      console.error('Failed to mark item comment requested:', err);
    }
  }, [markItemCommentRequested, getEntryByDate, selectedEntry, onSelectedEntryUpdate]);

  /**
   * エントリー保存とコメント自動取得ハンドラー
   * レート制限対策のため順次実行（並列ではない）
   */
  const handleSaveEntryAndGetComment = useCallback(async (
    savedEntry: DailyEntry,
    items: string[]
  ) => {
    // オフライン時は何もしない
    if (!isOnline) return;

    try {
      const today = savedEntry.date;
      const filledItems = items.filter(item => item.trim() !== '');

      // 各項目のコメントを順次取得（レート制限対策）
      for (let index = 0; index < filledItems.length; index++) {
        const item = filledItems[index];
        try {
          // 実際にコメントを取得
          const comment = await getAiCommentForItem(item, () => isOnline);
          // コメントを保存
          await saveItemComment(today, index, comment);
          // リクエスト済みフラグも設定
          await markItemCommentRequested(today, index);

          // ↑ useEntriesの部分更新により、Reactが自動で再レンダリング
          // refreshTrigger不要！
        } catch (error) {
          console.error(`Item ${index} comment fetch failed:`, error);
        }
      }
    } catch (err) {
      console.error('Failed to save entry and get comments:', err);
    }
  }, [isOnline, saveItemComment, markItemCommentRequested]);

  return {
    handleSaveItemComment,
    handleItemCommentRequested,
    handleSaveEntryAndGetComment
  };
}
