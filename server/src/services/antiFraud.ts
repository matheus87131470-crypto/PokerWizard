// Removido import Request - usando any
import * as crypto from 'crypto';

interface DeviceFingerprint {
  userAgent: string;
  acceptLanguage: string;
  screenResolution?: string;
  timezone?: string;
  canvas?: string;
  webgl?: string;
}

interface AccountCheck {
  ip: string;
  fingerprint: string;
  email: string;
  deviceId: string;
  createdAt: Date;
}

// Lista de domínios de e-mail descartáveis/temporários (expandir conforme necessário)
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'throwaway.email',
  'mailinator.com', 'trashmail.com', 'fakeinbox.com', 'yopmail.com',
  'getnada.com', 'temp-mail.org', 'maildrop.cc', 'sharklasers.com',
  'guerrillamail.info', 'guerrillamail.biz', 'guerrillamail.de', 'spam4.me',
  'grr.la', 'guerrillamail.net', 'guerrillamail.org', 'mailnesia.com',
  'mintemail.com', 'mytemp.email', 'mohmal.com', 'emailondeck.com'
];

// Armazena registros de contas criadas
const accountRegistry: AccountCheck[] = [];

// Tempo mínimo entre criações de conta do mesmo IP (24 horas)
const MIN_TIME_BETWEEN_ACCOUNTS = 24 * 60 * 60 * 1000; // 24 horas em ms

/**
 * Gera um fingerprint avançado do dispositivo
 */
export function generateFingerprint(req: any, deviceInfo?: DeviceFingerprint): string {
  const data = {
    userAgent: deviceInfo?.userAgent || req.headers['user-agent'] || '',
    acceptLanguage: deviceInfo?.acceptLanguage || req.headers['accept-language'] || '',
    screenResolution: deviceInfo?.screenResolution || '',
    timezone: deviceInfo?.timezone || '',
    canvas: deviceInfo?.canvas || '',
    webgl: deviceInfo?.webgl || '',
  };
  
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
  
  return hash;
}

/**
 * Gera um Device ID único combinando múltiplos fatores
 */
export function generateDeviceId(ip: string, fingerprint: string): string {
  const combined = `${ip}-${fingerprint}`;
  return crypto
    .createHash('sha256')
    .update(combined)
    .digest('hex')
    .substring(0, 16);
}

/**
 * Verifica se o e-mail é de um provedor descartável/temporário
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  
  return DISPOSABLE_EMAIL_DOMAINS.some(disposable => 
    domain === disposable || domain.endsWith('.' + disposable)
  );
}

/**
 * Valida formato de e-mail
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Obtém o IP real do usuário
 */
export function getRealIP(req: any): string {
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
 * Implementa todas as recomendações de segurança
 */
export function canCreateAccount(req: any, email: string, deviceInfo?: DeviceFingerprint): {
  allowed: boolean;
  reason?: string;
  waitTime?: number;
} {
  const ip = getRealIP(req);
  const fingerprint = generateFingerprint(req, deviceInfo);
  const deviceId = generateDeviceId(ip, fingerprint);
  const now = Date.now();

  // 0. EXCEÇÃO: Se não há nenhum usuário no sistema, permite o primeiro cadastro (bootstrap)
  if (accountRegistry.length === 0) {
    return { allowed: true };
  }

  // 🟢 ESSENCIAL 1: Validar formato de e-mail
  if (!isValidEmail(email)) {
    return {
      allowed: false,
      reason: 'E-mail inválido. Por favor, use um e-mail válido.'
    };
  }

  // 🟢 ESSENCIAL 2: Bloquear e-mails descartáveis/temporários
  if (isDisposableEmail(email)) {
    return {
      allowed: false,
      reason: 'E-mails temporários não são permitidos. Use um e-mail permanente.'
    };
  }

  // 🟢 ESSENCIAL 3: Verificar se já existe conta com este email
  const existingEmail = accountRegistry.find(acc => acc.email === email);
  if (existingEmail) {
    return {
      allowed: false,
      reason: 'Este e-mail já está registrado. Faça login ou recupere sua senha.'
    };
  }

  // 🟡 FORTE 1: Verificar combinação e-mail + dispositivo + IP (24h)
  const accountsFromDeviceAndIP = accountRegistry.filter(
    acc => acc.deviceId === deviceId || acc.ip === ip || acc.fingerprint === fingerprint
  );

  if (accountsFromDeviceAndIP.length > 0) {
    const lastAccount = accountsFromDeviceAndIP[accountsFromDeviceAndIP.length - 1];
    const timeSinceLastAccount = now - lastAccount.createdAt.getTime();
    
    // 🟢 ESSENCIAL 4: Limite de 24h entre contas do mesmo dispositivo/IP
    if (timeSinceLastAccount < MIN_TIME_BETWEEN_ACCOUNTS) {
      const waitTime = Math.ceil((MIN_TIME_BETWEEN_ACCOUNTS - timeSinceLastAccount) / 1000 / 60 / 60); // horas
      return {
        allowed: false,
        reason: `Você já criou uma conta recentemente. Aguarde ${waitTime}h para tentar novamente.`,
        waitTime
      };
    }
  }

  // � CRÍTICO: Limite de 1 conta por IP (anti-abuse)
  const accountsFromIP = accountRegistry.filter(acc => acc.ip === ip);
  
  if (accountsFromIP.length >= 1) {
    return {
      allowed: false,
      reason: 'Já existe uma conta registrada neste endereço. Se você já possui uma conta, faça login.'
    };
  }

  // 🟡 FORTE 2: Limite de contas por dispositivo (máximo 1 conta)
  const permanentAccountsFromDevice = accountRegistry.filter(
    acc => acc.deviceId === deviceId
  );
  
  if (permanentAccountsFromDevice.length >= 1) {
    return {
      allowed: false,
      reason: 'Limite máximo de contas atingido neste dispositivo. Se você já possui uma conta, faça login.'
    };
  }

  // ✅ Todas as verificações passaram
  return { allowed: true };
}

/**
 * Registra uma nova conta criada com Device ID
 */
export function registerAccount(req: any, email: string, deviceInfo?: DeviceFingerprint): void {
  const ip = getRealIP(req);
  const fingerprint = generateFingerprint(req, deviceInfo);
  const deviceId = generateDeviceId(ip, fingerprint);

  accountRegistry.push({
    ip,
    fingerprint,
    email,
    deviceId,
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
