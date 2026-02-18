'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNostr } from '@/hooks/useNostr';
import { useEntries } from '@/hooks/useEntries';
import { useTempGoals } from '@/hooks/useTempGoals';
import { DailyEntry } from '@/types';
import { getDayScore } from '@/lib/scoring';
import { questions } from '@/lib/questions';
import { getLastSyncTime } from '@/lib/db';
import Calendar from '@/components/Calendar';
import NavBar from '@/components/NavBar';

export default function DashboardPage() {
  const router = useRouter();
  const { isUnlocked, loading: authLoading } = useNostr();
  const { loadAllEntries, backupAll } = useEntries();
  const { tempGoalDefs, loaded: tempGoalsLoaded } = useTempGoals();
  const [allEntries, setAllEntries] = useState<DailyEntry[]>([]);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [showBackupReminder, setShowBackupReminder] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  useEffect(() => {
    if (!authLoading && !isUnlocked) {
      router.push('/login');
    }
  }, [authLoading, isUnlocked, router]);

  useEffect(() => {
    if (isUnlocked) {
      loadAllEntries().then((entries) => {
        setAllEntries(entries);
        setStatsLoaded(true);
      });
    }
  }, [isUnlocked, loadAllEntries]);

  useEffect(() => {
    if (isUnlocked) {
      const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
      getLastSyncTime().then((lastSync) => {
        if (lastSync === null || Date.now() - lastSync > THREE_DAYS_MS) {
          setShowBackupReminder(true);
        }
      });
    }
  }, [isUnlocked]);

  const handleBackupNow = async () => {
    setBackingUp(true);
    try {
      await backupAll();
      setShowBackupReminder(false);
    } catch (err) {
      console.error('Backup failed:', err);
    } finally {
      setBackingUp(false);
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

  // Stats
  const daysLogged = allEntries.length;
  const avgScore =
    daysLogged > 0
      ? allEntries.reduce((sum, e) => sum + getDayScore(e, tempGoalDefs), 0) / daysLogged
      : 0;

  // Current streak of "good" days (score >= 0.6)
  let currentStreak = 0;
  if (allEntries.length > 0) {
    const sorted = [...allEntries].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
    for (const entry of sorted) {
      if (getDayScore(entry, tempGoalDefs) >= 0.6) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  })();

  const hasToday = allEntries.some((e) => e.date === todayStr);

  // Active temp goals (for today)
  const activeTempGoals = tempGoalsLoaded
    ? tempGoalDefs.filter((def) => {
        if (todayStr < def.createdDate) return false;
        if (def.endDate && todayStr > def.endDate) return false;
        return true;
      })
    : [];

  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar />

      {showBackupReminder && (
        <div className="max-w-md mx-auto px-4 pt-4">
          <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3 flex items-center justify-between gap-3">
            <p className="text-yellow-200 text-sm">
              You haven&apos;t backed up in a while.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleBackupNow}
                disabled={backingUp}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 text-white text-xs font-medium rounded transition-colors"
              >
                {backingUp ? 'Backing up...' : 'Backup Now'}
              </button>
              <button
                onClick={() => setShowBackupReminder(false)}
                className="text-yellow-500 hover:text-yellow-300 text-lg leading-none"
                aria-label="Dismiss"
              >
                &times;
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Quick log today button */}
        {!hasToday && (
          <button
            onClick={() => router.push(`/entry/${todayStr}`)}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Log Today
          </button>
        )}

        {/* Calendar */}
        <Calendar />

        {/* Stats */}
        {statsLoaded && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">{daysLogged}</p>
              <p className="text-xs text-gray-400">Days Logged</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">
                {Math.round(avgScore * 100)}%
              </p>
              <p className="text-xs text-gray-400">Avg Score</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">{currentStreak}</p>
              <p className="text-xs text-gray-400">Day Streak</p>
            </div>
          </div>
        )}

        {/* Per-question links */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            Question Details
          </h3>
          <div className="space-y-2">
            {questions.map((q) => (
              <Link
                key={q.id}
                href={`/question/${q.id}`}
                className="block bg-gray-900 hover:bg-gray-800 rounded-lg p-3 text-white text-sm transition-colors"
              >
                {q.shortLabel} &rarr;
              </Link>
            ))}
            {activeTempGoals.map((goal) => (
              <Link
                key={goal.id}
                href={`/question/temp_${goal.id}`}
                className="block bg-gray-900 hover:bg-gray-800 rounded-lg p-3 text-white text-sm transition-colors"
              >
                {goal.shortLabel} <span className="text-gray-500 text-xs">(temp)</span> &rarr;
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
