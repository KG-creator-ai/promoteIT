/**
 * promote-IT WebCrypto Security Module
 * Zero-backend: all key derivation, encryption, and hashing runs 100% client-side.
 */

const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12; // 96-bit IV for AES-GCM

function hexEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function hexDecode(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function base64Encode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64Decode(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// ──────────────────────────────────────────────
// Password Hashing (PBKDF2-HMAC-SHA256)
// ──────────────────────────────────────────────
export async function hashPassword(password: string): Promise<{ salt: string; hash: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return { salt: hexEncode(salt), hash: hexEncode(derivedBits) };
}

export async function verifyPassword(password: string, salt: string, expectedHash: string): Promise<boolean> {
  const saltBytes = hexDecode(salt);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return hexEncode(derivedBits) === expectedHash;
}

// ──────────────────────────────────────────────
// PIN Hashing (PBKDF2, per-vault salt — D-006)
// ──────────────────────────────────────────────
// The stored value is self-describing:
//   pbkdf2$<iterations>$<saltHex>$<hashHex>
// Legacy single unsalted SHA-256 digests (64 hex chars) are still accepted for
// verification and are migrated to PBKDF2 on the next successful unlock.
export const PIN_KDF_PREFIX = 'pbkdf2';
export const PIN_KDF_ITERATIONS = PBKDF2_ITERATIONS;

export async function hashPin(pin: string, salt?: Uint8Array): Promise<string> {
  const saltBytes = salt ?? crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: PIN_KDF_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return `${PIN_KDF_PREFIX}$${PIN_KDF_ITERATIONS}$${hexEncode(saltBytes)}$${hexEncode(derivedBits)}`;
}

export function isLegacyPinHash(stored: string): boolean {
  return /^[0-9a-f]{64}$/i.test(String(stored || ''));
}

export function isPbkdf2PinHash(stored: string): boolean {
  return String(stored || '').startsWith(`${PIN_KDF_PREFIX}$`);
}

/**
 * Verify a PIN against a stored hash.
 * `legacy` is true when the stored value was an unsalted SHA-256 digest — the
 * caller then migrates it to PBKDF2.
 */
export async function verifyPinDetailed(
  pin: string,
  stored: string,
): Promise<{ valid: boolean; legacy: boolean }> {
  const value = String(stored || '');
  if (isPbkdf2PinHash(value)) {
    const [, iterationsRaw, saltHex, hashHex] = value.split('$');
    const iterations = Number(iterationsRaw) || PIN_KDF_ITERATIONS;
    const saltBytes = hexDecode(saltHex);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(pin),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: saltBytes, iterations, hash: 'SHA-256' },
      keyMaterial,
      256
    );
    return { valid: hexEncode(derivedBits) === hashHex, legacy: false };
  }
  if (isLegacyPinHash(value)) {
    const encoded = new TextEncoder().encode(pin);
    const hash = await crypto.subtle.digest('SHA-256', encoded);
    return { valid: hexEncode(hash) === value.toLowerCase(), legacy: true };
  }
  return { valid: false, legacy: false };
}

export async function verifyPin(pin: string, expectedHash: string): Promise<boolean> {
  const { valid } = await verifyPinDetailed(pin, expectedHash);
  return valid;
}

// ──────────────────────────────────────────────
// Vault Encryption (AES-GCM-256)
// ──────────────────────────────────────────────
export async function generateVaultKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encryptVault(data: string, vaultKey: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(data);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, vaultKey, encoded);
  return { ciphertext: base64Encode(ciphertext), iv: hexEncode(iv) };
}

export async function decryptVault(ciphertext: string, iv: string, vaultKey: CryptoKey): Promise<string> {
  const ivBytes = hexDecode(iv);
  const data = base64Decode(ciphertext);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBytes }, vaultKey, data);
  return new TextDecoder().decode(decrypted);
}

// ──────────────────────────────────────────────
// Key Wrapping (encrypt vaultKey with derived password key)
// ──────────────────────────────────────────────
export async function wrapVaultKey(vaultKey: CryptoKey, password: string, salt: string): Promise<string> {
  const saltBytes = hexDecode(salt);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  const wrappingKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBytes, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-KW', length: 256 },
    false,
    ['wrapKey', 'unwrapKey']
  );
  const wrapped = await crypto.subtle.wrapKey('raw', vaultKey, wrappingKey, 'AES-KW');
  return base64Encode(wrapped);
}

export async function unwrapVaultKey(wrappedKey: string, password: string, salt: string): Promise<CryptoKey> {
  const saltBytes = hexDecode(salt);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  const wrappingKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBytes, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-KW', length: 256 },
    false,
    ['wrapKey', 'unwrapKey']
  );
  return crypto.subtle.unwrapKey(
    'raw',
    base64Decode(wrappedKey),
    wrappingKey,
    'AES-KW',
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}
