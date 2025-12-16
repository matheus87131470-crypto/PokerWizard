// Redis mock - desabilitado para simplificar deploy
// Se precisar de Redis no futuro, instale: npm install redis

export function getRedis(): null {
  // Redis desabilitado - retorna null
  // Para habilitar: npm install redis e descomentar codigo original
  return null;
}

// Fixed-window rate limit - Redis desabilitado, usa apenas fallback em memória
export async function allowRateLimit(redis: any, key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const windowKey = `${key}:${Math.floor(now / windowMs)}`;
  // Redis desabilitado - sempre usa fallback em memória
  const mem = inMemoryAllow(windowKey, limit, windowMs);
  return mem;
}

// Simple in-memory fixed-window store as fallback
const memStore = new Map<string, { count: number; resetAt: number }>();
function inMemoryAllow(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const rec = memStore.get(key);
  if (!rec || now > rec.resetAt) {
    memStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (rec.count < limit) {
    rec.count += 1;
    return true;
  }
  return false;
}
