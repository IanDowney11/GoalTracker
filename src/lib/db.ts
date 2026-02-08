import Dexie, { type Table } from 'dexie';
import { EncryptedEntry, StoredKey } from '@/types';

export interface SyncMeta {
  id: string; // always "sync"
  lastSyncTime: number; // unix timestamp ms
}

class GoalTrackerDB extends Dexie {
  entries!: Table<EncryptedEntry, string>;
  keys!: Table<StoredKey, string>;
  meta!: Table<SyncMeta, string>;

  constructor() {
    super('GoalTrackerDB');
    this.version(1).stores({
      entries: 'date', // primary key is date
      keys: 'id',      // primary key is id (always "primary")
    });
    this.version(2).stores({
      entries: 'date',
      keys: 'id',
      meta: 'id',
    });
  }
}

export const db = new GoalTrackerDB();

// Key storage operations
export async function getStoredKey(): Promise<StoredKey | undefined> {
  return db.keys.get('primary');
}

export async function storeKey(key: StoredKey): Promise<void> {
  await db.keys.put(key);
}

export async function clearStoredKey(): Promise<void> {
  await db.keys.delete('primary');
  await db.entries.clear();
}

// Entry operations
export async function getEntry(date: string): Promise<EncryptedEntry | undefined> {
  return db.entries.get(date);
}

export async function putEntry(entry: EncryptedEntry): Promise<void> {
  await db.entries.put(entry);
}

export async function getEntriesInRange(
  startDate: string,
  endDate: string
): Promise<EncryptedEntry[]> {
  return db.entries
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray();
}

export async function getAllEntries(): Promise<EncryptedEntry[]> {
  return db.entries.toArray();
}

// Sync metadata operations
export async function getLastSyncTime(): Promise<number | null> {
  const meta = await db.meta.get('sync');
  return meta?.lastSyncTime ?? null;
}

export async function setLastSyncTime(time: number): Promise<void> {
  await db.meta.put({ id: 'sync', lastSyncTime: time });
}
