'use client';

import Link from 'next/link';
import { useNostr } from '@/hooks/useNostr';

export default function NavBar() {
  const { npub, lock } = useNostr();

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-white font-bold text-lg">
          GoalTracker
        </Link>

        <div className="flex items-center gap-3">
          {npub && (
            <span className="text-gray-500 text-xs font-mono hidden sm:block">
              {npub.slice(0, 12)}...
            </span>
          )}
          <button
            onClick={lock}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Lock
          </button>
        </div>
      </div>
    </nav>
  );
}
