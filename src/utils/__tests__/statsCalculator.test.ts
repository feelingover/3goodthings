import {
  calculateStreak,
  countTotalEntries,
  countThisWeekEntries,
  countThisMonthEntries,
  countTotalItems
} from '../statsCalculator';
import { DailyEntry } from '../../types';

// テスト用のモックデータ
const createMockEntry = (dateStr: string, itemCount: number = 3): DailyEntry => ({
  date: dateStr,
  items: Array(itemCount).fill(null).map((_, i) => ({
    content: `良いこと${i + 1}`,
    createdAt: new Date(dateStr),
    hasRequestedComment: false
  }))
});

// ヘルパー関数
function getDateBefore(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - days);
  return formatDate(date);
}

function getDateAfter(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('statsCalculator', () => {
  describe('calculateStreak', () => {
    test('今日記録がある場合、連続日数を正しく計算する', () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = getDateBefore(today, 1);
      const twoDaysAgo = getDateBefore(today, 2);

      const entries = [
        createMockEntry(today),
        createMockEntry(yesterday),
        createMockEntry(twoDaysAgo)
      ];

      expect(calculateStreak(entries)).toBe(3);
    });

    test('昨日記録があり今日はない場合、昨日までのストリークを計算する', () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = getDateBefore(today, 1);
      const twoDaysAgo = getDateBefore(today, 2);

      const entries = [
        createMockEntry(yesterday),
        createMockEntry(twoDaysAgo)
      ];

      expect(calculateStreak(entries)).toBe(2);
    });

    test('今日も昨日も記録がない場合、ストリークは0', () => {
      const threeDaysAgo = getDateBefore(new Date().toISOString().split('T')[0], 3);
      const entries = [createMockEntry(threeDaysAgo)];

      expect(calculateStreak(entries)).toBe(0);
    });

    test('空配列の場合、ストリークは0', () => {
      expect(calculateStreak([])).toBe(0);
    });

    test('連続でない記録がある場合、直近の連続のみカウント', () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = getDateBefore(today, 1);
      const fourDaysAgo = getDateBefore(today, 4);  // 間が空いている

      const entries = [
        createMockEntry(today),
        createMockEntry(yesterday),
        createMockEntry(fourDaysAgo)
      ];

      expect(calculateStreak(entries)).toBe(2);  // 今日+昨日のみ
    });
  });

  describe('countTotalEntries', () => {
    test('総記録数を正しくカウントする', () => {
      const entries = [
        createMockEntry('2024-01-01'),
        createMockEntry('2024-01-02'),
        createMockEntry('2024-01-03')
      ];

      expect(countTotalEntries(entries)).toBe(3);
    });

    test('空配列の場合、0を返す', () => {
      expect(countTotalEntries([])).toBe(0);
    });
  });

  describe('countTotalItems', () => {
    test('総項目数を正しくカウントする', () => {
      const entries = [
        createMockEntry('2024-01-01', 3),
        createMockEntry('2024-01-02', 2),
        createMockEntry('2024-01-03', 3)
      ];

      expect(countTotalItems(entries)).toBe(8);
    });

    test('空配列の場合、0を返す', () => {
      expect(countTotalItems([])).toBe(0);
    });
  });

  describe('countThisWeekEntries', () => {
    test('今週の記録数を正しくカウントする', () => {
      const today = new Date();
      const sunday = new Date(today);
      sunday.setDate(today.getDate() - today.getDay());

      const sundayStr = formatDate(sunday);
      const mondayStr = getDateAfter(sundayStr, 1);
      const lastWeekStr = getDateBefore(sundayStr, 1);

      const entries = [
        createMockEntry(sundayStr),
        createMockEntry(mondayStr),
        createMockEntry(lastWeekStr)  // 先週（カウント外）
      ];

      expect(countThisWeekEntries(entries)).toBe(2);
    });
  });

  describe('countThisMonthEntries', () => {
    test('今月の記録数を正しくカウントする', () => {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 15);

      const entries = [
        createMockEntry(formatDate(firstDay)),
        createMockEntry(formatDate(today)),
        createMockEntry(formatDate(lastMonth))  // 先月（カウント外）
      ];

      expect(countThisMonthEntries(entries)).toBe(2);
    });
  });
});
