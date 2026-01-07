import { useState, memo } from 'react';
import type { DailyEntry } from '../../types';
import './EntryList.css';

interface EntryListProps {
  entries: DailyEntry[];
  onSelectEntry: (entry: DailyEntry) => void;
  onEditEntry?: (entry: DailyEntry) => void;
  onDeleteEntry?: (entry: DailyEntry) => void;
  isLoading?: boolean;
}

export const EntryList = memo(function EntryList({
  entries,
  onSelectEntry,
  onEditEntry,
  onDeleteEntry,
  isLoading = false
}: EntryListProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 日付を日本語の曜日付きフォーマットに変換
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    
    return `${month}月${day}日 (${weekday})`;
  };

  // エントリーがクリックされたときのハンドラ
  const handleEntryClick = (entry: DailyEntry) => {
    setSelectedDate(entry.date);
    onSelectEntry(entry);
  };

  if (isLoading) {
    return <div className="entry-list-loading" role="status" aria-live="polite">データを読み込み中...</div>;
  }

  if (entries.length === 0) {
    return <div className="entry-list-empty">記録がありません</div>;
  }

  return (
    <div className="entry-list">
      <h2 id="entry-list-title">記録一覧</h2>
      <ul className="entry-items" role="list" aria-labelledby="entry-list-title">
        {entries.map((entry) => (
          <li
            key={entry.date}
            className={`entry-item ${selectedDate === entry.date ? 'selected' : ''}`}
            role="listitem"
          >
            <div
              className="entry-content"
              onClick={() => handleEntryClick(entry)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleEntryClick(entry);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`${formatDate(entry.date)}の記録を表示`}
            >
              <div className="entry-date">{formatDate(entry.date)}</div>
              <div className="entry-summary">
                <span className="entry-count">{entry.items.length}項目</span>
                {entry.items.some(item => item.aiComment) && (
                  <span className="has-comment">コメントあり</span>
                )}
              </div>
            </div>
            {(onEditEntry || onDeleteEntry) && (
              <div className="entry-actions">
                {onEditEntry && (
                  <button
                    className="icon-button edit-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEntry(entry);
                    }}
                    aria-label={`${formatDate(entry.date)}のエントリーを編集`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                )}
                {onDeleteEntry && (
                  <button
                    className="icon-button delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteEntry(entry);
                    }}
                    aria-label={`${formatDate(entry.date)}のエントリーを削除`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
});
