import { Router } from 'express';
import {
  searchPlayers,
  getPlayerStats,
  getPlayerResults,
  getRankings,
  getNetworks,
} from '../controllers/playerController';
import { authMiddleware } from '../middleware/auth';
import { requireUsage } from '../middleware/usageGuard';
import { deductCredit, getUserById } from '../services/userService';

const router = Router();

// Rotas públicas (não consomem créditos)
router.get('/networks', getNetworks);
router.get('/rankings', getRankings);

// Rotas protegidas - consomem créditos de 'jogadores'
router.get('/', authMiddleware, requireUsage('jogadores'), async (req: any, res, next) => {
  // Consome um crédito antes de executar a busca
  const allowed = await deductCredit(req.userId, 'jogadores');
  if (!allowed) {
    const user = await getUserById(req.userId);
    return res.status(403).json({
      ok: false,
      error: 'no_credits',
      message: 'Você atingiu o limite de análises de jogadores gratuitas. Assine o Premium para continuar.',
      remaining: (user as any)?.usosJogadores ?? 0,
      feature: 'jogadores'
    });
  }
  next();
}, searchPlayers);

router.get('/:id/stats', authMiddleware, requireUsage('jogadores'), async (req: any, res, next) => {
  const allowed = await deductCredit(req.userId, 'jogadores');
  if (!allowed) {
    const user = await getUserById(req.userId);
    return res.status(403).json({
      ok: false,
      error: 'no_credits',
      message: 'Você atingiu o limite de análises de jogadores gratuitas. Assine o Premium para continuar.',
      remaining: (user as any)?.usosJogadores ?? 0,
      feature: 'jogadores'
    });
  }
  next();
}, getPlayerStats);

router.get('/:id/results', authMiddleware, requireUsage('jogadores'), async (req: any, res, next) => {
  const allowed = await deductCredit(req.userId, 'jogadores');
  if (!allowed) {
    const user = await getUserById(req.userId);
    return res.status(403).json({
      ok: false,
      error: 'no_credits',
      message: 'Você atingiu o limite de análises de jogadores gratuitas. Assine o Premium para continuar.',
      remaining: (user as any)?.usosJogadores ?? 0,
      feature: 'jogadores'
    });
  }
  next();
}, getPlayerResults);

export default router;
