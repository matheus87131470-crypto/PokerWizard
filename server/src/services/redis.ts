import { createClient } from 'redis';

let client: ReturnType<typeof createClient> | null = null;
let initTried = false;

export function getRedis() {
  if (client) return client;
  if (initTried) return null;
  initTried = true;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    client = createClient({ url });
    client.on('error', (err) => {
      console.error('[redis] Client error:', err);
    });
    client.connect().catch((err) => {
      console.error('[redis] Failed to connect:', err);
      client = null;
    });
    return client;
  } catch (err) {
    console.error('[redis] init error:', err);
    client = null;
    return null;
  }
}

// Fixed-window rate limit using Redis INCR + EXPIRE
export async function allowRateLimit(redis: ReturnType<typeof createClient> | null, key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const windowKey = `${key}:${Math.floor(now / windowMs)}`;
  if (redis) {
    try {
      const count = await redis.incr(windowKey);
      if (count === 1) {
        await redis.pExpire(windowKey, windowMs);
      }
      return count <= limit;
    } catch (err) {
      console.error('[redis] allowRateLimit error, falling back:', err);
    }
  }
  // Fallback in-memory
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
