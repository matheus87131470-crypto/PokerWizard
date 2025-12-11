import { v4 as uuidv4 } from 'uuid';

interface PasswordResetToken {
  email: string;
  code: string;
  createdAt: Date;
  expiresAt: Date;
}

// Armazenamento em memória (em produção, use Redis ou banco de dados)
const resetTokens = new Map<string, PasswordResetToken>();

// Gera código de 6 dígitos
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Cria token de recuperação
export function createResetToken(email: string): string {
  const code = generateCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutos

  resetTokens.set(email, {
    email,
    code,
    createdAt: now,
    expiresAt,
  });

  // Limpa tokens expirados (cleanup)
  cleanupExpiredTokens();

  return code;
}

// Verifica se o código é válido
export function verifyResetCode(email: string, code: string): boolean {
  const token = resetTokens.get(email);

  if (!token) {
    return false;
  }

  // Verifica se expirou
  if (new Date() > token.expiresAt) {
    resetTokens.delete(email);
    return false;
  }

  // Verifica se o código está correto
  if (token.code !== code) {
    return false;
  }

  return true;
}

// Invalida o token após uso
export function invalidateResetToken(email: string): void {
  resetTokens.delete(email);
}

// Limpa tokens expirados
function cleanupExpiredTokens(): void {
  const now = new Date();
  for (const [email, token] of resetTokens.entries()) {
    if (now > token.expiresAt) {
      resetTokens.delete(email);
    }
  }
}

// Retorna tempo restante em minutos
export function getTokenExpiration(email: string): number | null {
  const token = resetTokens.get(email);
  
  if (!token) {
    return null;
  }

  const now = new Date();
  const diff = token.expiresAt.getTime() - now.getTime();
  
  if (diff <= 0) {
    resetTokens.delete(email);
    return null;
  }

  return Math.floor(diff / 60000); // minutos
}

// Para debugging
export function getAllTokens(): Map<string, PasswordResetToken> {
  return resetTokens;
}
