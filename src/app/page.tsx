'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNostr } from '@/hooks/useNostr';
import { useEntries } from '@/hooks/useEntries';
import { DailyEntry } from '@/types';
import { getDayScore } from '@/lib/scoring';
import { questions } from '@/lib/questions';
import Calendar from '@/components/Calendar';
import NavBar from '@/components/NavBar';

export default function DashboardPage() {
  const router = useRouter();
  const { isUnlocked, loading: authLoading } = useNostr();
  const { loadAllEntries } = useEntries();
  const [allEntries, setAllEntries] = useState<DailyEntry[]>([]);
  const [statsLoaded, setStatsLoaded] = useState(false);

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
      ? allEntries.reduce((sum, e) => sum + getDayScore(e), 0) / daysLogged
      : 0;

  // Current streak of "good" days (score >= 0.6)
  let currentStreak = 0;
  if (allEntries.length > 0) {
    const sorted = [...allEntries].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
    for (const entry of sorted) {
      if (getDayScore(entry) >= 0.6) {
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

  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar />

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
                {q.shortLabel} →
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
