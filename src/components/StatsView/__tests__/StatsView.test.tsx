import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatsView } from '../StatsView';
import { DailyEntry } from '../../../types';

// statsCalculator のモック
jest.mock('../../../utils/statsCalculator', () => ({
  calculateStreak: jest.fn(),
  countTotalEntries: jest.fn(),
  countThisWeekEntries: jest.fn(),
  countThisMonthEntries: jest.fn(),
  countTotalItems: jest.fn()
}));

import * as statsCalculator from '../../../utils/statsCalculator';

describe('StatsView', () => {
  const mockEntries: DailyEntry[] = [
    {
      date: '2024-01-01',
      items: [
        { content: '良いこと1', createdAt: new Date('2024-01-01'), hasRequestedComment: false },
        { content: '良いこと2', createdAt: new Date('2024-01-01'), hasRequestedComment: false },
        { content: '良いこと3', createdAt: new Date('2024-01-01'), hasRequestedComment: false }
      ]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ローディング状態を正しく表示する', () => {
    render(<StatsView entries={[]} isLoading={true} />);
    expect(screen.getByText('統計を読み込んでいます...')).toBeInTheDocument();
  });

  test('統計データを正しく表示する', () => {
    // モック設定
    (statsCalculator.calculateStreak as jest.Mock).mockReturnValue(5);
    (statsCalculator.countTotalEntries as jest.Mock).mockReturnValue(10);
    (statsCalculator.countThisWeekEntries as jest.Mock).mockReturnValue(3);
    (statsCalculator.countThisMonthEntries as jest.Mock).mockReturnValue(7);
    (statsCalculator.countTotalItems as jest.Mock).mockReturnValue(30);

    render(<StatsView entries={mockEntries} isLoading={false} />);

    // ストリーク表示確認
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/素晴らしい！5日連続/)).toBeInTheDocument();

    // 総記録数表示確認
    expect(screen.getByText('10')).toBeInTheDocument();

    // 総項目数表示確認
    expect(screen.getByText('30')).toBeInTheDocument();

    // 今週の記録数表示確認
    expect(screen.getByText('3')).toBeInTheDocument();

    // 今月の記録数表示確認
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  test('ストリークが0の場合、適切なメッセージを表示する', () => {
    (statsCalculator.calculateStreak as jest.Mock).mockReturnValue(0);
    (statsCalculator.countTotalEntries as jest.Mock).mockReturnValue(0);
    (statsCalculator.countThisWeekEntries as jest.Mock).mockReturnValue(0);
    (statsCalculator.countThisMonthEntries as jest.Mock).mockReturnValue(0);
    (statsCalculator.countTotalItems as jest.Mock).mockReturnValue(0);

    render(<StatsView entries={[]} isLoading={false} />);

    expect(screen.getByText('今日から記録を始めましょう！')).toBeInTheDocument();
  });

  test('記録がない場合、エンプティステートを表示する', () => {
    (statsCalculator.calculateStreak as jest.Mock).mockReturnValue(0);
    (statsCalculator.countTotalEntries as jest.Mock).mockReturnValue(0);
    (statsCalculator.countThisWeekEntries as jest.Mock).mockReturnValue(0);
    (statsCalculator.countThisMonthEntries as jest.Mock).mockReturnValue(0);
    (statsCalculator.countTotalItems as jest.Mock).mockReturnValue(0);

    render(<StatsView entries={[]} isLoading={false} />);

    expect(screen.getByText('まだ記録がありません')).toBeInTheDocument();
    expect(screen.getByText(/「今日の記録」タブから/)).toBeInTheDocument();
  });

  test('ARIA属性が正しく設定されている', () => {
    (statsCalculator.calculateStreak as jest.Mock).mockReturnValue(5);
    (statsCalculator.countTotalEntries as jest.Mock).mockReturnValue(10);
    (statsCalculator.countThisWeekEntries as jest.Mock).mockReturnValue(3);
    (statsCalculator.countThisMonthEntries as jest.Mock).mockReturnValue(7);
    (statsCalculator.countTotalItems as jest.Mock).mockReturnValue(30);

    render(<StatsView entries={mockEntries} isLoading={false} />);

    // region ロールを持つ要素が存在することを確認
    const statsRegion = screen.getByRole('region', { name: '統計情報' });
    expect(statsRegion).toBeInTheDocument();

    // article ロールを持つ統計カードが存在することを確認
    const articles = screen.getAllByRole('article');
    expect(articles.length).toBeGreaterThan(0);
  });
});
