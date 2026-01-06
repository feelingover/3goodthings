import { useState, useEffect, useCallback } from 'react';
import type { DailyEntry, EntryItem } from '../types';
import { db } from '../db/database';

// 日付をYYYY-MM-DD形式の文字列に変換
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// 今日の日付を取得
const getTodayDate = (): string => {
  return formatDate(new Date());
};

interface UseEntriesReturn {
  todayEntry: DailyEntry | null;
  allEntries: DailyEntry[];
  isLoading: boolean;
  error: Error | null;
  saveEntry: (items: string[]) => Promise<DailyEntry>;
  getEntryByDate: (date: string) => Promise<DailyEntry | null>;
  saveItemComment: (date: string, itemIndex: number, comment: string) => Promise<void>;
  markItemCommentRequested: (date: string, itemIndex: number) => Promise<void>;
  deleteEntry: (date: string) => Promise<void>;
  updateEntry: (date: string, items: string[]) => Promise<void>;
}

export function useEntries(): UseEntriesReturn {
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);
  const [allEntries, setAllEntries] = useState<DailyEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // 全てのエントリーを読み込む
  const loadAllEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const entries = await db.getAllDailyEntries();
      setAllEntries(entries);
      setIsLoading(false);
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
    }
  }, []);

  // 今日のエントリーを読み込む
  const loadTodayEntry = useCallback(async () => {
    try {
      const today = getTodayDate();
      const entry = await db.getDailyEntryByDate(today);
      
      if (entry) {
        setTodayEntry(entry);
      } else {
        setTodayEntry({
          date: today,
          items: []
        });
      }
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  // 初期化時にデータを読み込む
  useEffect(() => {
    loadTodayEntry();
    loadAllEntries();
  }, [loadTodayEntry, loadAllEntries]);

  // エントリーを保存する
  const saveEntry = async (items: string[]): Promise<DailyEntry> => {
    try {
      const date = getTodayDate();
      let entry = await db.getDailyEntryByDate(date);
      
      const entryItems: EntryItem[] = items.map((content) => ({
        content,
        createdAt: new Date(),
        hasRequestedComment: false
      }));
      
      if (entry) {
        entry.items = entryItems;
      } else {
        entry = {
          date,
          items: entryItems
        };
      }
      
      await db.saveDailyEntry(entry);
      
      // 再読み込み
      await loadTodayEntry();
      await loadAllEntries();
      
      return entry;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  // 特定の日付のエントリーを取得
  const getEntryByDate = async (date: string): Promise<DailyEntry | null> => {
    try {
      const entry = await db.getDailyEntryByDate(date);
      return entry || null;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  
  // 特定の項目に対するAIコメントを保存
  const saveItemComment = async (date: string, itemIndex: number, comment: string): Promise<void> => {
    try {
      const entry = await db.getDailyEntryByDate(date);
      
      if (entry && entry.items[itemIndex]) {
        // 項目のコメントを更新
        entry.items[itemIndex].aiComment = comment;
        entry.items[itemIndex].hasRequestedComment = true;
        
        await db.saveDailyEntry(entry);
        
        // 今日の日付の場合、todayEntryを更新
        if (date === getTodayDate()) {
          setTodayEntry({...entry});
        }
        
        // 全エントリーリストも更新
        await loadAllEntries();
      } else {
        const errorMessage = !entry 
          ? `saveItemComment: 指定された日付のエントリーが存在しません。date: ${date}`
          : `saveItemComment: 指定されたインデックス(${itemIndex})のアイテムが存在しません。現在のアイテム数: ${entry.items.length}`;
        console.warn(errorMessage);
        const error = new Error(errorMessage);
        setError(error);
        throw error;
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  
  // 特定の項目のコメントをリクエスト済みとしてマーク
  const markItemCommentRequested = async (date: string, itemIndex: number): Promise<void> => {
    try {
      const entry = await db.getDailyEntryByDate(date);
      
      if (entry && entry.items[itemIndex]) {
        entry.items[itemIndex].hasRequestedComment = true;
        await db.saveDailyEntry(entry);
        
        // 今日の日付の場合、todayEntryを更新
        if (date === getTodayDate()) {
          setTodayEntry({...entry});
        }
        
        // 全エントリーリストも更新
        await loadAllEntries();
      } else {
        // エラーログを出力
        const errorMessage = !entry 
          ? `markItemCommentRequested: 指定された日付のエントリーが存在しません。date: ${date}`
          : `markItemCommentRequested: 指定されたインデックス(${itemIndex})のアイテムが存在しません。現在のアイテム数: ${entry.items.length}`;
        
        console.warn(errorMessage);
        
        // エラー状態を設定して上流コンポーネントでハンドリングできるようにする
        const error = new Error(errorMessage);
        setError(error);
        throw error;
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  // エントリーを削除
  const deleteEntry = async (date: string): Promise<void> => {
    try {
      await db.deleteDailyEntry(date);

      // todayEntryが削除された場合は空にする
      if (date === getTodayDate()) {
        setTodayEntry({
          date: date,
          items: []
        });
      }

      // 全エントリーリストを再読み込み
      await loadAllEntries();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  // エントリーを更新
  const updateEntry = async (date: string, items: string[]): Promise<void> => {
    try {
      const entryItems: EntryItem[] = items.map((content) => ({
        content,
        createdAt: new Date(),
        hasRequestedComment: false
      }));

      await db.updateDailyEntry(date, entryItems);

      // todayEntryが更新された場合は再読み込み
      if (date === getTodayDate()) {
        await loadTodayEntry();
      }

      // 全エントリーリストを再読み込み
      await loadAllEntries();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return {
    todayEntry,
    allEntries,
    isLoading,
    error,
    saveEntry,
    getEntryByDate,
    saveItemComment,
    markItemCommentRequested,
    deleteEntry,
    updateEntry
  };
}
