import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  generateVaultKey,
  encryptVault,
  decryptVault,
  wrapVaultKey,
  unwrapVaultKey,
} from '../../src/lib/security';

// SPEC-015.AC-001: adversarial auth/crypto paths (threat model T5).
describe('vault tamper resistance', () => {
  it('rejects bit-flipped ciphertext (AES-GCM integrity)', async () => {
    const key = await generateVaultKey();
    const { ciphertext, iv } = await encryptVault('payload', key);
    const raw = Buffer.from(ciphertext, 'base64');
    raw[0] ^= 0xff;
    await expect(decryptVault(raw.toString('base64'), iv, key)).rejects.toThrow();
  });

  it('rejects tampered IV', async () => {
    const key = await generateVaultKey();
    const { ciphertext, iv } = await encryptVault('payload', key);
    const ivRaw = Buffer.from(iv, 'base64');
    ivRaw[ivRaw.length - 1] ^= 0x01;
    await expect(decryptVault(ciphertext, ivRaw.toString('base64'), key)).rejects.toThrow();
  });

  it('rejects unwrap with wrong password / wrong salt', async () => {
    const key = await generateVaultKey();
    const { salt } = await hashPassword('right-pass');
    const { salt: otherSalt } = await hashPassword('right-pass');
    const wrapped = await wrapVaultKey(key, 'right-pass', salt);
    await expect(unwrapVaultKey(wrapped, 'wrong-pass', salt)).rejects.toThrow();
    await expect(unwrapVaultKey(wrapped, 'right-pass', otherSalt)).rejects.toThrow();
  });

  it('rejects empty-password unwrap (no degenerate keys)', async () => {
    const key = await generateVaultKey();
    const { salt } = await hashPassword('user-pass');
    const wrapped = await wrapVaultKey(key, 'user-pass', salt);
    await expect(unwrapVaultKey(wrapped, '', salt)).rejects.toThrow();
  });
});
