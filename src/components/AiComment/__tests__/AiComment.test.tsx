import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AiComment, AiCommentItem } from '../AiComment';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';

// モック
jest.mock('../../../hooks/useNetworkStatus');
jest.mock('../../../services/openai', () => ({
  getAiComment: jest.fn().mockResolvedValue('テストコメントです'),
  getAiCommentForItem: jest.fn().mockResolvedValue('項目へのテストコメントです'),
  checkNetworkConnection: jest.fn().mockReturnValue(true)
}));

// OpenAIサービスのモック関数をインポート
import { getAiComment, getAiCommentForItem, checkNetworkConnection } from '../../../services/openai';

// useNetworkStatusモックの型定義
const mockUseNetworkStatus = useNetworkStatus as jest.MockedFunction<typeof useNetworkStatus>;

describe('AiComment コンポーネント（全体コメント）', () => {
  const mockSaved = jest.fn();
  const mockRequested = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });
    (getAiComment as jest.Mock).mockResolvedValue('テストコメントです');
    (checkNetworkConnection as jest.Mock).mockReturnValue(true);
  });
  
  test('コメントがない場合にボタンが表示される', () => {
    render(
      <AiComment
        items={['良いこと1', '良いこと2', '良いこと3']}
        hasRequestedComment={false}
        onCommentSaved={mockSaved}
        onCommentRequested={mockRequested}
      />
    );
    
    expect(screen.getByRole('button', { name: /AIコメントを取得/i })).toBeInTheDocument();
  });
  
  test('コメントがある場合にコメントが表示される', () => {
    render(
      <AiComment
        items={['良いこと1', '良いこと2', '良いこと3']}
        initialComment="既存のコメント"
        hasRequestedComment={true}
        onCommentSaved={mockSaved}
        onCommentRequested={mockRequested}
      />
    );
    
    expect(screen.getByText('既存のコメント')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /AIコメントを取得/i })).not.toBeInTheDocument();
  });
  
  test('オフライン時にオフライン表示になる', () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });
    
    render(
      <AiComment
        items={['良いこと1', '良いこと2', '良いこと3']}
        hasRequestedComment={false}
        onCommentSaved={mockSaved}
        onCommentRequested={mockRequested}
      />
    );
    
    expect(screen.getByText(/オフラインのため/i)).toBeInTheDocument();
  });
  
  test('コメント取得ボタンクリックでAPIが呼ばれる', async () => {
    render(
      <AiComment
        items={['良いこと1', '良いこと2', '良いこと3']}
        hasRequestedComment={false}
        onCommentSaved={mockSaved}
        onCommentRequested={mockRequested}
      />
    );
    
    const button = screen.getByRole('button', { name: /AIコメントを取得/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(getAiComment).toHaveBeenCalledWith(['良いこと1', '良いこと2', '良いこと3']);
      expect(mockSaved).toHaveBeenCalledWith('テストコメントです');
      expect(mockRequested).toHaveBeenCalled();
    });
  });

  test('API呼び出し中にローディング表示がされる', async () => {
    render(
      <AiComment
        items={['良いこと1', '良いこと2', '良いこと3']}
        hasRequestedComment={false}
        onCommentSaved={mockSaved}
        onCommentRequested={mockRequested}
      />
    );
    
    // APIレスポンスを遅延させる
    (getAiComment as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve('テストコメントです'), 100))
    );
    
    const button = screen.getByRole('button', { name: /AIコメントを取得/i });
    fireEvent.click(button);
    
    expect(screen.getByText(/コメント取得中/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockSaved).toHaveBeenCalledWith('テストコメントです');
    });
  });
  
  test('API呼び出しが失敗した場合にエラーが表示される', async () => {
    (getAiComment as jest.Mock).mockRejectedValueOnce(new Error('APIエラー発生'));
    
    render(
      <AiComment
        items={['良いこと1', '良いこと2', '良いこと3']}
        hasRequestedComment={false}
        onCommentSaved={mockSaved}
        onCommentRequested={mockRequested}
      />
    );
    
    const button = screen.getByRole('button', { name: /AIコメントを取得/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/コメントの取得に失敗しました: APIエラー発生/i)).toBeInTheDocument();
      expect(mockSaved).not.toHaveBeenCalled();
    });
  });

  test('項目が足りない場合はエラーが表示される', async () => {
    render(
      <AiComment
        items={['良いこと1', '良いこと2']} // 3つ目がない
        hasRequestedComment={false}
        onCommentSaved={mockSaved}
        onCommentRequested={mockRequested}
      />
    );
    
    const button = screen.getByRole('button', { name: /AIコメントを取得/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/3つすべての項目を入力してください/i)).toBeInTheDocument();
      expect(getAiComment).not.toHaveBeenCalled();
    });
  });

  test('ネットワーク状態の変化に対応する', async () => {
    const { rerender } = render(
      <AiComment
        items={['良いこと1', '良いこと2', '良いこと3']}
        hasRequestedComment={false}
        onCommentSaved={mockSaved}
        onCommentRequested={mockRequested}
      />
    );
    
    // オンラインの場合
    expect(screen.getByRole('button', { name: /AIコメントを取得/i })).toBeInTheDocument();
    
    // オフラインに変更
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });
    
    rerender(
      <AiComment
        items={['良いこと1', '良いこと2', '良いこと3']}
        hasRequestedComment={false}
        onCommentSaved={mockSaved}
        onCommentRequested={mockRequested}
      />
    );
    
    // オフラインメッセージが表示される
    expect(screen.getByText(/オフラインのため/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /AIコメントを取得/i })).not.toBeInTheDocument();
    
    // 再びオンラインに変更
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });
    
    rerender(
      <AiComment
        items={['良いこと1', '良いこと2', '良いこと3']}
        hasRequestedComment={false}
        onCommentSaved={mockSaved}
        onCommentRequested={mockRequested}
      />
    );
    
    // ボタンが再表示される
    expect(screen.getByRole('button', { name: /AIコメントを取得/i })).toBeInTheDocument();
  });
});

describe('AiCommentItem コンポーネント（項目ごとのコメント）', () => {
  const mockSaved = jest.fn();
  const mockRequested = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });
    (getAiCommentForItem as jest.Mock).mockResolvedValue('項目へのテストコメントです');
    (checkNetworkConnection as jest.Mock).mockReturnValue(true);
  });
  
  test('コメントがない場合にボタンが表示される', () => {
    render(
      <AiCommentItem
        item="良いこと1"
        itemIndex={0}
        hasRequestedComment={false}
        onCommentSaved={mockSaved}
        onCommentRequested={mockRequested}
      />
    );
    
    expect(screen.getByRole('button', { name: /AIコメントを取得/i })).toBeInTheDocument();
  });
  
  test('コメントがある場合にコメントが表示される', () => {
    render(
      <AiCommentItem
        item="良いこと1"
        itemIndex={0}
        initialComment="項目へのコメント"
        hasRequestedComment={true}
        onCommentSaved={mockSaved}
        onCommentRequested={mockRequested}
      />
    );
    
    expect(screen.getByText('項目へのコメント')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /AIコメントを取得/i })).not.toBeInTheDocument();
  });
  
  test('オフライン時にオフライン表示になる', () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });
    
    render(
      <AiCommentItem
        item="良いこと1"
        itemIndex={0}
        hasRequestedComment={false}
        onCommentSaved={mockSaved}
        onCommentRequested={mockRequested}
      />
    );
    
    expect(screen.getByText(/オフライン中のため/i)).toBeInTheDocument();
  });
  
  test('コメント取得ボタンクリックでAPIが呼ばれる', async () => {
    render(
      <AiCommentItem
        item="良いこと1"
        itemIndex={0}
        hasRequestedComment={false}
        onCommentSaved={mockSaved}
        onCommentRequested={mockRequested}
      />
    );
    
    const button = screen.getByRole('button', { name: /AIコメントを取得/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(getAiCommentForItem).toHaveBeenCalledWith('良いこと1', expect.any(Function));
      expect(mockSaved).toHaveBeenCalledWith(0, '項目へのテストコメントです');
      expect(mockRequested).toHaveBeenCalledWith(0);
    });
  });

  test('API呼び出しが失敗した場合にエラーが表示される', async () => {
    (getAiCommentForItem as jest.Mock).mockRejectedValueOnce(new Error('APIエラー発生'));
    
    render(
      <AiCommentItem
        item="良いこと1"
        itemIndex={0}
        hasRequestedComment={false}
        onCommentSaved={mockSaved}
        onCommentRequested={mockRequested}
      />
    );
    
    const button = screen.getByRole('button', { name: /AIコメントを取得/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/コメントの取得に失敗しました: APIエラー発生/i)).toBeInTheDocument();
      expect(mockSaved).not.toHaveBeenCalled();
    });
  });
  
  test('ネットワークチェックがfalseを返す場合にエラーが表示される', async () => {
    (checkNetworkConnection as jest.Mock).mockReturnValue(false);
    
    render(
      <AiCommentItem
        item="良いこと1"
        itemIndex={0}
        hasRequestedComment={false}
        onCommentSaved={mockSaved}
        onCommentRequested={mockRequested}
      />
    );
    
    const button = screen.getByRole('button', { name: /AIコメントを取得/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/オフラインのため、コメントを取得できません/i)).toBeInTheDocument();
      expect(getAiCommentForItem).not.toHaveBeenCalled();
    });
  });

  test('コンソールログ出力の検証（デバッグ用）', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    
    render(
      <AiCommentItem
        item="これはとても長いテキストです。これは20文字を超えています。"
        itemIndex={1}
        initialComment="これもとても長いコメントです。これも20文字を超えています。"
        hasRequestedComment={true}
        onCommentSaved={mockSaved}
        onCommentRequested={mockRequested}
      />
    );
    
    // コンソールログが期待通りに呼び出されたか
    expect(consoleSpy).toHaveBeenCalledWith(
      'AiCommentItem[1]:',
      expect.objectContaining({
        item: 'これはとても長いテキ...',
        initialComment: 'これもとても長いコ...',
        comment: 'これもとても長いコ...',
        hasRequestedComment: true,
        isOnline: true
      })
    );
    
    consoleSpy.mockRestore();
  });
  
  test('空の項目の場合はメッセージが表示される', () => {
    render(
      <AiCommentItem
        item=""
        itemIndex={0}
        hasRequestedComment={false}
        onCommentSaved={mockSaved}
        onCommentRequested={mockRequested}
      />
    );
    
    expect(screen.getByText(/項目を入力するとAIからのコメントを表示できます/i)).toBeInTheDocument();
  });
});
