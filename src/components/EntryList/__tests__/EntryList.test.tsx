import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EntryList } from '../EntryList';
import type { DailyEntry } from '../../../types';

describe('EntryList コンポーネント', () => {
  const mockEntries: DailyEntry[] = [
    {
      id: 1,
      date: '2025-05-16',
      items: [
        { id: 1, content: '良いこと1', createdAt: new Date(), hasRequestedComment: false },
        { id: 2, content: '良いこと2', createdAt: new Date(), hasRequestedComment: false }
      ],
      hasRequestedComment: false
    },
    {
      id: 2,
      date: '2025-05-15',
      items: [
        { id: 3, content: '昨日の良いこと1', createdAt: new Date(), hasRequestedComment: true, aiComment: 'コメント' }
      ],
      hasRequestedComment: true,
      aiComment: '全体コメント'
    }
  ];
  
  const mockSelectEntry = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('エントリーリストが正しく表示される', () => {
    render(<EntryList entries={mockEntries} onSelectEntry={mockSelectEntry} />);
    
    // タイトルの確認
    expect(screen.getByText('記録一覧')).toBeInTheDocument();
    
    // 日付フォーマットの変換を確認
    expect(screen.getByText(/5月16日/)).toBeInTheDocument();
    expect(screen.getByText(/5月15日/)).toBeInTheDocument();
    
    // 項目数の表示確認
    expect(screen.getByText('2項目')).toBeInTheDocument();
    expect(screen.getByText('1項目')).toBeInTheDocument();
    
    // コメント表示の確認
    expect(screen.getByText('コメントあり')).toBeInTheDocument();
  });
  
  test('エントリーが空の場合のメッセージ表示', () => {
    render(<EntryList entries={[]} onSelectEntry={mockSelectEntry} />);
    expect(screen.getByText('記録がありません')).toBeInTheDocument();
  });
  
  test('ローディング中の表示', () => {
    render(<EntryList entries={[]} onSelectEntry={mockSelectEntry} isLoading={true} />);
    expect(screen.getByText('データを読み込み中...')).toBeInTheDocument();
  });
  
  test('エントリーをクリックするとonSelectEntryが呼ばれる', () => {
    render(<EntryList entries={mockEntries} onSelectEntry={mockSelectEntry} />);
    
    // 最初のエントリーをクリック
    const firstEntry = screen.getByText(/5月16日/);
    fireEvent.click(firstEntry.parentElement!);
    
    expect(mockSelectEntry).toHaveBeenCalledTimes(1);
    expect(mockSelectEntry).toHaveBeenCalledWith(mockEntries[0]);
  });
  
  test('選択されたエントリーにselectedクラスが追加される', () => {
    render(<EntryList entries={mockEntries} onSelectEntry={mockSelectEntry} />);
    
    // 最初のエントリーをクリック
    const firstEntry = screen.getByText(/5月16日/);
    const firstListItem = firstEntry.closest('li');
    fireEvent.click(firstEntry); // entry-content内の要素をクリックしてもイベントバブリングで親のハンドラが呼ばれるはずだが、実装ではentry-contentにonClickがある
    
    // selectedクラスが追加されているか確認
    expect(firstListItem).toHaveClass('selected');
    
    // 2つ目のエントリーをクリック
    const secondEntry = screen.getByText(/5月15日/);
    const secondListItem = secondEntry.closest('li');
    fireEvent.click(secondEntry);
    
    // クラスが切り替わっているか確認
    expect(firstListItem).not.toHaveClass('selected');
    expect(secondListItem).toHaveClass('selected');
  });
  
  test('日本語の曜日が正しく表示される', () => {
    // 特定の曜日になる日付をモック
    const mockEntriesWithDays: DailyEntry[] = [
      {
        id: 1,
        date: '2025-05-18', // 日曜日
        items: [{ id: 1, content: 'テスト', createdAt: new Date(), hasRequestedComment: false }],
        hasRequestedComment: false
      },
      {
        id: 2,
        date: '2025-05-19', // 月曜日
        items: [{ id: 2, content: 'テスト', createdAt: new Date(), hasRequestedComment: false }],
        hasRequestedComment: false
      }
    ];
    
    render(<EntryList entries={mockEntriesWithDays} onSelectEntry={mockSelectEntry} />);
    
    expect(screen.getByText(/5月18日 \(日\)/)).toBeInTheDocument();
    expect(screen.getByText(/5月19日 \(月\)/)).toBeInTheDocument();
  });
});
