'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import React from 'react';
import { AuthState, StoredKey } from '@/types';
import { encryptWithPin, decryptWithPin } from '@/lib/crypto';
import {
  isValidNsec,
  getPubkeyFromNsec,
  getNpubFromNsec,
  getPrivkeyHexFromNsec,
} from '@/lib/nostr';
import { getStoredKey, storeKey, clearStoredKey } from '@/lib/db';

interface AuthContextType extends AuthState {
  setup: (nsec: string, pin: string) => Promise<void>;
  unlock: (pin: string) => Promise<void>;
  lock: () => void;
  reset: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isSetup: false,
    isUnlocked: false,
    npub: null,
    nsec: null,
    pubkeyHex: null,
    privkeyHex: null,
  });
  const [loading, setLoading] = useState(true);

  // Check if a key is already stored on mount
  useEffect(() => {
    getStoredKey()
      .then((stored) => {
        if (stored) {
          setState((prev) => ({
            ...prev,
            isSetup: true,
            npub: stored.npub,
          }));
        }
      })
      .catch((err) => {
        console.error('Failed to check stored key:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const setup = useCallback(async (nsec: string, pin: string) => {
    if (!isValidNsec(nsec)) {
      throw new Error('Invalid nsec format');
    }

    const pubkeyHex = getPubkeyFromNsec(nsec);
    const npub = getNpubFromNsec(nsec);
    const privkeyHex = getPrivkeyHexFromNsec(nsec);

    // Encrypt nsec with PIN
    const { ciphertext, salt, iv } = await encryptWithPin(nsec, pin);

    const storedKey: StoredKey = {
      id: 'primary',
      encryptedNsec: ciphertext,
      salt,
      iv,
      npub,
    };

    await storeKey(storedKey);

    setState({
      isSetup: true,
      isUnlocked: true,
      npub,
      nsec,
      pubkeyHex,
      privkeyHex,
    });
  }, []);

  const unlock = useCallback(async (pin: string) => {
    const stored = await getStoredKey();
    if (!stored) {
      throw new Error('No key stored');
    }

    try {
      const nsec = await decryptWithPin(
        stored.encryptedNsec,
        pin,
        stored.salt,
        stored.iv
      );

      if (!isValidNsec(nsec)) {
        throw new Error('Decryption produced invalid nsec');
      }

      const pubkeyHex = getPubkeyFromNsec(nsec);
      const privkeyHex = getPrivkeyHexFromNsec(nsec);

      setState({
        isSetup: true,
        isUnlocked: true,
        npub: stored.npub,
        nsec,
        pubkeyHex,
        privkeyHex,
      });
    } catch {
      throw new Error('Incorrect PIN');
    }
  }, []);

  const lock = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isUnlocked: false,
      nsec: null,
      pubkeyHex: null,
      privkeyHex: null,
    }));
  }, []);

  const reset = useCallback(async () => {
    await clearStoredKey();
    setState({
      isSetup: false,
      isUnlocked: false,
      npub: null,
      nsec: null,
      pubkeyHex: null,
      privkeyHex: null,
    });
  }, []);

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        ...state,
        setup,
        unlock,
        lock,
        reset,
        loading,
      },
    },
    children
  );
}

export function useNostr() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useNostr must be used within an AuthProvider');
  }
  return context;
}
