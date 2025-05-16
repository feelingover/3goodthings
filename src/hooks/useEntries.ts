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
  saveAiComment: (date: string, comment: string) => Promise<void>;
  markCommentRequested: (date: string) => Promise<void>;
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
          items: [],
          hasRequestedComment: false
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
        createdAt: new Date()
      }));
      
      if (entry) {
        entry.items = entryItems;
      } else {
        entry = {
          date,
          items: entryItems,
          hasRequestedComment: false
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

  // AIコメントを保存
  const saveAiComment = async (date: string, comment: string): Promise<void> => {
    try {
      const entry = await db.getDailyEntryByDate(date);
      
      if (entry) {
        entry.aiComment = comment;
        entry.hasRequestedComment = true;
        await db.saveDailyEntry(entry);
        
        // 今日の日付の場合、todayEntryを更新
        if (date === getTodayDate()) {
          setTodayEntry({...entry});
        }
        
        // 全エントリーリストも更新
        await loadAllEntries();
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  // コメントをリクエスト済みとしてマーク
  const markCommentRequested = async (date: string): Promise<void> => {
    try {
      const entry = await db.getDailyEntryByDate(date);
      
      if (entry) {
        entry.hasRequestedComment = true;
        await db.saveDailyEntry(entry);
        
        // 今日の日付の場合、todayEntryを更新
        if (date === getTodayDate()) {
          setTodayEntry({...entry});
        }
        
        // 全エントリーリストも更新
        await loadAllEntries();
      }
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
    saveAiComment,
    markCommentRequested
  };
}
