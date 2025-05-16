import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { DailyEntry, EntryItem } from '../types';
import { config } from '../config';

// Dexie.jsを使ったデータベースクラス
export class AppDatabase extends Dexie {
  // テーブル定義
  dailyEntries!: Table<DailyEntry, number>;
  entryItems!: Table<EntryItem, number>;

  constructor() {
    super(config.db.name);
    
    // スキーマの定義
    this.version(config.db.version).stores({
      dailyEntries: '++id, date',
      entryItems: '++id, &[date+index]',
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
        items: entry.items,
        aiComment: entry.aiComment,
        hasRequestedComment: entry.hasRequestedComment
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
}

// データベースのシングルトンインスタンス
export const db = new AppDatabase();
