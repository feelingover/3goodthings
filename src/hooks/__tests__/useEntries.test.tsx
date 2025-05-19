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
  // コンソールエラーの抑制（エラー処理テスト用）
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    
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
  
  afterEach(() => {
    console.error = originalConsoleError;
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

  test('データベースエラー時の処理が正しく行われる', async () => {
    // エラーをスローするようにモック
    (db.getAllDailyEntries as jest.Mock).mockRejectedValue(new Error('データベースエラー'));
    
    const { result } = renderHook(() => useEntries());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('データの取得に失敗しました: データベースエラー');
    });
  });
  
  test('存在しない日付のエントリーを取得しようとした場合の処理', async () => {
    // null を返すモック（エントリーが存在しない場合）
    (db.getDailyEntryByDate as jest.Mock).mockResolvedValue(null);
    
    const { result } = renderHook(() => useEntries());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // 特定の日付のエントリーを取得
    const nonExistentDate = '2099-12-31';
    const entry = await result.current.getEntryByDate(nonExistentDate);
    
    // 新しい空のエントリーが作成されるか
    expect(entry).toEqual({
      date: nonExistentDate,
      items: [],
      hasRequestedComment: false
    });
  });
  
  test('saveEntry で保存に失敗した場合のエラーハンドリング', async () => {
    (db.saveDailyEntry as jest.Mock).mockRejectedValue(new Error('保存エラー'));
    
    const { result } = renderHook(() => useEntries());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    let error;
    await act(async () => {
      try {
        await result.current.saveEntry(['テスト項目']);
      } catch (e) {
        error = e;
      }
    });
    
    // エラーが適切に処理されるか
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('保存エラー');
    expect(result.current.error).toBe('データの保存に失敗しました: 保存エラー');
  });

  test('非同期操作の競合状態（レースコンディション）の処理', async () => {
    // 初期状態では空の配列を返す
    (db.getAllDailyEntries as jest.Mock).mockResolvedValue([]);
    
    // 遅延するレスポンスを準備
    const slowResponse = new Promise(resolve => {
      setTimeout(() => {
        resolve([
          { id: 1, date: '2025-05-01', items: [{ content: '古いデータ' }] }
        ]);
      }, 100);
    });
    
    const fastResponse = Promise.resolve([
      { id: 2, date: '2025-05-02', items: [{ content: '新しいデータ' }] }
    ]);
    
    // 最初は遅いレスポンス、次に速いレスポンスを返すようにモック
    (db.getAllDailyEntries as jest.Mock)
      .mockImplementationOnce(() => slowResponse)
      .mockImplementationOnce(() => fastResponse);
    
    const { result, rerender } = renderHook(() => useEntries());
    
    // 最初のフェッチが完了する前に再レンダリング
    rerender();
    
    // 速いレスポンスが先に完了するので、それが反映される
    await waitFor(() => {
      expect(result.current.allEntries).toEqual([
        { id: 2, date: '2025-05-02', items: [{ content: '新しいデータ' }] }
      ]);
    });
  });
  
  test('日付フォーマットのバリデーション', async () => {
    const { result } = renderHook(() => useEntries());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // 無効な日付形式でのエラーハンドリング
    let error;
    await act(async () => {
      try {
        await result.current.getEntryByDate('invalid-date');
      } catch (e) {
        error = e;
      }
    });
    
    expect(error).toBeDefined();
    expect(error.message).toContain('日付フォーマットが無効です');
  });
  
});
