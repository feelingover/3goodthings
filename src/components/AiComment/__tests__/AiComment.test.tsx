import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AiComment, AiCommentItem } from '../AiComment';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';

// モック
jest.mock('../../../hooks/useNetworkStatus');
jest.mock('../../../services/openai', () => ({
  getAiComment: jest.fn().mockResolvedValue('テストコメントです'),
  getAiCommentForItem: jest.fn().mockResolvedValue('項目へのテストコメントです')
}));

// OpenAIサービスのモック関数をインポート
import { getAiComment, getAiCommentForItem } from '../../../services/openai';

// useNetworkStatusモックの型定義
const mockUseNetworkStatus = useNetworkStatus as jest.MockedFunction<typeof useNetworkStatus>;

describe('AiComment コンポーネント（全体コメント）', () => {
  const mockSaved = jest.fn();
  const mockRequested = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });
    (getAiComment as jest.Mock).mockResolvedValue('テストコメントです');
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
});

describe('AiCommentItem コンポーネント（項目ごとのコメント）', () => {
  const mockSaved = jest.fn();
  const mockRequested = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });
    (getAiCommentForItem as jest.Mock).mockResolvedValue('項目へのテストコメントです');
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
      expect(getAiCommentForItem).toHaveBeenCalledWith('良いこと1');
      expect(mockSaved).toHaveBeenCalledWith(0, '項目へのテストコメントです');
      expect(mockRequested).toHaveBeenCalledWith(0);
    });
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
