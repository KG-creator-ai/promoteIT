/**
 * promote-IT WebAuthn / FIDO2 Module
 * Zero-backend biometric authentication using native browser WebAuthn API.
 */

const RP_NAME = 'promote-IT Studio';
const RP_ID = window.location.hostname;
const CHALLENGE_LENGTH = 32;
const TIMEOUT_MS = 60_000;

function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function generateChallenge(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(CHALLENGE_LENGTH));
}

// ──────────────────────────────────────────────
// Check WebAuthn Support
// ──────────────────────────────────────────────
export function isWebAuthnSupported(): boolean {
  return !!(navigator.credentials && window.PublicKeyCredential);
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────────
// Registration (Create Passkey)
// ──────────────────────────────────────────────
export async function registerPasskey(
  userId: string,
  username: string,
  displayName: string
): Promise<{ credentialId: string; publicKey: string }> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported in this browser.');
  }

  const challenge = generateChallenge();
  const userIdBuffer = new TextEncoder().encode(userId);

  const createOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: { name: RP_NAME, id: RP_ID },
    user: {
      id: userIdBuffer,
      name: username,
      displayName: displayName || username,
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' },   // ES256
      { alg: -257, type: 'public-key' },  // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'preferred',
    },
    timeout: TIMEOUT_MS,
    attestation: 'none',
  };

  const credential = await navigator.credentials.create({ publicKey: createOptions }) as PublicKeyCredential | null;
  if (!credential) {
    throw new Error('Passkey registration was cancelled or failed.');
  }

  const attestation = credential.response as AuthenticatorAttestationResponse;
  return {
    credentialId: bufferToBase64(credential.rawId),
    publicKey: bufferToBase64(attestation.getAuthenticatorData()),
  };
}

// ──────────────────────────────────────────────
// Authentication (Get Assertion)
// ──────────────────────────────────────────────
export async function authenticateWithPasskey(
  credentialId: string
): Promise<{ verified: boolean; credentialId: string }> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported in this browser.');
  }

  const challenge = generateChallenge();
  const allowCredentials: PublicKeyCredentialDescriptor[] = [{
    type: 'public-key',
    id: base64ToBuffer(credentialId),
  }];

  const getOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    timeout: TIMEOUT_MS,
    rpId: RP_ID,
    allowCredentials,
    userVerification: 'required',
  };

  const assertion = await navigator.credentials.get({ publicKey: getOptions }) as PublicKeyCredential | null;
  if (!assertion) {
    throw new Error('Passkey authentication was cancelled or failed.');
  }

  return {
    verified: true,
    credentialId: bufferToBase64(assertion.rawId),
  };
}
