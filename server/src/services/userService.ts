import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import storage from './storage';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  googleId?: string;
  price?: number;
  // Legacy internal field
  credits: number;
  // New fields for requested schema
  usosRestantes: number | null; // null or -1 indicates unlimited
  statusPlano: 'free' | 'premium';
  premium: boolean;
  premiumUntil: Date | null;
  createdAt: Date;
}

// In-memory user store (loaded from JSON file)
const users = new Map<string, User>();
const usersByEmail = new Map<string, User>();

const STORAGE_KEY = 'users';

async function persistAll() {
  const arr = Array.from(users.values()).map(u => ({
    ...u,
    premiumUntil: u.premiumUntil ? u.premiumUntil.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
  }));
  await storage.writeJSON(STORAGE_KEY, arr);
}

async function loadAll() {
  const arr = await storage.readJSON<any[]>(STORAGE_KEY, []);
  for (const raw of arr) {
    const u: User = {
      ...raw,
      premiumUntil: raw.premiumUntil ? new Date(raw.premiumUntil) : null,
      createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
    };
    users.set(u.id, u);
    usersByEmail.set(u.email, u);
  }
}

// initialize from disk
loadAll().catch((e) => console.error('[userService] failed to load users', e));

export async function createUser(email: string, name: string, password?: string, googleId?: string, price?: number): Promise<User> {
  const existing = usersByEmail.get(email);
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
    credits: 3,
    usosRestantes: 3,
    statusPlano: 'free',
    premium: false,
    premiumUntil: null,
    createdAt: new Date(),
  };

  users.set(user.id, user);
  usersByEmail.set(email, user);
  await persistAll();
  return user;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  return usersByEmail.get(email);
}

export async function getUserById(id: string): Promise<User | undefined> {
  return users.get(id);
}

export async function verifyPassword(email: string, password: string): Promise<boolean> {
  const user = usersByEmail.get(email);
  if (!user || !user.passwordHash) return false;
  return bcrypt.compareSync(password, user.passwordHash);
}

// Simple consumption history persistence
const CONSUMPTION_KEY = 'consumption_history';
async function recordConsumption(userId: string, endpoint: string) {
  try {
    const hist = await storage.readJSON<any[]>(CONSUMPTION_KEY, []);
    hist.push({ id: uuid(), userId, endpoint, at: new Date().toISOString() });
    await storage.writeJSON(CONSUMPTION_KEY, hist);
  } catch (e) {
    console.error('[userService] recordConsumption failed', e);
  }
}

export async function deductCredit(userId: string, endpoint: string = 'generic'): Promise<boolean> {
  const user = users.get(userId);
  if (!user) return false;

  if (user.statusPlano === 'premium') return true;

  if (user.usosRestantes === null || user.usosRestantes === -1) return true;

  if (typeof user.usosRestantes === 'number' && user.usosRestantes > 0) {
    user.usosRestantes = user.usosRestantes - 1;
    user.credits = Math.max(0, user.credits - 1);
    await persistAll();
    await recordConsumption(userId, endpoint);
    return true;
  }

  return false;
}

export async function setPremium(userId: string, days: number = 30): Promise<void> {
  const user = users.get(userId);
  if (!user) throw new Error('User not found');

  user.premium = true;
  user.statusPlano = 'premium';
  const until = new Date();
  until.setDate(until.getDate() + days);
  user.premiumUntil = until;

  user.usosRestantes = -1;
  user.credits = 1000;

  await persistAll();
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User> {
  const user = users.get(userId);
  if (!user) throw new Error('User not found');

  Object.assign(user, updates);
  await persistAll();
  return user;
}

// Atualiza senha do usuário
export async function updatePassword(email: string, newPassword: string): Promise<void> {
  const user = usersByEmail.get(email);
  if (!user) throw new Error('User not found');

  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  await persistAll();
}

// Export snapshot for debugging
export function getAllUsers() {
  return Array.from(users.values());
}
