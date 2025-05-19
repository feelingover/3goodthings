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
    getAllDailyEntries: jest.fn(),
    initialize: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.mock('../services/openai', () => ({
  getAiComment: jest.fn(),
  getAiCommentForItem: jest.fn(),
  checkNetworkConnection: jest.fn().mockReturnValue(true)
}));

jest.mock('../hooks/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn().mockReturnValue({ isOnline: true })
}));

// 日付のモック
const mockDate = new Date('2025-05-16');
const mockDateString = '2025-05-16';
global.Date = jest.fn(() => mockDate) as any;
(global.Date as any).toISOString = jest.fn(() => mockDateString + 'T00:00:00.000Z');

describe('インテグレーションテスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // デフォルトのモック実装
    (db.getAllDailyEntries as jest.Mock).mockResolvedValue([]);
    (db.getDailyEntryByDate as jest.Mock).mockResolvedValue(null);
    (db.saveDailyEntry as jest.Mock).mockImplementation((entry) => {
      if (entry.id) {
        return Promise.resolve(entry.id);
      } else {
        return Promise.resolve(1);
      }
    });
    (openaiService.getAiComment as jest.Mock).mockResolvedValue('テストコメントです');
    (openaiService.getAiCommentForItem as jest.Mock).mockResolvedValue('項目へのテストコメントです');
    (networkHook.useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: true });
  });

  test('エントリー入力から保存、AIコメント取得までの一連のフロー', async () => {
    render(<App />);
    
    // 初回レンダリング時のローディング状態を確認
    expect(screen.getByText('今日の3つの良いこと')).toBeInTheDocument();
    
    // 入力フォームに値を入力
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: '良いこと1' } });
    fireEvent.change(textareas[1], { target: { value: '良いこと2' } });
    fireEvent.change(textareas[2], { target: { value: '良いこと3' } });
    
    // 保存ボタンをクリック
    const saveButton = screen.getByRole('button', { name: /保存してコメントを取得/i });
    fireEvent.click(saveButton);
    
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
    
    // AIコメント取得が呼ばれたか確認（実装によって異なる可能性あり）
    await waitFor(() => {
      // 以下のいずれか、または両方が呼ばれる可能性がある
      const commentApiCalled = 
        (openaiService.getAiComment as jest.Mock).mock.calls.length > 0 || 
        (openaiService.getAiCommentForItem as jest.Mock).mock.calls.length > 0;
      
      expect(commentApiCalled).toBe(true);
    });
  });
  
  test('ネットワーク状態の変化に応じたUIの変更', async () => {
    // 初期状態はオンライン
    (networkHook.useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: true });
    
    const { rerender } = render(<App />);
    
    // エントリーフォームに入力
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: '良いこと1' } });

    // オンライン状態ではボタンが有効
    const saveButton = screen.getByRole('button', { name: /保存してコメントを取得/i });
    expect(saveButton).not.toBeDisabled();
    
    // ネットワーク状態をオフラインに変更
    (networkHook.useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: false });
    
    // 再レンダリング
    rerender(<App />);
    
    // オフラインでもエントリーの保存は可能なはず
    const saveButtonOffline = screen.getByRole('button', { name: /保存してコメントを取得/i });
    expect(saveButtonOffline).not.toBeDisabled();
    
    // 保存をクリック
    fireEvent.click(saveButtonOffline);
    
    // データベースの保存は呼ばれるが、AIコメント取得は呼ばれない
    await waitFor(() => {
      expect(db.saveDailyEntry).toHaveBeenCalled();
      expect(openaiService.getAiComment).not.toHaveBeenCalled();
    });
    
    // オフライン表示が出るか確認
    await waitFor(() => {
      const offlineElements = screen.queryAllByText(/オフライン/);
      expect(offlineElements.length).toBeGreaterThan(0);
    });
  });
  
  test('過去のエントリー表示と選択', async () => {
    // 過去のエントリーデータをモック
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
    
    (db.getAllDailyEntries as jest.Mock).mockResolvedValue(mockEntries);
    
    render(<App />);
    
    // エントリー一覧が表示されるまで待つ
    await waitFor(() => {
      expect(screen.getByText('記録一覧')).toBeInTheDocument();
    });
    
    // 過去のエントリーが表示されていることを確認
    await waitFor(() => {
      expect(screen.getByText(/5月15日/)).toBeInTheDocument();
      expect(screen.getByText(/5月14日/)).toBeInTheDocument();
    });
    
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
    // 文字数制限を持つApp（実際のアプリに合わせて調整が必要）
    render(<App />);
    
    const textareas = screen.getAllByRole('textbox');
    
    // 文字数上限を超える長いテキストを入力（実際の上限に合わせて調整）
    const longText = 'あ'.repeat(2000);  // 1000文字制限と仮定
    fireEvent.change(textareas[0], { target: { value: longText } });
    
    // エラーメッセージが表示されるか確認
    await waitFor(() => {
      const errorMsg = screen.queryByText(/文字以内にしてください/i);
      expect(errorMsg).toBeInTheDocument();
    });
    
    // エラー状態では保存ボタンが無効になっているか
    const saveButton = screen.getByRole('button', { name: /保存してコメントを取得/i });
    expect(saveButton).toBeDisabled();
  });
  
  test('AIコメント取得失敗時のエラーハンドリング', async () => {
    // AIコメント取得が失敗するようにモック
    (openaiService.getAiComment as jest.Mock).mockRejectedValue(new Error('APIエラー'));
    
    render(<App />);
    
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
    
    // エラーメッセージが表示されるか確認
    await waitFor(() => {
      const errorMsg = screen.queryAllByText(/失敗しました/i);
      expect(errorMsg.length).toBeGreaterThan(0);
    });
  });
});
