'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DailyEntry } from '@/types';
import { useEntries } from '@/hooks/useEntries';
import { useTempGoals } from '@/hooks/useTempGoals';
import DayCell from './DayCell';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar() {
  const router = useRouter();
  const { loadEntriesForMonth } = useEntries();
  const { tempGoalDefs } = useTempGoals();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<Map<string, DailyEntry>>(new Map());
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-indexed

  useEffect(() => {
    setLoading(true);
    loadEntriesForMonth(year, month).then((map) => {
      setEntries(map);
      setLoading(false);
    });
  }, [year, month, loadEntriesForMonth]);

  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  function prevMonth() {
    setCurrentDate(new Date(year, month - 2, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month, 1));
  }

  const monthName = new Date(year, month - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Generate day cells
  const cells = [];

  // Empty cells for days before the first of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    cells.push(<div key={`empty-${i}`} />);
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const entry = entries.get(dateStr);

    cells.push(
      <DayCell
        key={dateStr}
        day={day}
        date={dateStr}
        entry={entry}
        isToday={dateStr === todayStr}
        tempGoalDefs={tempGoalDefs}
        onClick={() => router.push(`/entry/${dateStr}`)}
      />
    );
  }

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          &larr; Prev
        </button>
        <h2 className="text-lg font-semibold text-white">{monthName}</h2>
        <button
          onClick={nextMonth}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          Next &rarr;
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs text-gray-500 font-medium py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {loading ? (
          <div className="col-span-7 py-8 text-center text-gray-500">
            Loading...
          </div>
        ) : (
          cells
        )}
      </div>
    </div>
  );
}
