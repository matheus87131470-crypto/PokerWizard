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
  usosRestantes: number | null; // null or -1 indicates unlimited (legacy)
  // Limites por funcionalidade
  usosTrainer: number;      // 5 usos gratuitos
  usosAnalise: number;      // 10 usos gratuitos  
  usosJogadores: number;    // 5 usos gratuitos
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
    credits: 10, // Legacy - mantendo compatibilidade
    usosRestantes: 10, // Legacy
    // Novos limites por funcionalidade
    usosTrainer: 5,      // 🎯 Trainer GTO - 5 usos
    usosAnalise: 10,     // 📊 Análise de Mãos - 10 usos
    usosJogadores: 5,    // 🔍 Análise de Jogadores - 5 usos
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

// Tipo de funcionalidade para controle de usos
export type FeatureType = 'trainer' | 'analise' | 'jogadores' | 'generic';

// Limites por funcionalidade
const FEATURE_LIMITS: Record<FeatureType, number> = {
  trainer: 5,      // 🎯 Trainer GTO
  analise: 10,     // 📊 Análise de Mãos
  jogadores: 5,    // 🔍 Análise de Jogadores
  generic: 5,      // Fallback
};

export async function deductCredit(userId: string, feature: FeatureType = 'generic'): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user) return false;

  // Premium users have unlimited
  if (user.statusPlano === 'premium' || user.premium) return true;
  
  // Determinar qual campo usar baseado na feature
  let currentUsos: number;
  let fieldToUpdate: string;
  
  switch (feature) {
    case 'trainer':
      currentUsos = user.usosTrainer ?? FEATURE_LIMITS.trainer;
      fieldToUpdate = 'usosTrainer';
      break;
    case 'analise':
      currentUsos = user.usosAnalise ?? FEATURE_LIMITS.analise;
      fieldToUpdate = 'usosAnalise';
      break;
    case 'jogadores':
      currentUsos = user.usosJogadores ?? FEATURE_LIMITS.jogadores;
      fieldToUpdate = 'usosJogadores';
      break;
    default:
      // Fallback para sistema legado
      currentUsos = user.usosRestantes ?? 5;
      fieldToUpdate = 'usosRestantes';
  }
  
  // Verificar se tem usos disponíveis
  if (currentUsos <= 0) {
    return false;
  }
  
  const newUsos = currentUsos - 1;
  
  if (dbAvailable) {
    await dbUpdateUser(userId, { [fieldToUpdate]: newUsos });
  } else {
    (user as any)[fieldToUpdate] = newUsos;
  }
  
  console.log(`[userService] ✅ Uso consumido: ${feature} | User: ${user.email} | Restantes: ${newUsos}`);
  return true;
}

// Função para obter usos restantes de uma feature específica
export async function getFeatureUsage(userId: string, feature: FeatureType): Promise<number> {
  const user = await getUserById(userId);
  if (!user) return 0;
  
  // Premium tem ilimitado
  if (user.statusPlano === 'premium' || user.premium) return -1;
  
  switch (feature) {
    case 'trainer':
      return user.usosTrainer ?? FEATURE_LIMITS.trainer;
    case 'analise':
      return user.usosAnalise ?? FEATURE_LIMITS.analise;
    case 'jogadores':
      return user.usosJogadores ?? FEATURE_LIMITS.jogadores;
    default:
      return user.usosRestantes ?? 5;
  }
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
