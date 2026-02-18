'use client';

import { useState } from 'react';
import { DailyEntry, AlcoholLevel, TempGoalDef } from '@/types';
import { questions } from '@/lib/questions';
import { getDayScore, scoreToColor, getActiveTempGoals } from '@/lib/scoring';

interface SurveyFormProps {
  date: string;
  initialEntry?: DailyEntry | null;
  tempGoalDefs: TempGoalDef[];
  onSave: (entry: DailyEntry) => Promise<void>;
}

const alcoholLevels: { value: AlcoholLevel; label: string; color: string }[] = [
  { value: 'none', label: 'None', color: 'bg-green-600' },
  { value: 'low', label: 'Low', color: 'bg-yellow-600' },
  { value: 'medium', label: 'Medium', color: 'bg-orange-600' },
  { value: 'high', label: 'High', color: 'bg-red-600' },
];

export default function SurveyForm({ date, initialEntry, tempGoalDefs, onSave }: SurveyFormProps) {
  const [entry, setEntry] = useState<DailyEntry>(
    initialEntry ?? {
      date,
      alcohol: 'none',
      followMealPlan: false,
      eatSugar: false,
      tenThousandSteps: false,
      exercise: false,
    }
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const activeTempGoals = getActiveTempGoals(tempGoalDefs, date);
  const score = getDayScore(entry, tempGoalDefs);
  const color = scoreToColor(score);

  function setAlcohol(level: AlcoholLevel) {
    setEntry((prev) => ({ ...prev, alcohol: level }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(entry);
      setSaved(true);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">{formatDate(date)}</h2>

      {/* Score preview */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg"
          style={{ backgroundColor: color }}
        />
        <span className="text-gray-300 text-sm">
          Score: {Math.round(score * 100)}%
        </span>
      </div>

      {/* Core Questions */}
      <div className="space-y-5">
        {questions.map((q) => {
          if (q.type === 'alcohol') {
            return (
              <div key={q.id}>
                <p className="text-gray-200 mb-2">{q.label}</p>
                <div className="grid grid-cols-4 gap-2">
                  {alcoholLevels.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setAlcohol(level.value)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        entry.alcohol === level.value
                          ? `${level.color} text-white ring-2 ring-white/30`
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          }

          // Boolean question (with optional N/A)
          const field = q.id as keyof Omit<DailyEntry, 'date' | 'alcohol' | 'tempGoals'>;
          const value = entry[field];
          const yesIsGood = q.goodAnswer === true;

          return (
            <div key={q.id}>
              <p className="text-gray-200 mb-2">{q.label}</p>
              <div className={`grid gap-2 ${q.allowNA ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <button
                  onClick={() => {
                    setEntry((prev) => ({ ...prev, [field]: true }));
                    setSaved(false);
                  }}
                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    value === true
                      ? yesIsGood
                        ? 'bg-green-600 text-white ring-2 ring-white/30'
                        : 'bg-red-600 text-white ring-2 ring-white/30'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => {
                    setEntry((prev) => ({ ...prev, [field]: false }));
                    setSaved(false);
                  }}
                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    value === false
                      ? !yesIsGood
                        ? 'bg-green-600 text-white ring-2 ring-white/30'
                        : 'bg-red-600 text-white ring-2 ring-white/30'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  No
                </button>
                {q.allowNA && (
                  <button
                    onClick={() => {
                      setEntry((prev) => ({ ...prev, [field]: null }));
                      setSaved(false);
                    }}
                    className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      value === null
                        ? 'bg-gray-500 text-white ring-2 ring-white/30'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    N/A
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Temporary Goals */}
      {activeTempGoals.length > 0 && (
        <div className="space-y-5">
          <h3 className="text-sm font-medium text-gray-400 border-t border-gray-800 pt-4">
            Temporary Goals
          </h3>
          {activeTempGoals.map((goal) => {
            const val = entry.tempGoals?.[goal.id] ?? null;
            return (
              <div key={goal.id}>
                <p className="text-gray-200 mb-2">{goal.label}</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setEntry((prev) => ({
                        ...prev,
                        tempGoals: { ...prev.tempGoals, [goal.id]: true },
                      }));
                      setSaved(false);
                    }}
                    className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      val === true
                        ? 'bg-green-600 text-white ring-2 ring-white/30'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => {
                      setEntry((prev) => ({
                        ...prev,
                        tempGoals: { ...prev.tempGoals, [goal.id]: false },
                      }));
                      setSaved(false);
                    }}
                    className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      val === false
                        ? 'bg-red-600 text-white ring-2 ring-white/30'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    No
                  </button>
                  <button
                    onClick={() => {
                      setEntry((prev) => ({
                        ...prev,
                        tempGoals: { ...prev.tempGoals, [goal.id]: null },
                      }));
                      setSaved(false);
                    }}
                    className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      val === null
                        ? 'bg-gray-500 text-white ring-2 ring-white/30'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    N/A
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-3 rounded-lg font-medium text-white transition-all ${
          saved
            ? 'bg-green-700'
            : 'bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700'
        }`}
      >
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Entry'}
      </button>
    </div>
  );
}
