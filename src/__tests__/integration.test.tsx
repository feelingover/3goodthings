import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { db } from '../db/database';
import * as openaiService from '../services/openai';
import * as networkHook from '../hooks/useNetworkStatus';

// モック
jest.mock('../db/database', () => ({
  db: {
    getDailyEntryByDate: jest.fn(),
    saveDailyEntry: jest.fn(),
    updateDailyEntry: jest.fn(),
    deleteDailyEntry: jest.fn(),
    getAllDailyEntries: jest.fn(),
    initialize: jest.fn().mockResolvedValue(undefined),
    getThemeSetting: jest.fn().mockResolvedValue('system'),
    saveThemeSetting: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.mock('../services/openai', () => ({
  getAiComment: jest.fn(),
  getAiCommentForItem: jest.fn(),
  checkNetworkConnection: jest.fn().mockReturnValue(true)
}));

// グローバルfetchのモック
global.fetch = jest.fn();

// window.matchMediaのモック
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

jest.mock('../hooks/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn().mockReturnValue({ isOnline: true })
}));

// 日付のモック
const mockDate = new Date('2025-05-16');
const mockDateString = '2025-05-16';
const OriginalDate = Date;

global.Date = class extends OriginalDate {
  constructor(...args: any[]) {
    super();
    if (args.length > 0) {
      return new OriginalDate(...args as [any]);
    }
    return mockDate;
  }

  static now() {
    return mockDate.getTime();
  }
} as any;

(global.Date as any).toISOString = jest.fn(() => mockDateString + 'T00:00:00.000Z');

describe('インテグレーションテスト', () => {
  let mockDb: Record<string, any> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {};

    // デフォルトのモック実装
    (db.getAllDailyEntries as jest.Mock).mockImplementation(() => {
      return Promise.resolve(Object.values(mockDb));
    });
    
    (db.getDailyEntryByDate as jest.Mock).mockImplementation((date) => {
      return Promise.resolve(mockDb[date] || null);
    });

    (db.saveDailyEntry as jest.Mock).mockImplementation((entry) => {
      mockDb[entry.date] = entry;
      if (entry.id) {
        return Promise.resolve(entry.id);
      } else {
        return Promise.resolve(1);
      }
    });

    (db.updateDailyEntry as jest.Mock).mockImplementation((date, items) => {
      if (mockDb[date]) {
        mockDb[date].items = items;
      }
      return Promise.resolve();
    });

    // fetchのモック実装（Cloudflare Workers APIレスポンス）
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ comment: '項目へのテストコメントです' })
    });

    (openaiService.getAiComment as jest.Mock).mockResolvedValue('テストコメントです');
    (openaiService.getAiCommentForItem as jest.Mock).mockResolvedValue('項目へのテストコメントです');
    (networkHook.useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: true });
  });

  test('エントリー入力から保存、AIコメント取得までの一連のフロー', async () => {
    render(<App />);

    // 初期ロード完了まで待つ
    await waitFor(() => {
      expect(screen.getByText('今日の3つの良いこと')).toBeInTheDocument();
    });

    // 入力フォームに値を入力
    const textareas = screen.getAllByRole('textbox');

    await act(async () => {
      fireEvent.change(textareas[0], { target: { value: '良いこと1' } });
      fireEvent.change(textareas[1], { target: { value: '良いこと2' } });
      fireEvent.change(textareas[2], { target: { value: '良いこと3' } });
    });

    // 保存ボタンをクリック
    const saveButton = screen.getByRole('button', { name: /保存してコメントを取得/i });

    await act(async () => {
      fireEvent.click(saveButton);
    });

    // データベース保存が呼ばれたか確認
    await waitFor(() => {
      expect(db.saveDailyEntry).toHaveBeenCalledWith(expect.objectContaining({
        date: mockDateString,
        items: expect.arrayContaining([
          expect.objectContaining({ content: '良いこと1' }),
          expect.objectContaining({ content: '良いこと2' }),
          expect.objectContaining({ content: '良いこと3' })
        ])
      }));
    });

    // AIコメント取得が順次実行されるまで待つ（3項目 × 順次）
    await waitFor(() => {
      expect(openaiService.getAiCommentForItem).toHaveBeenCalledTimes(3);
    }, { timeout: 5000 });
  });
  
  test('ネットワーク状態の変化に応じたUIの変更', async () => {
    // 初期状態はオンライン
    (networkHook.useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: true });

    const { rerender } = render(<App />);

    // 初期ロード完了まで待つ
    await waitFor(() => {
      expect(screen.getByText('今日の3つの良いこと')).toBeInTheDocument();
    });

    // エントリーフォームに入力（3つすべて入力してボタンを有効化）
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: '良いこと1' } });
    fireEvent.change(textareas[1], { target: { value: '良いこと2' } });
    fireEvent.change(textareas[2], { target: { value: '良いこと3' } });

    // オンライン状態ではボタンが有効
    await waitFor(() => {
      const saveButton = screen.getByRole('button', { name: /保存してコメントを取得/i });
      expect(saveButton).not.toBeDisabled();
    });

    // ネットワーク状態をオフラインに変更
    (networkHook.useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: false });

    // 再レンダリング
    rerender(<App />);

    // オフラインでもエントリーの保存は可能（ボタンは有効のまま）
    const saveButtonOffline = screen.getByRole('button', { name: /保存してコメントを取得/i });
    expect(saveButtonOffline).not.toBeDisabled();

    // 保存をクリック
    fireEvent.click(saveButtonOffline);

    // データベースの保存は呼ばれる（オフラインでも保存可能）
    await waitFor(() => {
      expect(db.saveDailyEntry).toHaveBeenCalled();
    });

    // AIコメント取得は呼ばれない（useCommentManagementがオフライン時にreturn）
    expect(openaiService.getAiCommentForItem).not.toHaveBeenCalled();

    // オフライン表示が出るか確認
    await waitFor(() => {
      const offlineElements = screen.queryAllByText(/オフライン/);
      expect(offlineElements.length).toBeGreaterThan(0);
    });
  });
  
  test('過去のエントリー表示と選択', async () => {
    // 過去のエントリーデータをモック（renderの前に設定）
    const mockEntries = [
      {
        id: 1,
        date: '2025-05-15',
        items: [
          { id: 1, content: '昨日の良いこと1', createdAt: new Date(), hasRequestedComment: true, aiComment: 'コメント1' },
          { id: 2, content: '昨日の良いこと2', createdAt: new Date(), hasRequestedComment: true, aiComment: 'コメント2' }
        ],
        hasRequestedComment: true,
        aiComment: '全体コメント'
      },
      {
        id: 2,
        date: '2025-05-14',
        items: [
          { id: 3, content: '一昨日の良いこと1', createdAt: new Date(), hasRequestedComment: true }
        ],
        hasRequestedComment: true
      }
    ];

    // beforeEach のモックをクリアして、このテスト用のモックを設定
    (db.getAllDailyEntries as jest.Mock).mockClear();
    (db.getAllDailyEntries as jest.Mock).mockResolvedValue(mockEntries);

    render(<App />);

    // 初期ロード完了まで待つ
    await waitFor(() => {
      expect(screen.getByText('今日の3つの良いこと')).toBeInTheDocument();
    });

    // 履歴タブに切り替え
    const historyTab = screen.getByRole('tab', { name: /履歴/i });

    await act(async () => {
      fireEvent.click(historyTab);
    });

    // 過去のエントリーが表示されるまで待つ（曜日も含む形式: "5月15日(木)"）
    await waitFor(() => {
      expect(screen.getByText(/5月15日/)).toBeInTheDocument();
      expect(screen.getByText(/5月14日/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // 過去のエントリーをクリック
    const pastEntry = screen.getByText(/5月15日/);
    fireEvent.click(pastEntry);

    // 選択されたエントリーの内容が表示されるか確認
    await waitFor(() => {
      expect(screen.getByText('昨日の良いこと1')).toBeInTheDocument();
      expect(screen.getByText('昨日の良いこと2')).toBeInTheDocument();
    });

    // AIコメントも表示されるか確認
    expect(screen.getByText('コメント1')).toBeInTheDocument();
    expect(screen.getByText('コメント2')).toBeInTheDocument();
  });

  test('入力検証とエラー表示', async () => {
    render(<App />);

    // 初期ロード完了まで待つ
    await waitFor(() => {
      expect(screen.getByText('今日の3つの良いこと')).toBeInTheDocument();
    });

    const textareas = screen.getAllByRole('textbox');

    // 文字数上限を超える長いテキストを入力（1001文字で制限超過）
    const longText = 'あ'.repeat(1001);
    fireEvent.change(textareas[0], { target: { value: longText } });

    // エラーメッセージが表示されるか確認
    await waitFor(() => {
      const errorMsg = screen.queryByText(/1000文字以内にしてください/i);
      expect(errorMsg).toBeInTheDocument();
    });

    // エラー状態では保存ボタンが無効になっているか
    const saveButton = screen.getByRole('button', { name: /保存してコメントを取得/i });
    expect(saveButton).toBeDisabled();
  });
  
  test('AIコメント取得失敗時のエラーハンドリング', async () => {
    // console.errorのスパイを設定
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // AIコメント取得が失敗するようにモック
    (openaiService.getAiCommentForItem as jest.Mock).mockRejectedValue(new Error('APIエラー'));

    render(<App />);

    // 初期ロード完了まで待つ
    await waitFor(() => {
      expect(screen.getByText('今日の3つの良いこと')).toBeInTheDocument();
    });

    // エントリーフォームに入力
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: '良いこと1' } });
    fireEvent.change(textareas[1], { target: { value: '良いこと2' } });
    fireEvent.change(textareas[2], { target: { value: '良いこと3' } });

    // 保存ボタンをクリック
    const saveButton = screen.getByRole('button', { name: /保存してコメントを取得/i });
    fireEvent.click(saveButton);

    // データベース保存は成功
    await waitFor(() => {
      expect(db.saveDailyEntry).toHaveBeenCalled();
    });

    // console.errorが呼ばれることを確認（useCommentManagementでエラーログ記録）
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    }, { timeout: 5000 });

    // クリーンアップ
    consoleErrorSpy.mockRestore();
  });
});
