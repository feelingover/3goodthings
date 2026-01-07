import { renderHook, act, waitFor } from '@testing-library/react';
import { useCommentManagement } from '../useCommentManagement';
import * as openaiService from '../../services/openai';
import * as networkHook from '../useNetworkStatus';
import type { DailyEntry } from '../../types';

// モック
jest.mock('../../services/openai', () => ({
  getAiCommentForItem: jest.fn()
}));

jest.mock('../useNetworkStatus', () => ({
  useNetworkStatus: jest.fn()
}));

describe('useCommentManagement フック', () => {
  // モック関数
  const mockSaveItemComment = jest.fn();
  const mockMarkItemCommentRequested = jest.fn();
  const mockGetEntryByDate = jest.fn();
  const mockOnSelectedEntryUpdate = jest.fn();

  // テスト用データ
  const mockEntry: DailyEntry = {
    id: 1,
    date: '2025-05-16',
    items: [
      { id: 1, content: '良いこと1', createdAt: new Date(), hasRequestedComment: false },
      { id: 2, content: '良いこと2', createdAt: new Date(), hasRequestedComment: false },
      { id: 3, content: '良いこと3', createdAt: new Date(), hasRequestedComment: false }
    ],
    hasRequestedComment: false
  };

  const mockSelectedEntry: DailyEntry = {
    id: 2,
    date: '2025-05-16',
    items: [
      { id: 4, content: '選択中のエントリー', createdAt: new Date(), hasRequestedComment: false }
    ],
    hasRequestedComment: false
  };

  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // デフォルトのモック実装
    (networkHook.useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: true });
    (openaiService.getAiCommentForItem as jest.Mock).mockResolvedValue('テストコメント');
    mockSaveItemComment.mockResolvedValue(undefined);
    mockMarkItemCommentRequested.mockResolvedValue(undefined);
    mockGetEntryByDate.mockResolvedValue(mockSelectedEntry);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Group 1: handleSaveItemComment', () => {
    test('コメント保存成功（正常系）', async () => {
      const { result } = renderHook(() =>
        useCommentManagement({
          saveItemComment: mockSaveItemComment,
          markItemCommentRequested: mockMarkItemCommentRequested,
          getEntryByDate: mockGetEntryByDate,
          selectedEntry: null,
          onSelectedEntryUpdate: mockOnSelectedEntryUpdate
        })
      );

      await act(async () => {
        await result.current.handleSaveItemComment(mockEntry, 0, 'コメント1');
      });

      expect(mockSaveItemComment).toHaveBeenCalledWith('2025-05-16', 0, 'コメント1');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('entryがnullの場合は何もしない（防御的プログラミング）', async () => {
      const { result } = renderHook(() =>
        useCommentManagement({
          saveItemComment: mockSaveItemComment,
          markItemCommentRequested: mockMarkItemCommentRequested,
          getEntryByDate: mockGetEntryByDate,
          selectedEntry: null,
          onSelectedEntryUpdate: mockOnSelectedEntryUpdate
        })
      );

      await act(async () => {
        await result.current.handleSaveItemComment(null, 0, 'コメント1');
      });

      expect(mockSaveItemComment).not.toHaveBeenCalled();
      expect(mockGetEntryByDate).not.toHaveBeenCalled();
    });

    test('selectedEntry更新の同期処理（selectedEntryが保存対象と同じ日付）', async () => {
      const { result } = renderHook(() =>
        useCommentManagement({
          saveItemComment: mockSaveItemComment,
          markItemCommentRequested: mockMarkItemCommentRequested,
          getEntryByDate: mockGetEntryByDate,
          selectedEntry: mockSelectedEntry,
          onSelectedEntryUpdate: mockOnSelectedEntryUpdate
        })
      );

      await act(async () => {
        await result.current.handleSaveItemComment(mockSelectedEntry, 0, 'コメント1');
      });

      expect(mockSaveItemComment).toHaveBeenCalledWith('2025-05-16', 0, 'コメント1');
      expect(mockGetEntryByDate).toHaveBeenCalledWith('2025-05-16');
      expect(mockOnSelectedEntryUpdate).toHaveBeenCalledWith(mockSelectedEntry);
    });

    test('selectedEntryが異なる日付の場合は再取得しない（パフォーマンス）', async () => {
      const differentEntry: DailyEntry = {
        id: 3,
        date: '2025-05-15',
        items: [],
        hasRequestedComment: false
      };

      const { result } = renderHook(() =>
        useCommentManagement({
          saveItemComment: mockSaveItemComment,
          markItemCommentRequested: mockMarkItemCommentRequested,
          getEntryByDate: mockGetEntryByDate,
          selectedEntry: mockSelectedEntry,
          onSelectedEntryUpdate: mockOnSelectedEntryUpdate
        })
      );

      await act(async () => {
        await result.current.handleSaveItemComment(differentEntry, 0, 'コメント1');
      });

      expect(mockSaveItemComment).toHaveBeenCalledWith('2025-05-15', 0, 'コメント1');
      expect(mockGetEntryByDate).not.toHaveBeenCalled();
      expect(mockOnSelectedEntryUpdate).not.toHaveBeenCalled();
    });

    test('saveItemComment失敗時のエラーハンドリング（console.error確認）', async () => {
      mockSaveItemComment.mockRejectedValue(new Error('保存失敗'));

      const { result } = renderHook(() =>
        useCommentManagement({
          saveItemComment: mockSaveItemComment,
          markItemCommentRequested: mockMarkItemCommentRequested,
          getEntryByDate: mockGetEntryByDate,
          selectedEntry: null,
          onSelectedEntryUpdate: mockOnSelectedEntryUpdate
        })
      );

      await act(async () => {
        await result.current.handleSaveItemComment(mockEntry, 0, 'コメント1');
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save item comment:',
        expect.any(Error)
      );
    });
  });

  describe('Group 2: handleItemCommentRequested', () => {
    test('リクエスト済みマーク成功（正常系）', async () => {
      const { result } = renderHook(() =>
        useCommentManagement({
          saveItemComment: mockSaveItemComment,
          markItemCommentRequested: mockMarkItemCommentRequested,
          getEntryByDate: mockGetEntryByDate,
          selectedEntry: null,
          onSelectedEntryUpdate: mockOnSelectedEntryUpdate
        })
      );

      await act(async () => {
        await result.current.handleItemCommentRequested(mockEntry, 0);
      });

      expect(mockMarkItemCommentRequested).toHaveBeenCalledWith('2025-05-16', 0);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('entryがnullの場合は何もしない', async () => {
      const { result } = renderHook(() =>
        useCommentManagement({
          saveItemComment: mockSaveItemComment,
          markItemCommentRequested: mockMarkItemCommentRequested,
          getEntryByDate: mockGetEntryByDate,
          selectedEntry: null,
          onSelectedEntryUpdate: mockOnSelectedEntryUpdate
        })
      );

      await act(async () => {
        await result.current.handleItemCommentRequested(null, 0);
      });

      expect(mockMarkItemCommentRequested).not.toHaveBeenCalled();
    });

    test('selectedEntry更新の同期処理', async () => {
      const { result } = renderHook(() =>
        useCommentManagement({
          saveItemComment: mockSaveItemComment,
          markItemCommentRequested: mockMarkItemCommentRequested,
          getEntryByDate: mockGetEntryByDate,
          selectedEntry: mockSelectedEntry,
          onSelectedEntryUpdate: mockOnSelectedEntryUpdate
        })
      );

      await act(async () => {
        await result.current.handleItemCommentRequested(mockSelectedEntry, 0);
      });

      expect(mockMarkItemCommentRequested).toHaveBeenCalledWith('2025-05-16', 0);
      expect(mockGetEntryByDate).toHaveBeenCalledWith('2025-05-16');
      expect(mockOnSelectedEntryUpdate).toHaveBeenCalledWith(mockSelectedEntry);
    });

    test('エラーハンドリング', async () => {
      mockMarkItemCommentRequested.mockRejectedValue(new Error('マーク失敗'));

      const { result } = renderHook(() =>
        useCommentManagement({
          saveItemComment: mockSaveItemComment,
          markItemCommentRequested: mockMarkItemCommentRequested,
          getEntryByDate: mockGetEntryByDate,
          selectedEntry: null,
          onSelectedEntryUpdate: mockOnSelectedEntryUpdate
        })
      );

      await act(async () => {
        await result.current.handleItemCommentRequested(mockEntry, 0);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to mark item comment requested:',
        expect.any(Error)
      );
    });
  });

  describe('Group 3: handleSaveEntryAndGetComment', () => {
    test('3項目すべてコメント取得成功（順次実行）', async () => {
      const { result } = renderHook(() =>
        useCommentManagement({
          saveItemComment: mockSaveItemComment,
          markItemCommentRequested: mockMarkItemCommentRequested,
          getEntryByDate: mockGetEntryByDate,
          selectedEntry: null,
          onSelectedEntryUpdate: mockOnSelectedEntryUpdate
        })
      );

      const savedEntry: DailyEntry = {
        id: 1,
        date: '2025-05-16',
        items: [],
        hasRequestedComment: false
      };

      const items = ['良いこと1', '良いこと2', '良いこと3'];

      await act(async () => {
        await result.current.handleSaveEntryAndGetComment(savedEntry, items);
      });

      // getAiCommentForItemが3回順番に呼ばれることを検証
      expect(openaiService.getAiCommentForItem).toHaveBeenCalledTimes(3);
      expect(openaiService.getAiCommentForItem).toHaveBeenNthCalledWith(1, '良いこと1', expect.any(Function));
      expect(openaiService.getAiCommentForItem).toHaveBeenNthCalledWith(2, '良いこと2', expect.any(Function));
      expect(openaiService.getAiCommentForItem).toHaveBeenNthCalledWith(3, '良いこと3', expect.any(Function));

      // コメント保存とリクエスト済みマークが各項目で呼ばれることを検証
      expect(mockSaveItemComment).toHaveBeenCalledTimes(3);
      expect(mockMarkItemCommentRequested).toHaveBeenCalledTimes(3);
    });

    test('空文字列の項目は除外される（items.filter()のロジック検証）', async () => {
      const { result } = renderHook(() =>
        useCommentManagement({
          saveItemComment: mockSaveItemComment,
          markItemCommentRequested: mockMarkItemCommentRequested,
          getEntryByDate: mockGetEntryByDate,
          selectedEntry: null,
          onSelectedEntryUpdate: mockOnSelectedEntryUpdate
        })
      );

      const savedEntry: DailyEntry = {
        id: 1,
        date: '2025-05-16',
        items: [],
        hasRequestedComment: false
      };

      const items = ['良いこと1', '  ', '良いこと2', '', '良いこと3'];

      await act(async () => {
        await result.current.handleSaveEntryAndGetComment(savedEntry, items);
      });

      // 空白を除外して3項目のみ処理される
      expect(openaiService.getAiCommentForItem).toHaveBeenCalledTimes(3);
      expect(mockSaveItemComment).toHaveBeenCalledTimes(3);
    });

    test('オフライン時は何もしない（if (!isOnline) return; のロジック検証）', async () => {
      (networkHook.useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: false });

      const { result } = renderHook(() =>
        useCommentManagement({
          saveItemComment: mockSaveItemComment,
          markItemCommentRequested: mockMarkItemCommentRequested,
          getEntryByDate: mockGetEntryByDate,
          selectedEntry: null,
          onSelectedEntryUpdate: mockOnSelectedEntryUpdate
        })
      );

      const savedEntry: DailyEntry = {
        id: 1,
        date: '2025-05-16',
        items: [],
        hasRequestedComment: false
      };

      const items = ['良いこと1', '良いこと2', '良いこと3'];

      await act(async () => {
        await result.current.handleSaveEntryAndGetComment(savedEntry, items);
      });

      // オフライン時は何も実行されない
      expect(openaiService.getAiCommentForItem).not.toHaveBeenCalled();
      expect(mockSaveItemComment).not.toHaveBeenCalled();
      expect(mockMarkItemCommentRequested).not.toHaveBeenCalled();
    });

    test('部分的な失敗 - 1つのコメント取得が失敗しても他は継続', async () => {
      (openaiService.getAiCommentForItem as jest.Mock)
        .mockResolvedValueOnce('コメント1')
        .mockRejectedValueOnce(new Error('API失敗'))
        .mockResolvedValueOnce('コメント3');

      const { result } = renderHook(() =>
        useCommentManagement({
          saveItemComment: mockSaveItemComment,
          markItemCommentRequested: mockMarkItemCommentRequested,
          getEntryByDate: mockGetEntryByDate,
          selectedEntry: null,
          onSelectedEntryUpdate: mockOnSelectedEntryUpdate
        })
      );

      const savedEntry: DailyEntry = {
        id: 1,
        date: '2025-05-16',
        items: [],
        hasRequestedComment: false
      };

      const items = ['良いこと1', '良いこと2', '良いこと3'];

      await act(async () => {
        await result.current.handleSaveEntryAndGetComment(savedEntry, items);
      });

      // 3回すべて実行される（1つ失敗しても継続）
      expect(openaiService.getAiCommentForItem).toHaveBeenCalledTimes(3);

      // 成功した2つのコメントは保存される
      expect(mockSaveItemComment).toHaveBeenCalledTimes(2);
      expect(mockSaveItemComment).toHaveBeenNthCalledWith(1, '2025-05-16', 0, 'コメント1');
      expect(mockSaveItemComment).toHaveBeenNthCalledWith(2, '2025-05-16', 2, 'コメント3');

      // エラーログが記録される
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Item 1 comment fetch failed:',
        expect.any(Error)
      );
    });

    test('全てのコメント取得が失敗（エラーログ記録の確認）', async () => {
      (openaiService.getAiCommentForItem as jest.Mock).mockRejectedValue(new Error('API失敗'));

      const { result } = renderHook(() =>
        useCommentManagement({
          saveItemComment: mockSaveItemComment,
          markItemCommentRequested: mockMarkItemCommentRequested,
          getEntryByDate: mockGetEntryByDate,
          selectedEntry: null,
          onSelectedEntryUpdate: mockOnSelectedEntryUpdate
        })
      );

      const savedEntry: DailyEntry = {
        id: 1,
        date: '2025-05-16',
        items: [],
        hasRequestedComment: false
      };

      const items = ['良いこと1', '良いこと2', '良いこと3'];

      await act(async () => {
        await result.current.handleSaveEntryAndGetComment(savedEntry, items);
      });

      // 3回すべて実行される
      expect(openaiService.getAiCommentForItem).toHaveBeenCalledTimes(3);

      // すべて失敗するため保存は呼ばれない
      expect(mockSaveItemComment).not.toHaveBeenCalled();

      // 3回のエラーログが記録される
      expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
    });
  });
});
