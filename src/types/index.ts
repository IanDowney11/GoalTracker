export type AlcoholLevel = 'high' | 'medium' | 'low' | 'none';

export interface DailyEntry {
  date: string; // "YYYY-MM-DD"
  alcohol: AlcoholLevel;
  followMealPlan: boolean;
  eatSugar: boolean;
  tenThousandSteps: boolean;
  exercise: boolean;
}

export interface EncryptedEntry {
  date: string; // "YYYY-MM-DD" - used as key, not sensitive
  ciphertext: string; // NIP-44 encrypted JSON of DailyEntry
}

export interface StoredKey {
  id: string; // always "primary"
  encryptedNsec: string; // AES-GCM encrypted nsec (base64)
  salt: string; // PBKDF2 salt (base64)
  iv: string; // AES-GCM IV (base64)
  npub: string; // public key in npub format (not secret)
}

export interface QuestionDef {
  id: keyof Omit<DailyEntry, 'date'>;
  label: string;
  shortLabel: string;
  type: 'boolean' | 'alcohol';
  /** For boolean questions: does "true" mean a good answer? */
  goodAnswer?: boolean;
  /** Streak label, e.g. "days without alcohol" */
  streakLabel: string;
}

export interface AuthState {
  isSetup: boolean; // whether a key is stored
  isUnlocked: boolean; // whether the session is unlocked
  npub: string | null;
  nsec: string | null; // only in memory when unlocked
  pubkeyHex: string | null;
  privkeyHex: string | null;
}
