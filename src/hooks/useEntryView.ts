import { useState, useEffect } from 'react';
import type { DailyEntry } from '../types';

export type ViewType = 'today' | 'history' | 'stats';

export interface UseEntryViewReturn {
  activeView: ViewType;
  selectedEntry: DailyEntry | null;
  setActiveView: (view: ViewType) => void;
  selectEntry: (entry: DailyEntry | null) => void;
  clearSelection: () => void;
}

/**
 * ビュー管理フック
 * activeView（today/history/stats）とselectedEntryの状態を管理する
 */
export function useEntryView(): UseEntryViewReturn {
  const [activeView, setActiveView] = useState<ViewType>('today');
  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null);

  // activeViewが'today'または'stats'に変わったら自動でselectedEntryをクリア
  useEffect(() => {
    if (activeView === 'today' || activeView === 'stats') {
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
