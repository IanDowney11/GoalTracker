/**
 * NOSTR relay publish/fetch for encrypted entry backup.
 * Uses kind 30078 (parameterized replaceable) events
 * with d-tag "goaltracker:<date>" so each date replaces itself on update.
 */
import { SimplePool } from 'nostr-tools/pool';
import { finalizeEvent } from 'nostr-tools/pure';
import { hexToBytes } from 'nostr-tools/utils';
import { EncryptedEntry } from '@/types';

export const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
];

const pool = new SimplePool();

/** Publish a single encrypted entry to relays as a kind 30078 event. */
export async function publishEntry(
  entry: EncryptedEntry,
  privkeyHex: string,
  pubkeyHex: string
): Promise<void> {
  const event = finalizeEvent(
    {
      kind: 30078,
      tags: [['d', `goaltracker:${entry.date}`]],
      content: entry.ciphertext,
      created_at: Math.floor(Date.now() / 1000),
    },
    hexToBytes(privkeyHex)
  );

  await Promise.allSettled(pool.publish(DEFAULT_RELAYS, event));
}

/** Publish multiple entries to relays. Returns count of successfully published. */
export async function publishAllEntries(
  entries: EncryptedEntry[],
  privkeyHex: string,
  pubkeyHex: string,
  onProgress?: (done: number, total: number) => void
): Promise<number> {
  let published = 0;
  for (const entry of entries) {
    try {
      await publishEntry(entry, privkeyHex, pubkeyHex);
      published++;
    } catch (err) {
      console.error(`Failed to publish entry ${entry.date}:`, err);
    }
    onProgress?.(published, entries.length);
  }
  return published;
}

/** Fetch all goaltracker entries from relays for a given pubkey. */
export async function fetchAllEntries(
  pubkeyHex: string
): Promise<EncryptedEntry[]> {
  const events = await pool.querySync(DEFAULT_RELAYS, {
    kinds: [30078],
    authors: [pubkeyHex],
    '#d': ['goaltracker:'],
  });

  // Also try prefix-based fetch — some relays support substring matching,
  // but the NIP-01 filter uses exact match on #d. We need a broader approach:
  // fetch ALL kind 30078 events by this author and filter client-side.
  const allEvents = await pool.querySync(DEFAULT_RELAYS, {
    kinds: [30078],
    authors: [pubkeyHex],
  });

  const entries: EncryptedEntry[] = [];
  const seen = new Set<string>();

  for (const event of allEvents) {
    const dTag = event.tags.find((t) => t[0] === 'd')?.[1];
    if (!dTag || !dTag.startsWith('goaltracker:')) continue;

    const date = dTag.replace('goaltracker:', '');
    if (seen.has(date)) continue;
    seen.add(date);

    entries.push({
      date,
      ciphertext: event.content,
    });
  }

  return entries;
}
