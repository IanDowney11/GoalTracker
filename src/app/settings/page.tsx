'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNostr } from '@/hooks/useNostr';
import { useEntries } from '@/hooks/useEntries';
import { getAllEntries, getLastSyncTime } from '@/lib/db';
import { DEFAULT_RELAYS } from '@/lib/relay';
import NavBar from '@/components/NavBar';
import { APP_VERSION } from '@/lib/version';

export default function SettingsPage() {
  const router = useRouter();
  const { isUnlocked, loading: authLoading } = useNostr();
  const { backupAll, restoreFromRelays } = useEntries();

  const [localCount, setLocalCount] = useState(0);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isUnlocked) {
      router.push('/login');
    }
  }, [authLoading, isUnlocked, router]);

  useEffect(() => {
    if (isUnlocked) {
      getAllEntries().then((e) => setLocalCount(e.length));
      getLastSyncTime().then((t) => setLastSync(t));
    }
  }, [isUnlocked]);

  const handleBackup = async () => {
    setBusy(true);
    setStatus(null);
    setProgress(null);
    try {
      const count = await backupAll((done, total) => {
        setProgress(`${done} / ${total}`);
      });
      setStatus(`Backed up ${count} entries to relays.`);
      setLastSync(Date.now());
    } catch (err) {
      setStatus(`Backup failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const handleRestore = async () => {
    setBusy(true);
    setStatus(null);
    setProgress(null);
    try {
      const count = await restoreFromRelays();
      setStatus(`Restored ${count} entries from relays.`);
      setLastSync(Date.now());
      const entries = await getAllEntries();
      setLocalCount(entries.length);
    } catch (err) {
      setStatus(`Restore failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setBusy(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!isUnlocked) return null;

  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar />

      <div className="max-w-md mx-auto p-4 space-y-6">
        <h1 className="text-xl font-bold text-white">Settings</h1>

        {/* Sync Section */}
        <div className="bg-gray-900 rounded-lg p-4 space-y-4">
          <h2 className="text-sm font-medium text-gray-400">Relay Backup & Sync</h2>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{localCount}</p>
              <p className="text-xs text-gray-400">Local Entries</p>
            </div>
            <div>
              <p className="text-sm font-mono text-white">
                {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
              </p>
              <p className="text-xs text-gray-400">Last Sync</p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleBackup}
              disabled={busy}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {busy && progress ? `Backing up... ${progress}` : 'Backup All to Relays'}
            </button>

            <button
              onClick={handleRestore}
              disabled={busy}
              className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {busy && !progress ? 'Restoring...' : 'Restore from Relays'}
            </button>
          </div>

          {status && (
            <p className={`text-sm ${status.includes('failed') ? 'text-red-400' : 'text-green-400'}`}>
              {status}
            </p>
          )}
        </div>

        {/* Relay Info */}
        <div className="bg-gray-900 rounded-lg p-4 space-y-2">
          <h2 className="text-sm font-medium text-gray-400">Connected Relays</h2>
          {DEFAULT_RELAYS.map((relay) => (
            <p key={relay} className="text-xs font-mono text-gray-300">{relay}</p>
          ))}
        </div>

        <p className="text-gray-600 text-xs text-center">v{APP_VERSION}</p>
      </div>
    </div>
  );
}
