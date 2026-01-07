import { useState, useEffect } from 'react';
import { EntryForm } from './components/EntryForm/EntryForm';
import { EntryList } from './components/EntryList/EntryList';
import { ThemeToggle } from './components/ThemeToggle/ThemeToggle';
import { ConfirmDialog } from './components/ConfirmDialog/ConfirmDialog';
import { ExportDialog } from './components/ExportDialog/ExportDialog';
import { useEntries } from './hooks/useEntries';
import { AiCommentItem } from './components/AiComment/AiComment';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { getAiCommentForItem } from './services/openai';
import type { DailyEntry } from './types';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState<'today' | 'history'>('today');
  const [selectedEntry, setSelectedEntry] = useState<DailyEntry | null>(null);
  // UI更新のためのトリガーを追加
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  // 編集・削除のための状態
  const [editingEntry, setEditingEntry] = useState<DailyEntry | null>(null);
  const [deleteConfirmEntry, setDeleteConfirmEntry] = useState<DailyEntry | null>(null);
  // エクスポートダイアログの状態
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const { todayEntry, allEntries, isLoading, saveEntry,
          saveItemComment, markItemCommentRequested, getEntryByDate,
          deleteEntry, updateEntry } = useEntries();
  const { isOnline } = useNetworkStatus();

  // todayEntryが変更されたときに再レンダリング
  useEffect(() => {
    // UI更新トリガー
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
        
        // 各項目のコメントを順次取得（レート制限対策）
        for (let index = 0; index < filledItems.length; index++) {
          const item = filledItems[index];
          try {
            // 実際にコメントを取得
            const comment = await getAiCommentForItem(item, () => isOnline);
            // コメントを保存
            await saveItemComment(today, index, comment);
            // リクエスト済みフラグも設定
            await markItemCommentRequested(today, index);
          } catch (error) {
            console.error(`Item ${index} comment fetch failed:`, error);
          }
        }

        // 重要: すべてのコメント取得が完了したら、UIを強制的に更新
        // refreshTriggerをインクリメントしてUIの再レンダリングを強制
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      // エラーは握りつぶさずに通知する可能性あり
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
      // エラーハンドリング
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
      // エラーハンドリング
    }
  };

  // エントリー選択ハンドラ
  const handleSelectEntry = async (entry: DailyEntry) => {
    // 選択されたエントリーを最新のデータで再取得（重要）
    const freshEntry = await getEntryByDate(entry.date);

    if (freshEntry) {
      setSelectedEntry(freshEntry);
    } else {
      setSelectedEntry(entry);
    }

    // 履歴表示時にもUIを更新するためのトリガー
    setRefreshTrigger(prev => prev + 1);
  };

  // 編集ハンドラ
  const handleEditEntry = (entry: DailyEntry) => {
    setEditingEntry(entry);
    setActiveView('today');
  };

  // 更新ハンドラ
  const handleUpdateEntry = async (items: string[]) => {
    if (!editingEntry) return;
    await updateEntry(editingEntry.date, items);
    setEditingEntry(null);
    setRefreshTrigger(prev => prev + 1);
  };

  // 編集キャンセルハンドラ
  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  // 削除ハンドラ
  const handleDeleteEntry = (entry: DailyEntry) => {
    setDeleteConfirmEntry(entry);
  };

  // 削除確定ハンドラ
  const handleConfirmDelete = async () => {
    if (!deleteConfirmEntry) return;
    await deleteEntry(deleteConfirmEntry.date);
    setDeleteConfirmEntry(null);
    if (selectedEntry?.date === deleteConfirmEntry.date) {
      setSelectedEntry(null);
    }
    setRefreshTrigger(prev => prev + 1);
  };

  // 現在表示すべきエントリーを決定（編集モードも考慮）
  const currentEntry = editingEntry || (activeView === 'today' ? todayEntry : selectedEntry);

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
      <a href="#main-content" className="skip-to-content">
        メインコンテンツへスキップ
      </a>
      <header className="app-header" role="banner">
        <h1>3 Good Things</h1>
        <div className="header-actions" role="navigation" aria-label="ヘッダーアクション">
          <button
            className="export-button"
            onClick={() => setIsExportDialogOpen(true)}
            aria-label="データをエクスポート"
            title="データをエクスポート"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
          <ThemeToggle />
          <div className="network-status">
            {isOnline ? (
              <span className="status-online">オンライン</span>
            ) : (
              <span className="status-offline">オフライン</span>
            )}
          </div>
        </div>
      </header>

      <nav className="view-selector" role="tablist" aria-label="ビュー切り替え">
        <button
          id="today-tab"
          className={`view-button ${activeView === 'today' ? 'active' : ''}`}
          onClick={() => setActiveView('today')}
          role="tab"
          aria-selected={activeView === 'today'}
          aria-controls="today-panel"
        >
          今日の記録
        </button>
        <button
          id="history-tab"
          className={`view-button ${activeView === 'history' ? 'active' : ''}`}
          onClick={() => setActiveView('history')}
          role="tab"
          aria-selected={activeView === 'history'}
          aria-controls="history-panel"
        >
          履歴
        </button>
      </nav>

      {activeView === 'today' && (
        <main id="main-content" className="today-view" role="main">
          <div id="today-panel" role="tabpanel" aria-labelledby="today-tab">
          <EntryForm
            initialItems={getEntryItems()}
            onSave={editingEntry ? handleUpdateEntry : handleSaveEntry}
            onSaveAndGetComment={editingEntry ? undefined : handleSaveEntryAndGetComment}
            onCancel={editingEntry ? handleCancelEdit : undefined}
            isEditMode={!!editingEntry}
            disabled={isLoading}
          />


          {!editingEntry && todayEntry && todayEntry.items.length > 0 && (
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
        </main>
      )}

      {activeView === 'history' && (
        <main id="main-content" className="history-view" role="main">
          <div id="history-panel" role="tabpanel" aria-labelledby="history-tab">
          <div className="entries-container">
            <EntryList
              entries={allEntries}
              onSelectEntry={handleSelectEntry}
              onEditEntry={handleEditEntry}
              onDeleteEntry={handleDeleteEntry}
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
        </main>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirmEntry}
        title="エントリーを削除"
        message={deleteConfirmEntry
          ? `${formatDate(deleteConfirmEntry.date)}のエントリーを削除しますか？この操作は取り消せません。`
          : ''
        }
        confirmText="削除"
        cancelText="キャンセル"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmEntry(null)}
        variant="danger"
      />

      <ExportDialog
        isOpen={isExportDialogOpen}
        entries={allEntries}
        onClose={() => setIsExportDialogOpen(false)}
      />
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
