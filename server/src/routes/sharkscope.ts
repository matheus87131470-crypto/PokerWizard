import express from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { fetchPlayerFromSharkScope } from '../services/sharkscopeService';
import { getRedis, allowRateLimit } from '../services/redis';
import { deductCredit, getUserById } from '../services/userService';

const router = express.Router();

const RL_MAX = 30; // 30 req/min por IP
const RL_WINDOW_MS = 60_000;
async function allow(req: express.Request): Promise<boolean> {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const redis = getRedis();
  const key = `rl:sharkscope:${ip}`;
  return await allowRateLimit(redis, key, RL_MAX, RL_WINDOW_MS);
}

// GET /api/sharkscope/player/:name
router.get('/player/:name', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!(await allow(req))) {
      return res.status(429).json({ ok: false, error: 'rate_limited' });
    }
    const name = req.params.name;
    if (!name) return res.status(400).json({ ok: false, message: 'Nome do jogador obrigatório' });
    if (!req.userId) return res.status(401).json({ ok: false, message: 'unauthorized' });

    const allowed = await deductCredit(req.userId as string, 'sharkscope.search');
    if (!allowed) {
      const u = await getUserById(req.userId);
      return res.status(403).json({ ok: false, error: 'no_credits', message: 'Você atingiu o limite de usos gratuitos. Faça upgrade para premium.', remaining: u?.usosRestantes ?? u?.credits ?? 0 });
    }

    const data = await fetchPlayerFromSharkScope(name);
    return res.json({ ok: true, data });
  } catch (err: any) {
    console.error('[sharkscope] error', err?.message || err);
    return res.status(500).json({ ok: false, message: err?.message || 'Erro ao consultar SharkScope' });
  }
});

export default router;
