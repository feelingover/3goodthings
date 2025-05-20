import { useState, useEffect } from 'react';
import { EntryForm } from './components/EntryForm/EntryForm';
import { AiComment } from './components/AiComment/AiComment';
import { EntryList } from './components/EntryList/EntryList';
import { useEntries } from './hooks/useEntries';
import { AiCommentItem } from './components/AiComment/AiComment';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { getAiCommentForItem, checkNetworkConnection } from './services/openai';
import type { DailyEntry } from './types';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState<'today' | 'history'>('today');
  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null);
  // UI更新のためのトリガーを追加
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const { todayEntry, allEntries, isLoading, saveEntry,
          saveItemComment, markItemCommentRequested, getEntryByDate } = useEntries();
  const { isOnline } = useNetworkStatus();

  // todayEntryが変更されたときに再レンダリング
  useEffect(() => {
    console.log("todayEntry updated:", todayEntry);
  }, [todayEntry, refreshTrigger]);

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
  
  // エントリー保存とコメント自動取得ハンドラ
  const handleSaveEntryAndGetComment = async (items: string[]) => {
    try {
      // 1. エントリーを保存
      const savedEntry = await saveEntry(items);
      setActiveView('today'); // 今日のビューに切り替え
      
      // 2. 保存完了後、自動的にAIコメントを取得 (オンライン時のみ)
      if (isOnline) {
        const today = savedEntry.date;
        const filledItems = items.filter(item => item.trim() !== '');
        
        // すべての項目のコメント取得操作をPromise配列にまとめる
        const commentPromises = filledItems.map(async (item, index) => {
          try {
            // 実際にコメントを取得
            const comment = await getAiCommentForItem(item, checkNetworkConnection);
            // コメントを保存
            await saveItemComment(today, index, comment);
            // リクエスト済みフラグも設定
            await markItemCommentRequested(today, index);
            return { success: true, index, comment };
          } catch (error) {
            console.error(`項目${index+1}のコメント取得エラー:`, error);
            return { success: false, index, error };
          }
        });
        
        // すべてのコメント取得が完了するのを待つ
        const results = await Promise.all(commentPromises);
        
        // 結果のログ (デバッグ用)
        const successCount = results.filter(r => r.success).length;
        console.log(`${filledItems.length}項目中${successCount}項目のコメント取得成功`);
        
        // 重要: すべてのコメント取得が完了したら、UIを強制的に更新
        // refreshTriggerをインクリメントしてUIの再レンダリングを強制
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error('エントリー保存またはAIコメント取得エラー:', err);
    }
  };

  
  // 項目ごとのコメント保存ハンドラ (日付指定対応版)
  const handleSaveItemComment = async (itemIndex: number, comment: string) => {
    try {
      if (activeView === 'today' && todayEntry) {
        await saveItemComment(todayEntry.date, itemIndex, comment);
        // 今日のエントリーデータを更新
        setRefreshTrigger(prev => prev + 1);
      } else if (selectedEntry) {
        await saveItemComment(selectedEntry.date, itemIndex, comment);
        // 選択中のエントリーデータを再読み込み (重要：異なる日付間でのコメント混同を防止)
        const updatedEntry = await getEntryByDate(selectedEntry.date);
        if (updatedEntry) {
          setSelectedEntry(updatedEntry);
        }
      }
    } catch (err) {
      console.error('コメント保存エラー:', err);
    }
  };

  // 項目ごとのコメントリクエスト済みマークハンドラ (日付指定対応版)
  const handleItemCommentRequested = async (itemIndex: number) => {
    try {
      if (activeView === 'today' && todayEntry) {
        await markItemCommentRequested(todayEntry.date, itemIndex);
        setRefreshTrigger(prev => prev + 1);
      } else if (selectedEntry) {
        await markItemCommentRequested(selectedEntry.date, itemIndex);
        // 選択中のエントリーデータを再読み込み
        const updatedEntry = await getEntryByDate(selectedEntry.date);
        if (updatedEntry) {
          setSelectedEntry(updatedEntry);
        }
      }
    } catch (err) {
      console.error('コメントリクエスト状態更新エラー:', err);
    }
  };

  // エントリー選択ハンドラ - 選択エントリーの詳細をデバッグ表示
  const handleSelectEntry = async (entry: DailyEntry) => {
    console.log("EntrySelected - Original Entry:", JSON.stringify(entry));
    
    // 選択されたエントリーを最新のデータで再取得（重要）
    const freshEntry = await getEntryByDate(entry.date);
    console.log("EntrySelected - Fresh Entry:", JSON.stringify(freshEntry));
    
    if (freshEntry) {
      setSelectedEntry(freshEntry);
      
      // 各コメントの詳細をログ出力
      freshEntry.items.forEach((item, idx) => {
        console.log(`Item[${idx}] Content: ${item.content}`);
        console.log(`Item[${idx}] Comment: ${item.aiComment || 'なし'}`);
        console.log(`Item[${idx}] hasRequestedComment: ${item.hasRequestedComment}`);
      });
    } else {
      setSelectedEntry(entry);
    }
    
    // 履歴表示時にもUIを更新するためのトリガー
    setRefreshTrigger(prev => prev + 1);
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
            onSaveAndGetComment={handleSaveEntryAndGetComment}
            disabled={isLoading}
          />
          
          {todayEntry && todayEntry.items.length > 0 && (
            <div className="entry-items-with-comments">
              {todayEntry.items.map((item, index) => (
                <div key={index} className="entry-item-with-comment">
                  <div className="entry-item-display">
                    <div className="item-number">{index + 1}.</div>
                    <div className="item-content">{item.content}</div>
                  </div>
                  
                  <div className="item-comment">
                    <AiCommentItem
                      item={item.content}
                      itemIndex={index}
                      initialComment={item.aiComment}
                      hasRequestedComment={item.hasRequestedComment || false}
                      onCommentSaved={handleSaveItemComment}
                      onCommentRequested={handleItemCommentRequested}
                    />
                  </div>
                </div>
              ))}
            </div>
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
              
              <div className="entry-items-with-comments">
                {selectedEntry.items.map((item, index) => (
                  <div key={index} className="entry-item-with-comment">
                    <div className="entry-item-display">
                      <div className="item-number">{index + 1}.</div>
                      <div className="item-content">{item.content}</div>
                    </div>
                    
                    <div className="item-comment">
                      <AiCommentItem
                        key={`${selectedEntry.date}-item-${index}`}
                        item={item.content}
                        itemIndex={index}
                        initialComment={item.aiComment}
                        hasRequestedComment={item.hasRequestedComment || false}
                        onCommentSaved={handleSaveItemComment}
                        onCommentRequested={handleItemCommentRequested}
                      />
                    </div>
                  </div>
                ))}
              </div>
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
