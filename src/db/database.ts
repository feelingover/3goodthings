import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { DailyEntry, EntryItem } from '../types';
import { config } from '../config';

// テーマ設定の型定義
export type Theme = 'light' | 'dark' | 'system';

// 設定データの型定義
export interface AppSettings {
  id?: number;
  key: string;
  value: string;
}

// Dexie.jsを使ったデータベースクラス
export class AppDatabase extends Dexie {
  // テーブル定義
  dailyEntries!: Table<DailyEntry, number>;
  entryItems!: Table<EntryItem, number>;
  settings!: Table<AppSettings, number>;

  constructor() {
    super(config.db.name);

    // スキーマの定義（バージョン1: 既存テーブル）
    this.version(1).stores({
      dailyEntries: '++id, date',
      entryItems: '++id, &[date+index]',
    });

    // バージョン2: settingsテーブル追加
    this.version(2).stores({
      dailyEntries: '++id, date',
      entryItems: '++id, &[date+index]',
      settings: '++id, &key', // keyでユニーク制約
    });
  }
  
  // 日付で日毎のエントリーを取得
  async getDailyEntryByDate(date: string): Promise<DailyEntry | undefined> {
    return await this.dailyEntries.where('date').equals(date).first();
  }
  
  // 日毎のエントリーを保存・更新
  async saveDailyEntry(entry: DailyEntry): Promise<number> {
    if (entry.id) {
      await this.dailyEntries.update(entry.id, {
        date: entry.date,
        items: entry.items
      });
      return entry.id;
    } else {
      return await this.dailyEntries.add(entry);
    }
  }
  
  // すべてのエントリーを日付の降順で取得
  async getAllDailyEntries(): Promise<DailyEntry[]> {
    return await this.dailyEntries.orderBy('date').reverse().toArray();
  }

  // テーマ設定を取得
  async getThemeSetting(): Promise<Theme | null> {
    const setting = await this.settings.where('key').equals('theme').first();
    return setting ? (setting.value as Theme) : null;
  }

  // テーマ設定を保存
  async saveThemeSetting(theme: Theme): Promise<void> {
    const existing = await this.settings.where('key').equals('theme').first();
    if (existing) {
      await this.settings.update(existing.id!, { value: theme });
    } else {
      await this.settings.add({ key: 'theme', value: theme });
    }
  }

  // エントリーを削除（物理削除）
  async deleteDailyEntry(date: string): Promise<void> {
    const entry = await this.getDailyEntryByDate(date);
    if (entry && entry.id) {
      await this.dailyEntries.delete(entry.id);
    }
  }

  // エントリーを更新
  async updateDailyEntry(date: string, items: EntryItem[]): Promise<void> {
    const entry = await this.getDailyEntryByDate(date);
    if (entry) {
      entry.items = items;
      await this.saveDailyEntry(entry);
    }
  }
}

// データベースのシングルトンインスタンス
export const db = new AppDatabase();
