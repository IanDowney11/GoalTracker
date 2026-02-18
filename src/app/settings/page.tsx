'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNostr } from '@/hooks/useNostr';
import { useEntries } from '@/hooks/useEntries';
import { useTempGoals } from '@/hooks/useTempGoals';
import { getAllEntries, getLastSyncTime } from '@/lib/db';
import { DEFAULT_RELAYS } from '@/lib/relay';
import NavBar from '@/components/NavBar';
import { APP_VERSION } from '@/lib/version';
import { TempGoalDef } from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  const { isUnlocked, loading: authLoading } = useNostr();
  const { backupAll, restoreFromRelays } = useEntries();
  const { tempGoalDefs, saveTempGoal, removeTempGoal } = useTempGoals();

  const [localCount, setLocalCount] = useState(0);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  // Temp goal form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newShortLabel, setNewShortLabel] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEndDate, setEditEndDate] = useState('');

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

  const handleAddTempGoal = async () => {
    if (!newLabel.trim()) return;
    const id = newLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const todayStr = new Date().toISOString().split('T')[0];
    const def: TempGoalDef = {
      id,
      label: newLabel.trim(),
      shortLabel: newShortLabel.trim() || newLabel.trim(),
      endDate: newEndDate || '',
      createdDate: todayStr,
    };
    await saveTempGoal(def);
    setNewLabel('');
    setNewShortLabel('');
    setNewEndDate('');
    setShowAddForm(false);
  };

  const handleUpdateEndDate = async (goal: TempGoalDef) => {
    await saveTempGoal({ ...goal, endDate: editEndDate });
    setEditingId(null);
    setEditEndDate('');
  };

  const handleDeleteTempGoal = async (id: string) => {
    await removeTempGoal(id);
  };

  const todayStr = new Date().toISOString().split('T')[0];

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

        {/* Temporary Goals Section */}
        <div className="bg-gray-900 rounded-lg p-4 space-y-4">
          <h2 className="text-sm font-medium text-gray-400">Temporary Goals</h2>

          {tempGoalDefs.length === 0 && !showAddForm && (
            <p className="text-gray-500 text-sm">No temporary goals yet.</p>
          )}

          <div className="space-y-3">
            {tempGoalDefs.map((goal) => {
              const isExpired = goal.endDate && goal.endDate < todayStr;
              return (
                <div
                  key={goal.id}
                  className={`p-3 rounded-lg border ${
                    isExpired ? 'border-gray-700 opacity-50' : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm font-medium">
                      {goal.label}
                      {isExpired && <span className="text-gray-500 text-xs ml-2">(expired)</span>}
                    </span>
                    <button
                      onClick={() => handleDeleteTempGoal(goal.id)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Delete
                    </button>
                  </div>

                  {editingId === goal.id ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="date"
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                        className="flex-1 bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-600"
                      />
                      <button
                        onClick={() => handleUpdateEndDate(goal)}
                        className="px-2 py-1 bg-purple-600 text-white text-xs rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">
                        {goal.endDate
                          ? `Ends: ${goal.endDate}`
                          : 'No end date set'}
                      </span>
                      <button
                        onClick={() => {
                          setEditingId(goal.id);
                          setEditEndDate(goal.endDate || '');
                        }}
                        className="text-purple-400 hover:text-purple-300 text-xs"
                      >
                        {goal.endDate ? 'Edit date' : 'Set end date'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {showAddForm ? (
            <div className="space-y-3 border-t border-gray-700 pt-3">
              <input
                type="text"
                placeholder="Goal label (e.g. Physio Exercises)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-600 placeholder-gray-500"
              />
              <input
                type="text"
                placeholder="Short label (e.g. Physio)"
                value={newShortLabel}
                onChange={(e) => setNewShortLabel(e.target.value)}
                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-600 placeholder-gray-500"
              />
              <div>
                <label className="text-gray-400 text-xs block mb-1">End date (optional)</label>
                <input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-600"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddTempGoal}
                  disabled={!newLabel.trim()}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Add Goal
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewLabel('');
                    setNewShortLabel('');
                    setNewEndDate('');
                  }}
                  className="py-2 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              + Add Temporary Goal
            </button>
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
