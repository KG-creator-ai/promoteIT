/**
 * PIN attempt throttling (D-006).
 *
 * A PIN is short, so unlimited guesses are a real risk. The policy is
 * deliberately forgiving: a legitimate owner is never locked out of their own
 * vault — the cooldown expires, the counter resets, and a successful attempt
 * clears everything. There is no permanent lockout.
 */

export const PIN_MAX_ATTEMPTS = 5;
export const PIN_BASE_COOLDOWN_MS = 15_000;
export const PIN_MAX_COOLDOWN_MS = 5 * 60_000;

interface AttemptState {
  failures: number;
  cooldownUntil: number;
  lastFailureAt: number;
}

const attempts = new Map<string, AttemptState>();

function now(): number {
  return Date.now();
}

export function recordPinFailure(userId: string): AttemptState {
  const key = userId || 'anonymous';
  const state = attempts.get(key) ?? { failures: 0, cooldownUntil: 0, lastFailureAt: 0 };
  const expired = state.cooldownUntil > 0 && state.cooldownUntil <= now();
  const failures = expired ? 1 : state.failures + 1;
  const cooldown = failures >= PIN_MAX_ATTEMPTS
    ? Math.min(PIN_MAX_COOLDOWN_MS, PIN_BASE_COOLDOWN_MS * Math.pow(2, failures - PIN_MAX_ATTEMPTS))
    : 0;
  const next: AttemptState = { failures, cooldownUntil: cooldown ? now() + cooldown : 0, lastFailureAt: now() };
  attempts.set(key, next);
  return next;
}

export function clearPinFailures(userId: string): void {
  attempts.delete(userId || 'anonymous');
}

/**
 * @returns {{throttled: boolean, remainingMs: number, failures: number}}
 */
export function pinThrottleState(userId: string): { throttled: boolean; remainingMs: number; failures: number } {
  const key = userId || 'anonymous';
  const state = attempts.get(key);
  if (!state) return { throttled: false, remainingMs: 0, failures: 0 };
  const remaining = state.cooldownUntil - now();
  if (remaining <= 0) {
    // The cooldown has expired — the owner is not locked out.
    if (state.failures >= PIN_MAX_ATTEMPTS) attempts.delete(key);
    return { throttled: false, remainingMs: 0, failures: state.failures };
  }
  return { throttled: true, remainingMs: remaining, failures: state.failures };
}

export function isPinThrottled(userId: string): boolean {
  return pinThrottleState(userId).throttled;
}

/** Test seam — clears all throttling state. */
export function resetPinThrottle(): void {
  attempts.clear();
}
