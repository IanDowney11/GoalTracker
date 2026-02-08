'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNostr } from '@/hooks/useNostr';
import { generateKeyPair } from '@/lib/nostr';
import { APP_VERSION } from '@/lib/version';

export default function LoginPage() {
  const router = useRouter();
  const { isSetup, npub, setup, unlock, reset, loading } = useNostr();
  const [mode, setMode] = useState<'unlock' | 'setup'>('setup');
  const [nsec, setNsec] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<{ nsec: string; npub: string } | null>(null);
  const [showNsec, setShowNsec] = useState(false);
  const [backedUp, setBackedUp] = useState(false);

  // Sync mode with auth state once loading finishes
  useEffect(() => {
    if (!loading && isSetup) {
      setMode('unlock');
    }
  }, [loading, isSetup]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!nsec.startsWith('nsec1')) {
      setError('nsec must start with "nsec1"');
      return;
    }
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setSubmitting(true);
    try {
      await setup(nsec, pin);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!pin) {
      setError('Enter your PIN');
      return;
    }

    setSubmitting(true);
    try {
      await unlock(pin);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unlock failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset() {
    if (confirm('This will delete your stored key and all data. Are you sure?')) {
      await reset();
      setMode('setup');
      setNsec('');
      setPin('');
      setConfirmPin('');
      setError('');
    }
  }

  function handleGenerate() {
    const keys = generateKeyPair();
    setGeneratedKeys(keys);
    setNsec(keys.nsec);
    setShowNsec(true);
    setBackedUp(false);
    setError('');
  }

  if (mode === 'setup' || !isSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            GoalTracker
          </h1>
          <p className="text-gray-400 text-center mb-6 text-sm">
            Set up your NOSTR identity
          </p>

          {/* Generated key backup display */}
          {generatedKeys && (
            <div className="mb-4 p-3 bg-gray-900 border border-yellow-600/50 rounded-lg space-y-2">
              <p className="text-yellow-500 text-xs font-semibold">
                Back up your keys! Save them somewhere safe.
              </p>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Public Key (npub)</p>
                <p className="text-xs font-mono text-gray-200 break-all select-all">
                  {generatedKeys.npub}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Private Key (nsec)</p>
                <p className="text-xs font-mono text-gray-200 break-all select-all">
                  {showNsec ? generatedKeys.nsec : '••••••••••••••••••••••••••'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowNsec(!showNsec)}
                  className="text-xs text-purple-400 hover:text-purple-300 mt-1"
                >
                  {showNsec ? 'Hide' : 'Reveal'}
                </button>
              </div>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={backedUp}
                  onChange={(e) => setBackedUp(e.target.checked)}
                  className="accent-purple-600"
                />
                <span className="text-xs text-gray-300">
                  I have saved my keys
                </span>
              </label>
            </div>
          )}

          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                NOSTR Private Key (nsec)
              </label>
              <input
                type="password"
                value={nsec}
                onChange={(e) => {
                  setNsec(e.target.value.trim());
                  if (generatedKeys && e.target.value.trim() !== generatedKeys.nsec) {
                    setGeneratedKeys(null);
                    setBackedUp(false);
                  }
                }}
                placeholder="nsec1..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={handleGenerate}
                className="mt-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Generate new key pair
              </button>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Choose a PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="At least 4 digits"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Confirm PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Re-enter PIN"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                autoComplete="off"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || (generatedKeys !== null && !backedUp)}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              {submitting ? 'Setting up...' : 'Set Up'}
            </button>
            {generatedKeys && !backedUp && (
              <p className="text-yellow-500 text-xs text-center">
                Confirm you backed up your keys before continuing
              </p>
            )}
          </form>
          <p className="text-gray-600 text-xs text-center mt-6">v{APP_VERSION}</p>
        </div>
      </div>
    );
  }

  // Unlock mode
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          GoalTracker
        </h1>
        <p className="text-gray-400 text-center mb-1 text-sm">
          Enter PIN to unlock
        </p>
        {npub && (
          <p className="text-gray-500 text-center mb-6 text-xs font-mono truncate">
            {npub}
          </p>
        )}

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-center text-lg placeholder-gray-500 focus:outline-none focus:border-purple-500"
              autoComplete="off"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            {submitting ? 'Unlocking...' : 'Unlock'}
          </button>
        </form>

        <button
          onClick={handleReset}
          className="w-full mt-4 py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
        >
          Reset / Use different key
        </button>
        <p className="text-gray-600 text-xs text-center mt-6">v{APP_VERSION}</p>
      </div>
    </div>
  );
}
