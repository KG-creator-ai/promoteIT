// SPEC-024.AC-002 — the PIN path uses PBKDF2 with a per-vault salt, throttles
// attempts, and migrates an existing SHA-256 hash on unlock (D-006).
import { describe, it, expect, beforeEach } from 'vitest';
import {
  hashPin,
  verifyPin,
  verifyPinDetailed,
  isLegacyPinHash,
  isPbkdf2PinHash,
  PIN_KDF_PREFIX,
} from '../../src/lib/security';
import {
  recordPinFailure,
  clearPinFailures,
  pinThrottleState,
  resetPinThrottle,
  PIN_MAX_ATTEMPTS,
} from '../../src/lib/pinThrottle';

describe('SPEC-024 AC-002 — PIN hashing', () => {
  it('stores a PBKDF2 hash with a per-vault salt', async () => {
    const a = await hashPin('123456');
    const b = await hashPin('123456');

    expect(isPbkdf2PinHash(a)).toBe(true);
    expect(isLegacyPinHash(a)).toBe(false);
    expect(a.startsWith(`${PIN_KDF_PREFIX}$`)).toBe(true);
    // A per-vault salt means two vaults with the same PIN differ.
    expect(a).not.toBe(b);
    const [, iterations, salt] = a.split('$');
    expect(Number(iterations)).toBeGreaterThanOrEqual(100_000);
    expect(salt).toMatch(/^[0-9a-f]{32,}$/);
  });

  it('verifies the right PIN and rejects the wrong one', async () => {
    const stored = await hashPin('123456');
    expect(await verifyPin('123456', stored)).toBe(true);
    expect(await verifyPin('654321', stored)).toBe(false);
  });

  it('still accepts a legacy unsalted SHA-256 hash and flags it for migration', async () => {
    const legacy = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('123456'));
    const legacyHex = Array.from(new Uint8Array(legacy))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    expect(isLegacyPinHash(legacyHex)).toBe(true);
    const result = await verifyPinDetailed('123456', legacyHex);
    expect(result.valid).toBe(true);
    expect(result.legacy).toBe(true);
  });

  it('rejects an unknown hash format', async () => {
    const result = await verifyPinDetailed('123456', 'not-a-hash');
    expect(result.valid).toBe(false);
    expect(result.legacy).toBe(false);
  });
});

describe('SPEC-024 AC-002 — PIN throttling', () => {
  beforeEach(() => resetPinThrottle());

  it('does not throttle before the attempt threshold', () => {
    for (let i = 0; i < PIN_MAX_ATTEMPTS - 1; i++) recordPinFailure('user-1');
    expect(pinThrottleState('user-1').throttled).toBe(false);
  });

  it('throttles after the threshold and never locks the owner out permanently', () => {
    for (let i = 0; i < PIN_MAX_ATTEMPTS; i++) recordPinFailure('user-1');
    const state = pinThrottleState('user-1');
    expect(state.throttled).toBe(true);
    expect(state.remainingMs).toBeGreaterThan(0);
    expect(state.remainingMs).toBeLessThanOrEqual(5 * 60_000);
  });

  it('clears the counter after a successful unlock', () => {
    for (let i = 0; i < PIN_MAX_ATTEMPTS; i++) recordPinFailure('user-2');
    expect(pinThrottleState('user-2').throttled).toBe(true);
    clearPinFailures('user-2');
    expect(pinThrottleState('user-2').throttled).toBe(false);
  });

  it('keeps the throttle per vault', () => {
    for (let i = 0; i < PIN_MAX_ATTEMPTS; i++) recordPinFailure('user-3');
    expect(pinThrottleState('user-3').throttled).toBe(true);
    expect(pinThrottleState('user-4').throttled).toBe(false);
  });
});
