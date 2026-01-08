import type { DailyEntry } from '../types';

/**
 * 連続記録日数（ストリーク）を計算
 * 今日から遡って、記録が途切れるまでの日数をカウント
 *
 * @param entries - 全エントリー（降順ソート済み）
 * @returns 連続日数
 */
export function calculateStreak(entries: DailyEntry[]): number {
  if (entries.length === 0) return 0;

  // 今日の日付（YYYY-MM-DD形式）
  const today = getCurrentDateString();

  // 昨日の日付
  const yesterday = getDateBefore(today, 1);

  // 今日記録があるか確認
  const hasToday = entries.some(e => e.date === today);

  // 今日または昨日に記録がない場合はストリーク0
  if (!hasToday && !entries.some(e => e.date === yesterday)) {
    return 0;
  }

  // 今日から遡って連続日数を計算
  let streak = 0;
  let currentDate = hasToday ? today : yesterday;

  while (true) {
    const hasEntry = entries.some(e => e.date === currentDate);
    if (!hasEntry) break;

    streak++;
    currentDate = getDateBefore(currentDate, 1);
  }

  return streak;
}

/**
 * 総記録数をカウント
 *
 * @param entries - 全エントリー
 * @returns 総記録数
 */
export function countTotalEntries(entries: DailyEntry[]): number {
  return entries.length;
}

/**
 * 今週の記録数をカウント（日曜日始まり）
 *
 * @param entries - 全エントリー
 * @returns 今週の記録数
 */
export function countThisWeekEntries(entries: DailyEntry[]): number {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay()); // 日曜日
  sunday.setHours(0, 0, 0, 0);

  const sundayStr = formatDate(sunday);

  return entries.filter(e => e.date >= sundayStr).length;
}

/**
 * 今月の記録数をカウント
 *
 * @param entries - 全エントリー
 * @returns 今月の記録数
 */
export function countThisMonthEntries(entries: DailyEntry[]): number {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstDayStr = formatDate(firstDay);

  return entries.filter(e => e.date >= firstDayStr).length;
}

/**
 * 総記録項目数をカウント（1日3項目 × 記録日数）
 *
 * @param entries - 全エントリー
 * @returns 総項目数
 */
export function countTotalItems(entries: DailyEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.items.length, 0);
}

// ヘルパー関数

/**
 * 現在の日付をYYYY-MM-DD形式で取得
 */
function getCurrentDateString(): string {
  return formatDate(new Date());
}

/**
 * Date オブジェクトを YYYY-MM-DD 形式に変換
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 指定日付の N 日前の日付を取得
 */
function getDateBefore(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - days);
  return formatDate(date);
}
