import { useState, useEffect } from 'react';
import { EntryForm } from './components/EntryForm/EntryForm';
import { AiComment } from './components/AiComment/AiComment';
import { EntryList } from './components/EntryList/EntryList';
import { useEntries } from './hooks/useEntries';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import type { DailyEntry } from './types';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState<'today' | 'history'>('today');
  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null);
  const { todayEntry, allEntries, isLoading, saveEntry, saveAiComment, markCommentRequested } = useEntries();
  const { isOnline } = useNetworkStatus();

  // 選択されたエントリーのリセット
  useEffect(() => {
    if (activeView === 'today') {
      setSelectedEntry(null);
    }
  }, [activeView]);

  // エントリー保存ハンドラ
  const handleSaveEntry = async (items: string[]) => {
    await saveEntry(items);
    setActiveView('today'); // 保存後は今日のビューに切り替え
  };

  // コメント保存ハンドラ
  const handleSaveComment = async (comment: string) => {
    if (activeView === 'today' && todayEntry) {
      await saveAiComment(todayEntry.date, comment);
    } else if (selectedEntry) {
      await saveAiComment(selectedEntry.date, comment);
    }
  };

  // コメントリクエスト済みマークハンドラ
  const handleCommentRequested = async () => {
    if (activeView === 'today' && todayEntry) {
      await markCommentRequested(todayEntry.date);
    } else if (selectedEntry) {
      await markCommentRequested(selectedEntry.date);
    }
  };

  // エントリー選択ハンドラ
  const handleSelectEntry = (entry: DailyEntry) => {
    setSelectedEntry(entry);
  };

  // 現在表示すべきエントリーを決定
  const currentEntry = activeView === 'today' ? todayEntry : selectedEntry;
  
  // エントリーの項目内容を取得
  const getEntryItems = (): string[] => {
    if (!currentEntry) return ['', '', ''];
    
    // 既存の項目を取得し、3つに満たない場合は空文字で埋める
    const items = currentEntry.items.map(item => item.content);
    while (items.length < 3) {
      items.push('');
    }
    return items;
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>3 Good Things</h1>
        <div className="network-status">
          {isOnline ? (
            <span className="status-online">オンライン</span>
          ) : (
            <span className="status-offline">オフライン</span>
          )}
        </div>
      </header>

      <div className="view-selector">
        <button
          className={`view-button ${activeView === 'today' ? 'active' : ''}`}
          onClick={() => setActiveView('today')}
        >
          今日の記録
        </button>
        <button
          className={`view-button ${activeView === 'history' ? 'active' : ''}`}
          onClick={() => setActiveView('history')}
        >
          履歴
        </button>
      </div>

      {activeView === 'today' && (
        <div className="today-view">
          <EntryForm
            initialItems={getEntryItems()}
            onSave={handleSaveEntry}
            disabled={isLoading}
          />
          
          {todayEntry && todayEntry.items.length > 0 && (
            <AiComment
              items={todayEntry.items.map(item => item.content)}
              initialComment={todayEntry.aiComment}
              hasRequestedComment={todayEntry.hasRequestedComment}
              onCommentSaved={handleSaveComment}
              onCommentRequested={handleCommentRequested}
            />
          )}
        </div>
      )}

      {activeView === 'history' && (
        <div className="history-view">
          <div className="entries-container">
            <EntryList
              entries={allEntries}
              onSelectEntry={handleSelectEntry}
              isLoading={isLoading}
            />
          </div>

          {selectedEntry && (
            <div className="selected-entry">
              <h2>{formatDate(selectedEntry.date)}の記録</h2>
              
              <div className="entry-items-display">
                {selectedEntry.items.map((item, index) => (
                  <div key={index} className="entry-item-display">
                    <div className="item-number">{index + 1}.</div>
                    <div className="item-content">{item.content}</div>
                  </div>
                ))}
              </div>
              
              <AiComment
                items={selectedEntry.items.map(item => item.content)}
                initialComment={selectedEntry.aiComment}
                hasRequestedComment={selectedEntry.hasRequestedComment}
                onCommentSaved={handleSaveComment}
                onCommentRequested={handleCommentRequested}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 日付を日本語のフォーマットに変換する関数
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = weekdays[date.getDay()];
  
  return `${year}年${month}月${day}日 (${weekday})`;
}

export default App
