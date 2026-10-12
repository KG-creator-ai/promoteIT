import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  hashPin,
  verifyPin,
  generateVaultKey,
  encryptVault,
  decryptVault,
  wrapVaultKey,
  unwrapVaultKey,
} from '../../src/lib/security';

describe('password hashing (PBKDF2)', () => {
  it('hashes and verifies the correct password', async () => {
    const { salt, hash } = await hashPassword('correct-horse-42');
    expect(await verifyPassword('correct-horse-42', salt, hash)).toBe(true);
  });

  it('rejects the wrong password', async () => {
    const { salt, hash } = await hashPassword('correct-horse-42');
    expect(await verifyPassword('wrong-password', salt, hash)).toBe(false);
  });

  it('produces unique salts per call', async () => {
    const a = await hashPassword('same');
    const b = await hashPassword('same');
    expect(a.salt).not.toBe(b.salt);
  });
});

describe('PIN hashing', () => {
  it('verifies the correct PIN and rejects wrong ones', async () => {
    const h = await hashPin('123456');
    expect(await verifyPin('123456', h)).toBe(true);
    expect(await verifyPin('000000', h)).toBe(false);
  });
});

describe('vault key roundtrip (AES-GCM)', () => {
  it('encrypts and decrypts campaign payloads', async () => {
    const key = await generateVaultKey();
    const { ciphertext, iv } = await encryptVault('{"scenes":[]}', key);
    expect(await decryptVault(ciphertext, iv, key)).toBe('{"scenes":[]}');
  });

  it('fails to decrypt with a different key', async () => {
    const k1 = await generateVaultKey();
    const k2 = await generateVaultKey();
    const { ciphertext, iv } = await encryptVault('secret', k1);
    await expect(decryptVault(ciphertext, iv, k2)).rejects.toThrow();
  });

  it('wraps and unwraps the vault key with a password', async () => {
    const key = await generateVaultKey();
    const { salt } = await hashPassword('user-pass');
    const wrapped = await wrapVaultKey(key, 'user-pass', salt);
    const restored = await unwrapVaultKey(wrapped, 'user-pass', salt);
    const { ciphertext, iv } = await encryptVault('roundtrip', restored);
    expect(await decryptVault(ciphertext, iv, key)).toBe('roundtrip');
  });
});
