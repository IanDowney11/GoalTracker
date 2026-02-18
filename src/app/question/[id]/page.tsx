'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DailyEntry } from '@/types';
import { useNostr } from '@/hooks/useNostr';
import { useEntries } from '@/hooks/useEntries';
import { useTempGoals } from '@/hooks/useTempGoals';
import { questions } from '@/lib/questions';
import { isGoodAnswer, isTempGoalGoodAnswer } from '@/lib/scoring';
import QuestionChart from '@/components/QuestionChart';
import StreakBadge from '@/components/StreakBadge';
import NavBar from '@/components/NavBar';

export default function QuestionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const questionId = params.id as string;
  const { isUnlocked, loading: authLoading } = useNostr();
  const { loadAllEntries } = useEntries();
  const { tempGoalDefs, loaded: tempGoalsLoaded } = useTempGoals();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Check if this is a temp goal (prefixed with "temp_")
  const isTempGoal = questionId.startsWith('temp_');
  const tempGoalId = isTempGoal ? questionId.slice(5) : null;
  const tempGoalDef = tempGoalId ? tempGoalDefs.find((d) => d.id === tempGoalId) : null;

  const question = !isTempGoal ? questions.find((q) => q.id === questionId) : null;

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

  if (authLoading || !loaded || !tempGoalsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!isUnlocked) return null;

  if (!question && !tempGoalDef) {
    return (
      <div className="min-h-screen bg-gray-950">
        <NavBar />
        <div className="max-w-md mx-auto p-4">
          <p className="text-red-400">Question not found</p>
        </div>
      </div>
    );
  }

  // Filter entries for temp goals to only those within the goal's active period
  const filteredEntries = isTempGoal && tempGoalDef
    ? entries.filter((e) => {
        if (e.date < tempGoalDef.createdDate) return false;
        if (tempGoalDef.endDate && e.date > tempGoalDef.endDate) return false;
        return true;
      })
    : entries;

  // Calculate streaks
  const sorted = [...filteredEntries].sort((a, b) => b.date.localeCompare(a.date));
  let currentStreak = 0;

  if (isTempGoal && tempGoalId) {
    for (const entry of sorted) {
      if (isTempGoalGoodAnswer(tempGoalId, entry)) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else if (question) {
    const qId = question.id as keyof Omit<DailyEntry, 'date' | 'tempGoals'>;
    for (const entry of sorted) {
      if (isGoodAnswer(qId, entry)) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  const chronological = [...filteredEntries].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  if (isTempGoal && tempGoalId) {
    for (const entry of chronological) {
      if (isTempGoalGoodAnswer(tempGoalId, entry)) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
  } else if (question) {
    const qId = question.id as keyof Omit<DailyEntry, 'date' | 'tempGoals'>;
    for (const entry of chronological) {
      if (isGoodAnswer(qId, entry)) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
  }

  const displayLabel = isTempGoal && tempGoalDef ? tempGoalDef.shortLabel : question!.shortLabel;
  const displayQuestion = isTempGoal && tempGoalDef ? tempGoalDef.label : question!.label;
  const streakLabel = isTempGoal
    ? `days doing ${tempGoalDef?.shortLabel?.toLowerCase() ?? 'goal'}`
    : question!.streakLabel;

  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar />

      <div className="max-w-md mx-auto p-4 space-y-6">
        <button
          onClick={() => router.push('/')}
          className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
        >
          &larr; Back to Calendar
        </button>

        <h1 className="text-xl font-bold text-white">
          {displayLabel}
          {isTempGoal && <span className="text-gray-500 text-sm ml-2">(temp)</span>}
        </h1>
        <p className="text-gray-400 text-sm">{displayQuestion}</p>

        <StreakBadge
          current={currentStreak}
          longest={longestStreak}
          label={streakLabel}
        />

        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            Recent History
          </h3>
          {isTempGoal && tempGoalId ? (
            <QuestionChart
              questionId="exercise"
              entries={filteredEntries}
              tempGoalId={tempGoalId}
            />
          ) : (
            <QuestionChart
              questionId={question!.id as keyof Omit<DailyEntry, 'date' | 'tempGoals'>}
              entries={filteredEntries}
            />
          )}
        </div>
      </div>
    </div>
  );
}
