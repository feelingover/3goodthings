import { useState, useMemo } from 'react';
import type { DailyEntry } from '../../types';
import { exportToJSON, exportToCSV, filterEntriesByDateRange } from '../../utils/export';
import './ExportDialog.css';

export interface ExportDialogProps {
  isOpen: boolean;
  entries: DailyEntry[];
  onClose: () => void;
}

type ExportFormat = 'json' | 'csv';

export function ExportDialog({ isOpen, entries, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('json');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // フィルタ後のエントリー数を計算
  const filteredEntries = useMemo(() => {
    return filterEntriesByDateRange(entries, startDate, endDate);
  }, [entries, startDate, endDate]);

  // エクスポート実行
  const handleExport = () => {
    if (filteredEntries.length === 0) {
      alert('エクスポートするデータがありません');
      return;
    }

    if (format === 'json') {
      exportToJSON(filteredEntries);
    } else {
      exportToCSV(filteredEntries);
    }

    onClose();
  };

  // ダイアログが閉じている場合は何も表示しない
  if (!isOpen) {
    return null;
  }

  return (
    <div className="export-dialog-overlay" onClick={onClose}>
      <div className="export-dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="dialog-title">データをエクスポート</h2>

        <div className="export-dialog-content">
          {/* フォーマット選択 */}
          <div className="format-section">
            <label className="section-label">ファイル形式</label>
            <div className="format-selector">
              <button
                className={`format-button ${format === 'json' ? 'active' : ''}`}
                onClick={() => setFormat('json')}
                aria-pressed={format === 'json'}
              >
                JSON
              </button>
              <button
                className={`format-button ${format === 'csv' ? 'active' : ''}`}
                onClick={() => setFormat('csv')}
                aria-pressed={format === 'csv'}
              >
                CSV
              </button>
            </div>
            <p className="format-description">
              {format === 'json'
                ? 'JSON形式は、データの完全なバックアップや他のアプリケーションとの連携に適しています。'
                : 'CSV形式は、Excelやスプレッドシートで開くことができます。'}
            </p>
          </div>

          {/* 日付範囲指定 */}
          <div className="date-range-section">
            <label className="section-label">日付範囲（オプション）</label>
            <div className="date-range">
              <div className="date-input-group">
                <label htmlFor="start-date">開始日</label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <span className="date-separator">〜</span>
              <div className="date-input-group">
                <label htmlFor="end-date">終了日</label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* エントリー数表示 */}
          <div className="export-summary">
            <p className="summary-text">
              エクスポート対象: <strong>{filteredEntries.length}</strong>件のエントリー
            </p>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="dialog-actions">
          <button className="dialog-button dialog-button-cancel" onClick={onClose}>
            キャンセル
          </button>
          <button
            className="dialog-button dialog-button-confirm"
            onClick={handleExport}
            disabled={filteredEntries.length === 0}
          >
            エクスポート
          </button>
        </div>
      </div>
    </div>
  );
}
