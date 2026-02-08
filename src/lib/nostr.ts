/**
 * NIP-44 encrypt/decrypt helpers for data at rest.
 * Encrypts to self (own pubkey) so only the user can decrypt.
 */
import * as nip44 from 'nostr-tools/nip44';
import * as nip19 from 'nostr-tools/nip19';
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure';
import { bytesToHex, hexToBytes } from 'nostr-tools/utils';

/** Decode an nsec string to raw private key bytes */
export function decodeNsec(nsec: string): Uint8Array {
  const decoded = nip19.decode(nsec);
  if (decoded.type !== 'nsec') {
    throw new Error('Invalid nsec format');
  }
  return decoded.data;
}

/** Validate that a string is a valid nsec */
export function isValidNsec(nsec: string): boolean {
  try {
    const decoded = nip19.decode(nsec);
    return decoded.type === 'nsec';
  } catch {
    return false;
  }
}

/** Get hex public key from nsec */
export function getPubkeyFromNsec(nsec: string): string {
  const privkeyBytes = decodeNsec(nsec);
  return getPublicKey(privkeyBytes);
}

/** Get npub from nsec */
export function getNpubFromNsec(nsec: string): string {
  const pubkeyHex = getPubkeyFromNsec(nsec);
  return nip19.npubEncode(pubkeyHex);
}

/** Get hex private key from nsec */
export function getPrivkeyHexFromNsec(nsec: string): string {
  return bytesToHex(decodeNsec(nsec));
}

/** Generate a new NOSTR keypair, returns { nsec, npub } */
export function generateKeyPair(): { nsec: string; npub: string } {
  const privkeyBytes = generateSecretKey();
  const pubkeyHex = getPublicKey(privkeyBytes);
  return {
    nsec: nip19.nsecEncode(privkeyBytes),
    npub: nip19.npubEncode(pubkeyHex),
  };
}

/** Encrypt data to self using NIP-44 */
export function encryptToSelf(plaintext: string, privkeyHex: string, pubkeyHex: string): string {
  const privkeyBytes = hexToBytes(privkeyHex);
  const conversationKey = nip44.getConversationKey(privkeyBytes, pubkeyHex);
  return nip44.encrypt(plaintext, conversationKey);
}

/** Decrypt data from self using NIP-44 */
export function decryptFromSelf(ciphertext: string, privkeyHex: string, pubkeyHex: string): string {
  const privkeyBytes = hexToBytes(privkeyHex);
  const conversationKey = nip44.getConversationKey(privkeyBytes, pubkeyHex);
  return nip44.decrypt(ciphertext, conversationKey);
}
