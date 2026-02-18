'use client';

import { DailyEntry, TempGoalDef } from '@/types';
import { getDayScore, scoreToColor } from '@/lib/scoring';

interface DayCellProps {
  day: number;
  date: string;
  entry?: DailyEntry;
  isToday: boolean;
  tempGoalDefs?: TempGoalDef[];
  onClick: () => void;
}

export default function DayCell({ day, entry, isToday, tempGoalDefs = [], onClick }: DayCellProps) {
  const score = entry ? getDayScore(entry, tempGoalDefs) : null;
  const bgColor = score !== null ? scoreToColor(score) : undefined;

  return (
    <button
      onClick={onClick}
      className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all hover:ring-2 hover:ring-white/30 ${
        isToday ? 'ring-2 ring-purple-400' : ''
      } ${!entry ? 'bg-gray-800/50 text-gray-500' : 'text-white'}`}
      style={bgColor ? { backgroundColor: bgColor } : undefined}
    >
      {day}
    </button>
  );
}
