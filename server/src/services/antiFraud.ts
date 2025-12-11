import { Request } from 'express';
import * as crypto from 'crypto';

interface DeviceFingerprint {
  userAgent: string;
  acceptLanguage: string;
  screenResolution?: string;
  timezone?: string;
}

interface AccountCheck {
  ip: string;
  fingerprint: string;
  email: string;
  createdAt: Date;
}

// Armazena registros de contas criadas
const accountRegistry: AccountCheck[] = [];

// Tempo mínimo entre criações de conta do mesmo IP (24 horas)
const MIN_TIME_BETWEEN_ACCOUNTS = 24 * 60 * 60 * 1000; // 24 horas em ms

/**
 * Gera um fingerprint do dispositivo
 */
export function generateFingerprint(req: Request, deviceInfo?: DeviceFingerprint): string {
  const data = {
    userAgent: deviceInfo?.userAgent || req.headers['user-agent'] || '',
    acceptLanguage: deviceInfo?.acceptLanguage || req.headers['accept-language'] || '',
    screenResolution: deviceInfo?.screenResolution || '',
    timezone: deviceInfo?.timezone || '',
  };
  
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
  
  return hash;
}

/**
 * Obtém o IP real do usuário
 */
export function getRealIP(req: Request): string {
  // Tenta obter IP de diferentes headers (útil quando atrás de proxy/CDN)
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  
  if (forwarded) {
    const ips = (forwarded as string).split(',');
    return ips[0].trim();
  }
  
  if (realIP) {
    return realIP as string;
  }
  
  return req.ip || req.connection.remoteAddress || 'unknown';
}

/**
 * Verifica se o usuário pode criar uma nova conta (anti-fraude)
 */
export function canCreateAccount(req: Request, email: string, deviceInfo?: DeviceFingerprint): {
  allowed: boolean;
  reason?: string;
  waitTime?: number;
} {
  const ip = getRealIP(req);
  const fingerprint = generateFingerprint(req, deviceInfo);
  const now = Date.now();

  // 1. Verificar se já existe conta com este email
  const existingEmail = accountRegistry.find(acc => acc.email === email);
  if (existingEmail) {
    return {
      allowed: false,
      reason: 'Este e-mail já está registrado'
    };
  }

  // 2. Verificar contas criadas do mesmo IP
  const accountsFromIP = accountRegistry.filter(acc => acc.ip === ip);
  if (accountsFromIP.length > 0) {
    const lastAccount = accountsFromIP[accountsFromIP.length - 1];
    const timeSinceLastAccount = now - lastAccount.createdAt.getTime();
    
    if (timeSinceLastAccount < MIN_TIME_BETWEEN_ACCOUNTS) {
      const waitTime = Math.ceil((MIN_TIME_BETWEEN_ACCOUNTS - timeSinceLastAccount) / 1000 / 60 / 60); // horas
      return {
        allowed: false,
        reason: `Você já criou uma conta recentemente. Aguarde ${waitTime}h para criar outra.`,
        waitTime
      };
    }
  }

  // 3. Verificar fingerprint do dispositivo (mesmo dispositivo)
  const accountsFromDevice = accountRegistry.filter(acc => acc.fingerprint === fingerprint);
  if (accountsFromDevice.length >= 2) {
    return {
      allowed: false,
      reason: 'Limite de contas atingido neste dispositivo. Entre em contato com o suporte.'
    };
  }

  return { allowed: true };
}

/**
 * Registra uma nova conta criada
 */
export function registerAccount(req: Request, email: string, deviceInfo?: DeviceFingerprint): void {
  const ip = getRealIP(req);
  const fingerprint = generateFingerprint(req, deviceInfo);

  accountRegistry.push({
    ip,
    fingerprint,
    email,
    createdAt: new Date()
  });

  // Limpar registros antigos (mais de 30 dias)
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const validAccounts = accountRegistry.filter(
    acc => acc.createdAt.getTime() > thirtyDaysAgo
  );
  
  accountRegistry.length = 0;
  accountRegistry.push(...validAccounts);
}

/**
 * Limpa o registro de uma conta (uso administrativo)
 */
export function clearAccountRecord(email: string): boolean {
  const index = accountRegistry.findIndex(acc => acc.email === email);
  if (index !== -1) {
    accountRegistry.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Obtém estatísticas de contas criadas
 */
export function getAccountStats() {
  return {
    total: accountRegistry.length,
    last24h: accountRegistry.filter(
      acc => Date.now() - acc.createdAt.getTime() < 24 * 60 * 60 * 1000
    ).length,
    uniqueIPs: new Set(accountRegistry.map(acc => acc.ip)).size,
    uniqueDevices: new Set(accountRegistry.map(acc => acc.fingerprint)).size
  };
}
