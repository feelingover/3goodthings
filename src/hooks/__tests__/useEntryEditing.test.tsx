import { renderHook, act } from '@testing-library/react';
import { useEntryEditing } from '../useEntryEditing';
import type { DailyEntry } from '../../types';

describe('useEntryEditing フック', () => {
  const mockEntry: DailyEntry = {
    id: 1,
    date: '2025-05-16',
    items: [
      { id: 1, content: '良いこと1', createdAt: new Date(), hasRequestedComment: false }
    ],
    hasRequestedComment: false
  };

  const mockEntry2: DailyEntry = {
    id: 2,
    date: '2025-05-15',
    items: [
      { id: 2, content: '良いこと2', createdAt: new Date(), hasRequestedComment: false }
    ],
    hasRequestedComment: false
  };

  test('初期状態が正しい（editingEntry: null, deleteConfirmEntry: null）', () => {
    const { result } = renderHook(() => useEntryEditing());

    expect(result.current.editingEntry).toBeNull();
    expect(result.current.deleteConfirmEntry).toBeNull();
  });

  test('startEditで編集状態を開始できる', () => {
    const { result } = renderHook(() => useEntryEditing());

    act(() => {
      result.current.startEdit(mockEntry);
    });

    expect(result.current.editingEntry).toEqual(mockEntry);
    expect(result.current.deleteConfirmEntry).toBeNull();
  });

  test('cancelEditで編集状態をクリアできる', () => {
    const { result } = renderHook(() => useEntryEditing());

    // まず編集状態を開始
    act(() => {
      result.current.startEdit(mockEntry);
    });
    expect(result.current.editingEntry).toEqual(mockEntry);

    // キャンセルする
    act(() => {
      result.current.cancelEdit();
    });
    expect(result.current.editingEntry).toBeNull();
  });

  test('confirmDeleteで削除確認状態を開始できる', () => {
    const { result } = renderHook(() => useEntryEditing());

    act(() => {
      result.current.confirmDelete(mockEntry);
    });

    expect(result.current.deleteConfirmEntry).toEqual(mockEntry);
    expect(result.current.editingEntry).toBeNull();
  });

  test('cancelDeleteで削除確認状態をクリアできる', () => {
    const { result } = renderHook(() => useEntryEditing());

    // まず削除確認状態を開始
    act(() => {
      result.current.confirmDelete(mockEntry);
    });
    expect(result.current.deleteConfirmEntry).toEqual(mockEntry);

    // キャンセルする
    act(() => {
      result.current.cancelDelete();
    });
    expect(result.current.deleteConfirmEntry).toBeNull();
  });

  test('編集中に別のエントリーを編集開始すると上書きされる', () => {
    const { result } = renderHook(() => useEntryEditing());

    // 最初のエントリーを編集開始
    act(() => {
      result.current.startEdit(mockEntry);
    });
    expect(result.current.editingEntry).toEqual(mockEntry);

    // 別のエントリーを編集開始（上書き）
    act(() => {
      result.current.startEdit(mockEntry2);
    });
    expect(result.current.editingEntry).toEqual(mockEntry2);
  });

  test('編集中に削除確認を開くことができる（状態競合のテスト）', () => {
    const { result } = renderHook(() => useEntryEditing());

    // 編集状態を開始
    act(() => {
      result.current.startEdit(mockEntry);
    });
    expect(result.current.editingEntry).toEqual(mockEntry);
    expect(result.current.deleteConfirmEntry).toBeNull();

    // 編集中に削除確認を開く（両方の状態が同時に存在可能）
    act(() => {
      result.current.confirmDelete(mockEntry2);
    });
    expect(result.current.editingEntry).toEqual(mockEntry);
    expect(result.current.deleteConfirmEntry).toEqual(mockEntry2);
  });

  test('削除確認中に編集を開始できる（状態競合のテスト）', () => {
    const { result } = renderHook(() => useEntryEditing());

    // 削除確認状態を開始
    act(() => {
      result.current.confirmDelete(mockEntry);
    });
    expect(result.current.deleteConfirmEntry).toEqual(mockEntry);
    expect(result.current.editingEntry).toBeNull();

    // 削除確認中に編集を開始（両方の状態が同時に存在可能）
    act(() => {
      result.current.startEdit(mockEntry2);
    });
    expect(result.current.deleteConfirmEntry).toEqual(mockEntry);
    expect(result.current.editingEntry).toEqual(mockEntry2);
  });
});
