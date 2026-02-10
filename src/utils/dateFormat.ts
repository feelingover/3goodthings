/**
 * 日付操作ユーティリティ
 * ローカルタイムゾーンを基準に処理を行うことで、タイムゾーンによる日付のズレを防ぐ
 */

/**
 * Date オブジェクトを YYYY-MM-DD 形式に変換（ローカルタイムゾーン基準）
 * @param date - Dateオブジェクト
 * @returns YYYY-MM-DD形式の文字列
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 現在の日付を YYYY-MM-DD 形式で取得（ローカルタイムゾーン基準）
 * @returns YYYY-MM-DD形式の文字列
 */
export function getTodayDateString(): string {
  return formatDate(new Date());
}

/**
 * YYYY-MM-DD 形式の日付文字列を「M月D日 (曜日)」形式に変換
 * @param dateStr - YYYY-MM-DD形式の文字列
 * @returns 日本語の日付文字列
 */
export function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = weekdays[date.getDay()];
  
  return `${month}月${day}日 (${weekday})`;
}

/**
 * YYYY-MM-DD 形式の日付文字列を「YYYY年M月D日 (曜日)」形式に変換
 * @param dateStr - YYYY-MM-DD形式の文字列
 * @returns 日本語の日付文字列（年付き）
 */
export function formatFullDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = weekdays[date.getDay()];
  return `${year}年${month}月${day}日 (${weekday})`;
}

/**
 * 指定日付の N 日前の日付を YYYY-MM-DD 形式で取得
 * @param dateStr - 基準日（YYYY-MM-DD）
 * @param days - 遡る日数
 * @returns YYYY-MM-DD形式の文字列
 */
export function getDateBefore(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - days);
  return formatDate(date);
}
