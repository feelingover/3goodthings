import type { DailyEntry } from '../types';

/**
 * JSON形式でエクスポート
 */
export function exportToJSON(
  entries: DailyEntry[],
  filename?: string
): void {
  const data = JSON.stringify(entries, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `3goodthings_${getCurrentDateString()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * CSV形式でエクスポート（Excel対応: UTF-8 BOM付き）
 */
export function exportToCSV(
  entries: DailyEntry[],
  filename?: string
): void {
  const headers = ['日付', '項目番号', '内容', 'AIコメント'];

  // エントリーをCSV行に変換
  const rows = entries.flatMap(entry =>
    entry.items.map((item, index) => [
      entry.date,
      (index + 1).toString(),
      escapeCSV(item.content),
      item.aiComment ? escapeCSV(item.aiComment) : ''
    ])
  );

  // CSV文字列を生成
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // UTF-8 BOM付きでBlob作成（Excel対応）
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `3goodthings_${getCurrentDateString()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * CSV用にテキストをエスケープ
 */
function escapeCSV(text: string): string {
  // ダブルクォートを""にエスケープ
  const escaped = text.replace(/"/g, '""');
  // カンマ、改行、ダブルクォートが含まれる場合はダブルクォートで囲む
  if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
    return `"${escaped}"`;
  }
  return escaped;
}

/**
 * 日付範囲でエントリーをフィルタリング
 */
export function filterEntriesByDateRange(
  entries: DailyEntry[],
  startDate?: string,
  endDate?: string
): DailyEntry[] {
  let filtered = [...entries];

  if (startDate) {
    filtered = filtered.filter(entry => entry.date >= startDate);
  }

  if (endDate) {
    filtered = filtered.filter(entry => entry.date <= endDate);
  }

  return filtered;
}

/**
 * 現在の日付を YYYY-MM-DD 形式で取得
 */
function getCurrentDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
