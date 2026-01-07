import { useState } from 'react';
import type { DailyEntry } from '../types';

export interface UseEntryEditingReturn {
  editingEntry: DailyEntry | null;
  deleteConfirmEntry: DailyEntry | null;
  startEdit: (entry: DailyEntry) => void;
  cancelEdit: () => void;
  confirmDelete: (entry: DailyEntry) => void;
  cancelDelete: () => void;
}

/**
 * エントリー編集・削除管理フック
 * editingEntryとdeleteConfirmEntryの状態を管理する
 */
export function useEntryEditing(): UseEntryEditingReturn {
  const [editingEntry, setEditingEntry] = useState<DailyEntry | null>(null);
  const [deleteConfirmEntry, setDeleteConfirmEntry] = useState<DailyEntry | null>(null);

  const startEdit = (entry: DailyEntry) => setEditingEntry(entry);
  const cancelEdit = () => setEditingEntry(null);
  const confirmDelete = (entry: DailyEntry) => setDeleteConfirmEntry(entry);
  const cancelDelete = () => setDeleteConfirmEntry(null);

  return {
    editingEntry,
    deleteConfirmEntry,
    startEdit,
    cancelEdit,
    confirmDelete,
    cancelDelete
  };
}
