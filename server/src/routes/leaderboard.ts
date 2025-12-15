import { Router, Request, Response } from 'express';
import db from '../services/database';
import { getRedis, allowRateLimit } from '../services/redis';

const router = Router();

// Rate limit config
const RL_MAX = 60; // 60 req/min per IP
const RL_WINDOW_MS = 60_000;
async function allow(req: Request): Promise<boolean> {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const redis = getRedis();
  const key = `rl:leaderboard:${ip}`;
  return await allowRateLimit(redis, key, RL_MAX, RL_WINDOW_MS);
}

// In-memory cache for fast responses with TTL
type CacheKey = `${'lucro'|'roi'|'volume'|'wl'}:${number}`;
const cacheStore = new Map<CacheKey, { rows: any[]; expiresAt: number }>();
const CACHE_TTL_MS = 60_000; // 60s TTL

function getCache(metric: 'lucro'|'roi'|'volume'|'wl', limit: number) {
  const key = `${metric}:${limit}` as CacheKey;
  const rec = cacheStore.get(key);
  if (rec && Date.now() < rec.expiresAt) return rec.rows;
  return null;
}

function setCache(metric: 'lucro'|'roi'|'volume'|'wl', limit: number, rows: any[]) {
  const key = `${metric}:${limit}` as CacheKey;
  cacheStore.set(key, { rows, expiresAt: Date.now() + CACHE_TTL_MS });
}

// GET /api/leaderboard?metric=lucro|roi|volume|wl&limit=100&recalc=true
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!(await allow(req))) {
      return res.status(429).json({ error: 'rate_limited' });
    }
    const metricParam = (req.query.metric as string) || 'lucro';
    const limitParam = req.query.limit ? Number(req.query.limit) : 100;
    const recalc = String(req.query.recalc || 'false') === 'true';

    const metric: 'lucro'|'roi'|'volume'|'wl' = ['lucro','roi','volume','wl'].includes(metricParam)
      ? (metricParam as any)
      : 'lucro';

    // Serve from cache if fresh and not forcing recalc
    if (!recalc) {
      const cached = getCache(metric, limitParam);
      if (cached) {
        return res.json({ metric, count: cached.length, rows: cached, cached: true });
      }
    }

    if (recalc) {
      await db.dbRecalculateLeaderboard();
    }

    const rows = await db.dbGetLeaderboard(metric, limitParam);
    setCache(metric, limitParam, rows);
    res.json({ metric, count: rows.length, rows, cached: false });
  } catch (err: any) {
    console.error('[leaderboard] Error:', err);
    res.status(500).json({ error: 'failed_to_fetch_leaderboard' });
  }
});

export default router;

// Seed endpoint removido do build de produção após inicialização
