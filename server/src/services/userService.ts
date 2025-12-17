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
  username?: string;        // Nome de usuário único para login
  passwordHash?: string;
  googleId?: string;
  price?: number;
  // ===== NOVO MODELO GLOBAL =====
  freeCredits: number;      // 7 créditos gratuitos GLOBAIS (compartilhados)
  // ===== LEGACY (manter compatibilidade) =====
  credits: number;
  usosRestantes: number | null;
  usosTrainer: number;
  usosAnalise: number;
  usosJogadores: number;
  // ===== PLANO =====
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
  price?: number,
  username?: string
): Promise<User> {
  // Check if user exists
  const existing = await getUserByEmail(email);
  if (existing) {
    throw new Error('User already exists');
  }

  // Check if username already exists
  if (username) {
    const existingUsername = await getUserByUsername(username);
    if (existingUsername) {
      throw new Error('Username already taken');
    }
  }

  const user: User = {
    id: uuid(),
    email,
    name,
    username: username ? username.toLowerCase().trim() : undefined,
    passwordHash: password ? bcrypt.hashSync(password, 10) : undefined,
    googleId,
    price: typeof price === 'number' ? price : 5.9,
    // ===== NOVO: 7 créditos globais =====
    freeCredits: 7,         // 7 usos gratuitos compartilhados
    // ===== Legacy (manter compatibilidade) =====
    credits: 7,
    usosRestantes: 7,
    usosTrainer: 7,
    usosAnalise: 7,
    usosJogadores: 7,
    // ===== Plano =====
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

// Buscar usuário por username
export async function getUserByUsername(username: string): Promise<User | undefined> {
  const normalizedUsername = username.toLowerCase().trim();
  
  if (dbAvailable) {
    // Buscar no banco por username
    const allUsers = await dbGetAllUsers();
    return allUsers.find(u => (u as any).username?.toLowerCase() === normalizedUsername);
  }
  
  // Buscar na memória
  for (const user of memoryUsers.values()) {
    if (user.username?.toLowerCase() === normalizedUsername) return user;
  }
  return undefined;
}

// Buscar usuário por email OU username (para login)
export async function getUserByEmailOrUsername(identifier: string): Promise<User | undefined> {
  // Primeiro tenta por email
  const byEmail = await getUserByEmail(identifier);
  if (byEmail) return byEmail;
  
  // Depois tenta por username
  return await getUserByUsername(identifier);
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

// Tipo de funcionalidade (para logging apenas)
export type FeatureType = 'trainer' | 'analise' | 'jogadores' | 'generic';

// Limite global de créditos gratuitos
const FREE_CREDITS_LIMIT = 7;

/**
 * Verifica se usuário pode usar e deduz 1 crédito global
 * 
 * REGRAS:
 * - Premium: sempre permite (ilimitado)
 * - Free: verifica freeCredits > 0 e deduz 1
 */
export async function deductCredit(userId: string, feature: FeatureType = 'generic'): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user) return false;

  // Premium users have unlimited - não deduz nada
  if (user.statusPlano === 'premium' || user.premium) {
    console.log(`[userService] ✅ Premium user: ${user.email} | Feature: ${feature} | UNLIMITED`);
    return true;
  }
  
  // Usar freeCredits global (com fallback para usosRestantes para usuários antigos)
  const currentCredits = user.freeCredits ?? user.usosRestantes ?? FREE_CREDITS_LIMIT;
  
  // Verificar se tem créditos disponíveis
  if (currentCredits <= 0) {
    console.log(`[userService] ❌ Sem créditos: ${user.email} | Feature: ${feature} | Credits: 0`);
    return false;
  }
  
  // Deduzir 1 crédito
  const newCredits = currentCredits - 1;
  
  if (dbAvailable) {
    await dbUpdateUser(userId, { 
      freeCredits: newCredits,
      // Atualizar legacy também para manter sincronizado
      usosRestantes: newCredits,
      credits: newCredits,
    });
  } else {
    user.freeCredits = newCredits;
    user.usosRestantes = newCredits;
    user.credits = newCredits;
  }
  
  console.log(`[userService] ✅ Crédito usado: ${feature} | User: ${user.email} | Restantes: ${newCredits}/${FREE_CREDITS_LIMIT}`);
  return true;
}

/**
 * Verifica se usuário tem créditos SEM deduzir
 * Útil para validação prévia no frontend
 */
export async function canUseFeature(userId: string): Promise<{ allowed: boolean; remaining: number; isPremium: boolean }> {
  const user = await getUserById(userId);
  if (!user) return { allowed: false, remaining: 0, isPremium: false };

  const isPremium = user.statusPlano === 'premium' || user.premium;
  
  if (isPremium) {
    return { allowed: true, remaining: -1, isPremium: true }; // -1 = ilimitado
  }
  
  const remaining = user.freeCredits ?? user.usosRestantes ?? FREE_CREDITS_LIMIT;
  return { allowed: remaining > 0, remaining, isPremium: false };
}

/**
 * Obtém créditos restantes do usuário
 */
export async function getFreeCredits(userId: string): Promise<number> {
  const user = await getUserById(userId);
  if (!user) return 0;
  
  // Premium tem ilimitado
  if (user.statusPlano === 'premium' || user.premium) return -1;
  
  return user.freeCredits ?? user.usosRestantes ?? FREE_CREDITS_LIMIT;
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
