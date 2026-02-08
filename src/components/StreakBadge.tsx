'use client';

interface StreakBadgeProps {
  current: number;
  longest: number;
  label: string;
}

export default function StreakBadge({ current, longest, label }: StreakBadgeProps) {
  return (
    <div className="flex gap-3">
      <div className="bg-gray-900 rounded-lg p-3 flex-1 text-center">
        <p className="text-2xl font-bold text-white">{current}</p>
        <p className="text-xs text-gray-400">Current {label}</p>
      </div>
      <div className="bg-gray-900 rounded-lg p-3 flex-1 text-center">
        <p className="text-2xl font-bold text-white">{longest}</p>
        <p className="text-xs text-gray-400">Longest {label}</p>
      </div>
    </div>
  );
}
