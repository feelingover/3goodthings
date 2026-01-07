import { renderHook, act } from '@testing-library/react';
import { useEntryView } from '../useEntryView';
import type { DailyEntry } from '../../types';

describe('useEntryView フック', () => {
  const mockEntry: DailyEntry = {
    id: 1,
    date: '2025-05-16',
    items: [
      { id: 1, content: '良いこと1', createdAt: new Date(), hasRequestedComment: false }
    ],
    hasRequestedComment: false
  };

  test('初期状態が正しい（activeView: today, selectedEntry: null）', () => {
    const { result } = renderHook(() => useEntryView());

    expect(result.current.activeView).toBe('today');
    expect(result.current.selectedEntry).toBeNull();
  });

  test('setActiveViewでビューを切り替えられる（today ↔ history）', () => {
    const { result } = renderHook(() => useEntryView());

    // todayからhistoryへ
    act(() => {
      result.current.setActiveView('history');
    });
    expect(result.current.activeView).toBe('history');

    // historyからtodayへ
    act(() => {
      result.current.setActiveView('today');
    });
    expect(result.current.activeView).toBe('today');
  });

  test('selectEntryでエントリーを選択できる', () => {
    const { result } = renderHook(() => useEntryView());

    act(() => {
      result.current.selectEntry(mockEntry);
    });

    expect(result.current.selectedEntry).toEqual(mockEntry);
  });

  test('clearSelectionで選択をクリアできる', () => {
    const { result } = renderHook(() => useEntryView());

    // まず選択する
    act(() => {
      result.current.selectEntry(mockEntry);
    });
    expect(result.current.selectedEntry).toEqual(mockEntry);

    // クリアする
    act(() => {
      result.current.clearSelection();
    });
    expect(result.current.selectedEntry).toBeNull();
  });

  test('activeViewがtodayに変わると自動でselectedEntryがクリアされる（useEffectの検証）', () => {
    const { result } = renderHook(() => useEntryView());

    // historyビューに切り替えてエントリーを選択
    act(() => {
      result.current.setActiveView('history');
      result.current.selectEntry(mockEntry);
    });
    expect(result.current.activeView).toBe('history');
    expect(result.current.selectedEntry).toEqual(mockEntry);

    // todayビューに戻ると自動でクリアされる
    act(() => {
      result.current.setActiveView('today');
    });
    expect(result.current.activeView).toBe('today');
    expect(result.current.selectedEntry).toBeNull();
  });

  test('activeViewがhistoryに変わってもselectedEntryはクリアされない', () => {
    const { result } = renderHook(() => useEntryView());

    // todayビューでエントリーを選択
    act(() => {
      result.current.selectEntry(mockEntry);
    });
    expect(result.current.selectedEntry).toEqual(mockEntry);

    // historyビューに切り替えても選択は保持される
    act(() => {
      result.current.setActiveView('history');
    });
    expect(result.current.activeView).toBe('history');
    expect(result.current.selectedEntry).toEqual(mockEntry);
  });
});
