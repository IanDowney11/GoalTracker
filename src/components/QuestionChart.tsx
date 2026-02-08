'use client';

import { DailyEntry } from '@/types';
import { getQuestionScore, scoreToColor } from '@/lib/scoring';

interface QuestionChartProps {
  questionId: keyof Omit<DailyEntry, 'date'>;
  entries: DailyEntry[];
}

export default function QuestionChart({ questionId, entries }: QuestionChartProps) {
  // Show most recent 30 entries
  const recent = entries.slice(-30);

  if (recent.length === 0) {
    return (
      <p className="text-gray-500 text-sm text-center py-4">
        No entries yet
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {recent.map((entry) => {
        const score = getQuestionScore(questionId, entry);
        const color = scoreToColor(score);
        const label = getAnswerLabel(questionId, entry);

        return (
          <div key={entry.date} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-20 shrink-0 font-mono">
              {formatShortDate(entry.date)}
            </span>
            <div className="flex-1 h-6 rounded overflow-hidden bg-gray-800">
              <div
                className="h-full rounded flex items-center px-2"
                style={{
                  width: `${Math.max(score * 100, 15)}%`,
                  backgroundColor: color,
                }}
              >
                <span className="text-xs text-white font-medium truncate">
                  {label}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getAnswerLabel(
  questionId: keyof Omit<DailyEntry, 'date'>,
  entry: DailyEntry
): string {
  if (questionId === 'alcohol') {
    return entry.alcohol.charAt(0).toUpperCase() + entry.alcohol.slice(1);
  }
  const val = entry[questionId];
  return val ? 'Yes' : 'No';
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
