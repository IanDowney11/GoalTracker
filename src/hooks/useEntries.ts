'use client';

import { useState, useCallback } from 'react';
import { DailyEntry, EncryptedEntry } from '@/types';
import { encryptToSelf, decryptFromSelf } from '@/lib/nostr';
import {
  getEntry,
  putEntry,
  getEntriesInRange,
  getAllEntries,
  setLastSyncTime,
} from '@/lib/db';
import { publishEntry, publishAllEntries, fetchAllEntries } from '@/lib/relay';
import { useNostr } from './useNostr';

export function useEntries() {
  const { privkeyHex, pubkeyHex } = useNostr();
  const [loading, setLoading] = useState(false);

  const saveEntry = useCallback(
    async (entry: DailyEntry) => {
      if (!privkeyHex || !pubkeyHex) {
        throw new Error('Not authenticated');
      }

      const plaintext = JSON.stringify(entry);
      const ciphertext = encryptToSelf(plaintext, privkeyHex, pubkeyHex);

      const encrypted: EncryptedEntry = {
        date: entry.date,
        ciphertext,
      };

      await putEntry(encrypted);

      // Fire-and-forget relay publish
      publishEntry(encrypted, privkeyHex, pubkeyHex).catch((err) =>
        console.error('Relay publish failed:', err)
      );
    },
    [privkeyHex, pubkeyHex]
  );

  const loadEntry = useCallback(
    async (date: string): Promise<DailyEntry | null> => {
      if (!privkeyHex || !pubkeyHex) return null;

      const encrypted = await getEntry(date);
      if (!encrypted) return null;

      try {
        const plaintext = decryptFromSelf(
          encrypted.ciphertext,
          privkeyHex,
          pubkeyHex
        );
        return JSON.parse(plaintext) as DailyEntry;
      } catch {
        console.error('Failed to decrypt entry for', date);
        return null;
      }
    },
    [privkeyHex, pubkeyHex]
  );

  const loadEntriesForMonth = useCallback(
    async (year: number, month: number): Promise<Map<string, DailyEntry>> => {
      if (!privkeyHex || !pubkeyHex) return new Map();

      setLoading(true);
      try {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const encrypted = await getEntriesInRange(startDate, endDate);
        const entries = new Map<string, DailyEntry>();

        for (const enc of encrypted) {
          try {
            const plaintext = decryptFromSelf(
              enc.ciphertext,
              privkeyHex,
              pubkeyHex
            );
            const entry = JSON.parse(plaintext) as DailyEntry;
            entries.set(entry.date, entry);
          } catch {
            console.error('Failed to decrypt entry for', enc.date);
          }
        }

        return entries;
      } finally {
        setLoading(false);
      }
    },
    [privkeyHex, pubkeyHex]
  );

  const loadAllEntries = useCallback(async (): Promise<DailyEntry[]> => {
    if (!privkeyHex || !pubkeyHex) return [];

    setLoading(true);
    try {
      const encrypted = await getAllEntries();
      const entries: DailyEntry[] = [];

      for (const enc of encrypted) {
        try {
          const plaintext = decryptFromSelf(
            enc.ciphertext,
            privkeyHex,
            pubkeyHex
          );
          entries.push(JSON.parse(plaintext) as DailyEntry);
        } catch {
          console.error('Failed to decrypt entry for', enc.date);
        }
      }

      return entries.sort((a, b) => a.date.localeCompare(b.date));
    } finally {
      setLoading(false);
    }
  }, [privkeyHex, pubkeyHex]);

  const backupAll = useCallback(
    async (onProgress?: (done: number, total: number) => void): Promise<number> => {
      if (!privkeyHex || !pubkeyHex) throw new Error('Not authenticated');

      const entries = await getAllEntries();
      const published = await publishAllEntries(entries, privkeyHex, pubkeyHex, onProgress);
      await setLastSyncTime(Date.now());
      return published;
    },
    [privkeyHex, pubkeyHex]
  );

  const restoreFromRelays = useCallback(async (): Promise<number> => {
    if (!pubkeyHex) throw new Error('Not authenticated');

    const remoteEntries = await fetchAllEntries(pubkeyHex);
    let restored = 0;

    for (const entry of remoteEntries) {
      await putEntry(entry);
      restored++;
    }

    await setLastSyncTime(Date.now());
    return restored;
  }, [pubkeyHex]);

  return {
    saveEntry,
    loadEntry,
    loadEntriesForMonth,
    loadAllEntries,
    backupAll,
    restoreFromRelays,
    loading,
  };
}
