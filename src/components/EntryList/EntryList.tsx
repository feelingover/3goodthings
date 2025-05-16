import { useState } from 'react';
import type { DailyEntry } from '../../types';
import './EntryList.css';

interface EntryListProps {
  entries: DailyEntry[];
  onSelectEntry: (entry: DailyEntry) => void;
  isLoading?: boolean;
}

export function EntryList({ entries, onSelectEntry, isLoading = false }: EntryListProps) {
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
    return <div className="entry-list-loading">データを読み込み中...</div>;
  }

  if (entries.length === 0) {
    return <div className="entry-list-empty">記録がありません</div>;
  }

  return (
    <div className="entry-list">
      <h2>記録一覧</h2>
      <ul className="entry-items">
        {entries.map((entry) => (
          <li 
            key={entry.date} 
            className={`entry-item ${selectedDate === entry.date ? 'selected' : ''}`}
            onClick={() => handleEntryClick(entry)}
          >
            <div className="entry-date">{formatDate(entry.date)}</div>
            <div className="entry-summary">
              <span className="entry-count">{entry.items.length}項目</span>
              {entry.aiComment && (
                <span className="has-comment">コメントあり</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
