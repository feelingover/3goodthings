import { useState, useEffect } from 'react';
import type { DailyEntry } from '../types';

export interface UseEntryViewReturn {
  activeView: 'today' | 'history';
  selectedEntry: DailyEntry | null;
  setActiveView: (view: 'today' | 'history') => void;
  selectEntry: (entry: DailyEntry | null) => void;
  clearSelection: () => void;
}

/**
 * ビュー管理フック
 * activeView（today/history）とselectedEntryの状態を管理する
 */
export function useEntryView(): UseEntryViewReturn {
  const [activeView, setActiveView] = useState<'today' | 'history'>('today');
  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null);

  // activeViewが'today'に変わったら自動でselectedEntryをクリア
  useEffect(() => {
    if (activeView === 'today') {
      setSelectedEntry(null);
    }
  }, [activeView]);

  const selectEntry = (entry: DailyEntry | null) => setSelectedEntry(entry);
  const clearSelection = () => setSelectedEntry(null);

  return {
    activeView,
    selectedEntry,
    setActiveView,
    selectEntry,
    clearSelection
  };
}
