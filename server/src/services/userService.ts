import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import {
  initDatabase,
  dbCreateUser,
  dbGetUserById,
  dbGetUserByEmail,
  dbGetUserByGoogleId,
  dbUpdateUser,
  dbGetAllUsers,
} from './database';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  googleId?: string;
  price?: number;
  credits: number;
  usosRestantes: number | null; // null or -1 indicates unlimited
  statusPlano: 'free' | 'premium';
  premium: boolean;
  premiumUntil: Date | null;
  createdAt: Date;
}

// Flag to check if database is available
let dbAvailable = false;

// In-memory fallback (only used if database is not available)
const memoryUsers = new Map<string, User>();
const memoryUsersByEmail = new Map<string, User>();

// Initialize database on startup
export async function initUserService(): Promise<void> {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn('[userService] ⚠️ DATABASE_URL not set - using memory storage (DATA WILL BE LOST ON RESTART)');
      dbAvailable = false;
      return;
    }
    await initDatabase();
    dbAvailable = true;
    console.log('[userService] ✅ PostgreSQL connected - data will persist permanently!');
  } catch (err: any) {
    console.error('[userService] ⚠️ Database connection failed:', err.message);
    console.warn('[userService] ⚠️ Falling back to memory storage (DATA WILL BE LOST ON RESTART)');
    dbAvailable = false;
  }
}

export async function createUser(
  email: string,
  name: string,
  password?: string,
  googleId?: string,
  price?: number
): Promise<User> {
  // Check if user exists
  const existing = await getUserByEmail(email);
  if (existing) {
    throw new Error('User already exists');
  }

  const user: User = {
    id: uuid(),
    email,
    name,
    passwordHash: password ? bcrypt.hashSync(password, 10) : undefined,
    googleId,
    price: typeof price === 'number' ? price : 5.9,
    credits: 5,
    usosRestantes: 5,
    statusPlano: 'free',
    premium: false,
    premiumUntil: null,
    createdAt: new Date(),
  };

  if (dbAvailable) {
    await dbCreateUser(user);
    console.log(`[userService] ✅ User saved to PostgreSQL: ${email}`);
  } else {
    memoryUsers.set(user.id, user);
    memoryUsersByEmail.set(email, user);
    console.log(`[userService] ⚠️ User saved to memory only: ${email}`);
  }

  return user;
}

export async function getUserById(id: string): Promise<User | undefined> {
  if (dbAvailable) {
    const user = await dbGetUserById(id);
    return user || undefined;
  }
  return memoryUsers.get(id);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  if (dbAvailable) {
    const user = await dbGetUserByEmail(email);
    return user || undefined;
  }
  return memoryUsersByEmail.get(email);
}

export async function getUserByGoogleId(googleId: string): Promise<User | undefined> {
  if (dbAvailable) {
    const user = await dbGetUserByGoogleId(googleId);
    return user || undefined;
  }
  for (const user of memoryUsers.values()) {
    if (user.googleId === googleId) return user;
  }
  return undefined;
}

export async function verifyPassword(email: string, password: string): Promise<boolean> {
  const user = await getUserByEmail(email);
  if (!user || !user.passwordHash) return false;
  return bcrypt.compareSync(password, user.passwordHash);
}

export async function deductCredit(userId: string, endpoint: string = 'generic'): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user) return false;

  // Premium users have unlimited
  if (user.statusPlano === 'premium') return true;
  if (user.usosRestantes === null || user.usosRestantes === -1) return true;

  if (typeof user.usosRestantes === 'number' && user.usosRestantes > 0) {
    const newUsos = user.usosRestantes - 1;
    const newCredits = Math.max(0, user.credits - 1);

    if (dbAvailable) {
      await dbUpdateUser(userId, { usosRestantes: newUsos, credits: newCredits });
    } else {
      user.usosRestantes = newUsos;
      user.credits = newCredits;
    }

    return true;
  }

  return false;
}

export async function setPremium(userId: string, days: number = 30): Promise<void> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  const premiumUntil = new Date();
  premiumUntil.setDate(premiumUntil.getDate() + days);

  if (dbAvailable) {
    await dbUpdateUser(userId, {
      premium: true,
      statusPlano: 'premium',
      usosRestantes: -1, // unlimited
      credits: 999999,
      premiumUntil,
    });
    console.log(`[userService] ✅ Premium activated in PostgreSQL: ${user.email}`);
  } else {
    user.premium = true;
    user.statusPlano = 'premium';
    user.usosRestantes = -1;
    user.credits = 999999;
    user.premiumUntil = premiumUntil;
    console.log(`[userService] ⚠️ Premium activated in memory only: ${user.email}`);
  }
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  if (dbAvailable) {
    await dbUpdateUser(userId, updates as any);
    const updated = await getUserById(userId);
    return updated!;
  } else {
    Object.assign(user, updates);
    return user;
  }
}

export async function updatePassword(email: string, newPassword: string): Promise<void> {
  const user = await getUserByEmail(email);
  if (!user) throw new Error('User not found');

  const passwordHash = bcrypt.hashSync(newPassword, 10);

  if (dbAvailable) {
    await dbUpdateUser(user.id, { passwordHash });
    console.log(`[userService] ✅ Password updated in PostgreSQL: ${email}`);
  } else {
    user.passwordHash = passwordHash;
    console.log(`[userService] ⚠️ Password updated in memory only: ${email}`);
  }
}

export function getAllUsers(): User[] {
  if (dbAvailable) {
    // Note: This is sync for compatibility, but should be made async
    return Array.from(memoryUsers.values());
  }
  return Array.from(memoryUsers.values());
}
