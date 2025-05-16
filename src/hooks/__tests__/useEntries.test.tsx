import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEntries } from '../useEntries';
import { db } from '../../db/database';

// dbのモック化
jest.mock('../../db/database', () => ({
  db: {
    getDailyEntryByDate: jest.fn(),
    saveDailyEntry: jest.fn(),
    getAllDailyEntries: jest.fn()
  }
}));

// 日付関数のモック
const mockDate = new Date('2025-05-16');
const mockDateString = '2025-05-16';
global.Date = jest.fn(() => mockDate) as any;
(global.Date as any).toISOString = jest.fn(() => mockDateString + 'T00:00:00.000Z');

describe('useEntries フック', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // デフォルトのモック実装
    (db.getAllDailyEntries as jest.Mock).mockResolvedValue([]);
    (db.getDailyEntryByDate as jest.Mock).mockResolvedValue(null);
    (db.saveDailyEntry as jest.Mock).mockImplementation((entry) => {
      if (entry.id) {
        return Promise.resolve(entry.id);
      } else {
        return Promise.resolve(1); // 新しいIDとして1を返す
      }
    });
  });

  test('todayEntryとallEntriesが初期化される', async () => {
    const { result } = renderHook(() => useEntries());
    
    // 初期状態ではローディング中
    expect(result.current.isLoading).toBe(true);
    
    // データが読み込まれるまで待つ
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // 初期状態の確認
    expect(result.current.todayEntry).toEqual({
      date: mockDateString,
      items: [],
      hasRequestedComment: false
    });
    expect(result.current.allEntries).toEqual([]);
  });

  test('saveEntry関数が新しいエントリーを保存する', async () => {
    const { result } = renderHook(() => useEntries());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    await act(async () => {
      await result.current.saveEntry(['項目1', '項目2', '項目3']);
    });
    
    // DBの関数呼び出しを検証
    expect(db.saveDailyEntry).toHaveBeenCalledWith(expect.objectContaining({
      date: mockDateString,
      items: expect.arrayContaining([
        expect.objectContaining({ 
          content: '項目1', 
          hasRequestedComment: false 
        })
      ])
    }));
  });

  test('saveAiComment関数がコメントを保存する', async () => {
    // 既存のエントリーをモック
    const mockEntry = {
      id: 1,
      date: mockDateString,
      items: [{ content: '項目1', createdAt: new Date() }],
      hasRequestedComment: false
    };
    
    (db.getDailyEntryByDate as jest.Mock).mockResolvedValue(mockEntry);
    
    const { result } = renderHook(() => useEntries());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    await act(async () => {
      await result.current.saveAiComment(mockDateString, 'テストコメント');
    });
    
    // コメントが保存されたか検証
    expect(db.saveDailyEntry).toHaveBeenCalledWith(expect.objectContaining({
      id: 1,
      aiComment: 'テストコメント',
      hasRequestedComment: true
    }));
  });

  test('saveItemComment関数が項目のコメントを保存する', async () => {
    // 既存のエントリーをモック（2つの項目を持つ）
    const mockEntry = {
      id: 1,
      date: mockDateString,
      items: [
        { content: '項目1', createdAt: new Date(), hasRequestedComment: false },
        { content: '項目2', createdAt: new Date(), hasRequestedComment: false }
      ],
      hasRequestedComment: false
    };
    
    (db.getDailyEntryByDate as jest.Mock).mockResolvedValue(mockEntry);
    
    const { result } = renderHook(() => useEntries());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    await act(async () => {
      await result.current.saveItemComment(mockDateString, 1, '項目へのコメント');
    });
    
    // コメントが項目に保存されたか検証
    expect(db.saveDailyEntry).toHaveBeenCalledWith(expect.objectContaining({
      id: 1,
      items: [
        expect.objectContaining({ content: '項目1' }),
        expect.objectContaining({
          content: '項目2',
          aiComment: '項目へのコメント',
          hasRequestedComment: true
        })
      ]
    }));
  });

  test('markItemCommentRequested関数が項目のリクエスト状態をマークする', async () => {
    // 既存のエントリーをモック
    const mockEntry = {
      id: 1,
      date: mockDateString,
      items: [
        { content: '項目1', createdAt: new Date(), hasRequestedComment: false }
      ],
      hasRequestedComment: false
    };
    
    (db.getDailyEntryByDate as jest.Mock).mockResolvedValue(mockEntry);
    
    const { result } = renderHook(() => useEntries());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    await act(async () => {
      await result.current.markItemCommentRequested(mockDateString, 0);
    });
    
    // hasRequestedCommentフラグが設定されたか検証
    expect(db.saveDailyEntry).toHaveBeenCalledWith(expect.objectContaining({
      id: 1,
      items: [
        expect.objectContaining({
          content: '項目1',
          hasRequestedComment: true
        })
      ]
    }));
  });
});
