'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DailyEntry } from '@/types';
import { useNostr } from '@/hooks/useNostr';
import { useEntries } from '@/hooks/useEntries';
import { questions } from '@/lib/questions';
import { isGoodAnswer } from '@/lib/scoring';
import QuestionChart from '@/components/QuestionChart';
import StreakBadge from '@/components/StreakBadge';
import NavBar from '@/components/NavBar';

export default function QuestionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const questionId = params.id as string;
  const { isUnlocked, loading: authLoading } = useNostr();
  const { loadAllEntries } = useEntries();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const question = questions.find((q) => q.id === questionId);

  useEffect(() => {
    if (!authLoading && !isUnlocked) {
      router.push('/login');
    }
  }, [authLoading, isUnlocked, router]);

  useEffect(() => {
    if (isUnlocked) {
      loadAllEntries().then((all) => {
        setEntries(all);
        setLoaded(true);
      });
    }
  }, [isUnlocked, loadAllEntries]);

  if (authLoading || !loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!isUnlocked) return null;

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-950">
        <NavBar />
        <div className="max-w-md mx-auto p-4">
          <p className="text-red-400">Question not found</p>
        </div>
      </div>
    );
  }

  const qId = question.id as keyof Omit<DailyEntry, 'date'>;

  // Calculate streaks
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  let currentStreak = 0;
  for (const entry of sorted) {
    if (isGoodAnswer(qId, entry)) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  const chronological = [...entries].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  for (const entry of chronological) {
    if (isGoodAnswer(qId, entry)) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar />

      <div className="max-w-md mx-auto p-4 space-y-6">
        <button
          onClick={() => router.push('/')}
          className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
        >
          ← Back to Calendar
        </button>

        <h1 className="text-xl font-bold text-white">{question.shortLabel}</h1>
        <p className="text-gray-400 text-sm">{question.label}</p>

        <StreakBadge
          current={currentStreak}
          longest={longestStreak}
          label={question.streakLabel}
        />

        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            Recent History
          </h3>
          <QuestionChart questionId={qId} entries={entries} />
        </div>
      </div>
    </div>
  );
}
