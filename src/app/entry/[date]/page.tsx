'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DailyEntry } from '@/types';
import { useNostr } from '@/hooks/useNostr';
import { useEntries } from '@/hooks/useEntries';
import SurveyForm from '@/components/SurveyForm';

export default function EntryPage() {
  const params = useParams();
  const router = useRouter();
  const date = params.date as string;
  const { isUnlocked, loading: authLoading } = useNostr();
  const { loadEntry, saveEntry } = useEntries();
  const [existing, setExisting] = useState<DailyEntry | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!authLoading && !isUnlocked) {
      router.push('/login');
    }
  }, [authLoading, isUnlocked, router]);

  useEffect(() => {
    if (isUnlocked && date) {
      loadEntry(date).then((entry) => {
        setExisting(entry);
        setLoaded(true);
      });
    }
  }, [isUnlocked, date, loadEntry]);

  if (authLoading || !loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!isUnlocked) return null;

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-red-400">Invalid date format</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => router.push('/')}
          className="text-gray-400 hover:text-white mb-4 text-sm flex items-center gap-1"
        >
          ← Back to Calendar
        </button>

        <SurveyForm
          date={date}
          initialEntry={existing}
          onSave={saveEntry}
        />
      </div>
    </div>
  );
}
