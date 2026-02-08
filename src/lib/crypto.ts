/**
 * PIN-based key derivation (PBKDF2) + AES-GCM encrypt/decrypt for nsec storage.
 * Uses the Web Crypto API (available in all modern browsers).
 */

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function deriveKey(pin: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptWithPin(
  plaintext: string,
  pin: string
): Promise<{ ciphertext: string; salt: string; iv: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt.buffer);

  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: bufferToBase64(encrypted),
    salt: bufferToBase64(salt.buffer),
    iv: bufferToBase64(iv.buffer),
  };
}

export async function decryptWithPin(
  ciphertext: string,
  pin: string,
  salt: string,
  iv: string
): Promise<string> {
  const saltBuf = base64ToBuffer(salt);
  const ivBuf = base64ToBuffer(iv);
  const key = await deriveKey(pin, saltBuf);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(ivBuf) },
    key,
    base64ToBuffer(ciphertext)
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}
