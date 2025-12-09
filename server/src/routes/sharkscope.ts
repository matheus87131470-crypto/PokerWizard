import express from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { fetchPlayerFromSharkScope } from '../services/sharkscopeService';
import { deductCredit, getUserById } from '../services/userService';

const router = express.Router();

// GET /api/sharkscope/player/:name
router.get('/player/:name', authMiddleware, async (req: AuthRequest, res) => {
  try {
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
