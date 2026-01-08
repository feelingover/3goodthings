import { useState, useCallback, useMemo } from 'react';
import { EntryForm } from './components/EntryForm/EntryForm';
import { EntryList } from './components/EntryList/EntryList';
import { ThemeToggle } from './components/ThemeToggle/ThemeToggle';
import { ConfirmDialog } from './components/ConfirmDialog/ConfirmDialog';
import { ExportDialog } from './components/ExportDialog/ExportDialog';
import { StatsView } from './components/StatsView/StatsView';
import { useEntries } from './hooks/useEntries';
import { useEntryView } from './hooks/useEntryView';
import { useEntryEditing } from './hooks/useEntryEditing';
import { useCommentManagement } from './hooks/useCommentManagement';
import { AiCommentItem } from './components/AiComment/AiComment';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import type { DailyEntry } from './types';
import './App.css';

function App() {
  // エクスポートダイアログの状態
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // カスタムフックで状態管理
  const { activeView, selectedEntry, setActiveView, selectEntry } = useEntryView();
  const { editingEntry, deleteConfirmEntry, startEdit, cancelEdit, confirmDelete, cancelDelete }
    = useEntryEditing();

  const { todayEntry, allEntries, isLoading, saveEntry,
          saveItemComment, markItemCommentRequested, getEntryByDate,
          deleteEntry, updateEntry } = useEntries();
  const { isOnline } = useNetworkStatus();

  // コメント管理（refreshTrigger不要！）
  const { handleSaveItemComment, handleItemCommentRequested, handleSaveEntryAndGetComment }
    = useCommentManagement({
        saveItemComment,
        markItemCommentRequested,
        getEntryByDate,
        selectedEntry,
        onSelectedEntryUpdate: selectEntry
      });

  // エントリー保存ハンドラ（useCallback化）
  const handleSaveEntry = useCallback(async (items: string[]) => {
    await saveEntry(items);
    setActiveView('today');
  }, [saveEntry, setActiveView]);

  // エントリー保存とコメント自動取得のラッパー
  const handleSaveAndComment = useCallback(async (items: string[]) => {
    const savedEntry = await saveEntry(items);
    setActiveView('today');
    await handleSaveEntryAndGetComment(savedEntry, items);
  }, [saveEntry, setActiveView, handleSaveEntryAndGetComment]);

  // エントリー選択ハンドラ（useCallback化）
  const handleSelectEntry = useCallback(async (entry: DailyEntry) => {
    const freshEntry = await getEntryByDate(entry.date);
    selectEntry(freshEntry || entry);
  }, [getEntryByDate, selectEntry]);

  // 編集ハンドラ（useCallback化）
  const handleEditEntry = useCallback((entry: DailyEntry) => {
    startEdit(entry);
    setActiveView('today');
  }, [startEdit, setActiveView]);

  // 更新ハンドラ（useCallback化）
  const handleUpdateEntry = useCallback(async (items: string[]) => {
    if (!editingEntry) return;
    await updateEntry(editingEntry.date, items);
    cancelEdit();
  }, [editingEntry, updateEntry, cancelEdit]);

  // 削除確定ハンドラ（useCallback化）
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirmEntry) return;
    await deleteEntry(deleteConfirmEntry.date);
    if (selectedEntry?.date === deleteConfirmEntry.date) {
      selectEntry(null);
    }
    cancelDelete();
  }, [deleteConfirmEntry, deleteEntry, selectedEntry, selectEntry, cancelDelete]);

  // 日付フォーマット関数（useCallback化）
  const formatDate = useCallback((dateStr: string): string => {
    const date = new Date(dateStr);
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    return `${year}年${month}月${day}日 (${weekday})`;
  }, []);

  // 現在表示すべきエントリーを決定（編集モードも考慮）
  const currentEntry = editingEntry || (activeView === 'today' ? todayEntry : selectedEntry);

  // エントリーの項目内容を取得（useMemo化）
  const entryItems = useMemo(() => {
    if (!currentEntry) return ['', '', ''];

    // 既存の項目を取得し、3つに満たない場合は空文字で埋める
    const items = currentEntry.items.map(item => item.content);
    while (items.length < 3) {
      items.push('');
    }
    return items;
  }, [currentEntry]);

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
        <button
          id="stats-tab"
          className={`view-button ${activeView === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveView('stats')}
          role="tab"
          aria-selected={activeView === 'stats'}
          aria-controls="stats-panel"
        >
          統計
        </button>
      </nav>

      {activeView === 'today' && (
        <main id="main-content" className="today-view" role="main">
          <div id="today-panel" role="tabpanel" aria-labelledby="today-tab">
          <EntryForm
            initialItems={entryItems}
            onSave={editingEntry ? handleUpdateEntry : handleSaveEntry}
            onSaveAndGetComment={editingEntry ? undefined : handleSaveAndComment}
            onCancel={editingEntry ? cancelEdit : undefined}
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
                      onCommentSaved={(itemIndex, comment) => handleSaveItemComment(todayEntry, itemIndex, comment)}
                      onCommentRequested={(itemIndex) => handleItemCommentRequested(todayEntry, itemIndex)}
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
              onDeleteEntry={confirmDelete}
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
                        onCommentSaved={(itemIndex, comment) => handleSaveItemComment(selectedEntry, itemIndex, comment)}
                        onCommentRequested={(itemIndex) => handleItemCommentRequested(selectedEntry, itemIndex)}
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

      {activeView === 'stats' && (
        <main
          id="main-content"
          className="stats-view-container"
          role="tabpanel"
          aria-labelledby="stats-tab"
        >
          <StatsView entries={allEntries} isLoading={isLoading} />
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
        onCancel={cancelDelete}
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

export default App
