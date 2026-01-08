import React, { useMemo } from 'react';
import type { DailyEntry } from '../../types';
import {
  calculateStreak,
  countTotalEntries,
  countThisWeekEntries,
  countThisMonthEntries,
  countTotalItems
} from '../../utils/statsCalculator';
import './StatsView.css';

interface StatsViewProps {
  entries: DailyEntry[];
  isLoading: boolean;
}

export const StatsView: React.FC<StatsViewProps> = ({ entries, isLoading }) => {
  // 統計データをメモ化（エントリーが変わらない限り再計算しない）
  const stats = useMemo(() => {
    return {
      streak: calculateStreak(entries),
      totalEntries: countTotalEntries(entries),
      thisWeekEntries: countThisWeekEntries(entries),
      thisMonthEntries: countThisMonthEntries(entries),
      totalItems: countTotalItems(entries)
    };
  }, [entries]);

  if (isLoading) {
    return (
      <div className="stats-view loading" role="status" aria-live="polite">
        <p>統計を読み込んでいます...</p>
      </div>
    );
  }

  return (
    <div className="stats-view" role="region" aria-label="統計情報">
      <h2 className="stats-title">あなたの記録統計</h2>

      {/* メイン統計カード: ストリーク */}
      <div className="stat-card primary-card" role="article" aria-labelledby="streak-title">
        <div className="stat-icon">🔥</div>
        <div className="stat-content">
          <h3 id="streak-title" className="stat-label">連続記録日数</h3>
          <p className="stat-value large">{stats.streak}<span className="stat-unit">日</span></p>
          <p className="stat-description">
            {stats.streak === 0
              ? '今日から記録を始めましょう！'
              : `素晴らしい！${stats.streak}日連続で記録を続けています`}
          </p>
        </div>
      </div>

      {/* サブ統計カード群 */}
      <div className="stats-grid">
        {/* 総記録数 */}
        <div className="stat-card" role="article" aria-labelledby="total-entries-title">
          <div className="stat-icon small">📅</div>
          <div className="stat-content">
            <h3 id="total-entries-title" className="stat-label">総記録日数</h3>
            <p className="stat-value">{stats.totalEntries}<span className="stat-unit">日</span></p>
          </div>
        </div>

        {/* 総項目数 */}
        <div className="stat-card" role="article" aria-labelledby="total-items-title">
          <div className="stat-icon small">✨</div>
          <div className="stat-content">
            <h3 id="total-items-title" className="stat-label">記録した良いこと</h3>
            <p className="stat-value">{stats.totalItems}<span className="stat-unit">個</span></p>
          </div>
        </div>

        {/* 今週の記録数 */}
        <div className="stat-card" role="article" aria-labelledby="week-entries-title">
          <div className="stat-icon small">📊</div>
          <div className="stat-content">
            <h3 id="week-entries-title" className="stat-label">今週の記録</h3>
            <p className="stat-value">{stats.thisWeekEntries}<span className="stat-unit">日</span></p>
          </div>
        </div>

        {/* 今月の記録数 */}
        <div className="stat-card" role="article" aria-labelledby="month-entries-title">
          <div className="stat-icon small">📆</div>
          <div className="stat-content">
            <h3 id="month-entries-title" className="stat-label">今月の記録</h3>
            <p className="stat-value">{stats.thisMonthEntries}<span className="stat-unit">日</span></p>
          </div>
        </div>
      </div>

      {/* エンプティステート（記録がない場合） */}
      {stats.totalEntries === 0 && (
        <div className="empty-state">
          <p className="empty-message">まだ記録がありません</p>
          <p className="empty-description">
            「今日の記録」タブから、今日の良いことを3つ記録してみましょう！
          </p>
        </div>
      )}
    </div>
  );
};
