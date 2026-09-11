import Dexie, { type Table } from 'dexie';

export interface User {
  id: string;
  username: string;
  role: string;
  passwordHash: string; // AES-GCM encrypted
  salt: string;
  twoFactorPin?: string;
  webAuthnCredentialId?: string;
  webAuthnPublicKey?: string;
  createdAt: number;
  lastLoginAt?: number;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: number;
}

export class AuthDatabase extends Dexie {
  users!: Table<User>;
  sessions!: Table<Session>;

  constructor() {
    super('AVArtVarkAuthDatabase');
    this.version(1).stores({
      users: 'id, username, role',
      sessions: 'id, userId, token, expiresAt'
    });
  }
}

export const authDb = new AuthDatabase();

export async function seedAuthDatabase() {
  const usersCount = await authDb.users.count();
  if (usersCount === 0) {
    // Generate a mock salt and hash for the default admin
    const defaultSalt = 'static-salt-for-dev';
    const defaultPassword = 'admin'; // In production, this would be properly hashed
    
    // Simulate AES-GCM encryption step (mocked for UI non-blocking)
    const mockHash = btoa(defaultPassword + defaultSalt);

    const adminId = 'user-admin-1';

    await authDb.users.add({
      id: adminId,
      username: 'Agency Admin',
      role: 'admin',
      passwordHash: mockHash,
      salt: defaultSalt,
      createdAt: Date.now(),
      lastLoginAt: Date.now()
    });

    await authDb.sessions.add({
      id: 'session-1',
      userId: adminId,
      token: 'dev-token-abc-123',
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 // 1 week
    });
  }
}
