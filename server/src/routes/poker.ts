import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { connect, getHands, analyzeHand } from '../services/pokerApi/pokerApi.service';
import { deductCredit, getUserById } from '../services/userService';

const router = Router();

// POST /api/poker/importar-maos
router.post('/importar-maos', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ ok: false, message: 'unauthorized' });

    // Deduct a usage for importing (business rule)
    const allowed = await deductCredit(req.userId as string, 'poker.import');
    if (!allowed) {
      const u = await getUserById(req.userId);
      return res.status(403).json({ ok: false, error: 'no_credits', message: 'Você atingiu o limite de usos gratuitos. Faça upgrade para premium.', remaining: u?.usosRestantes ?? u?.credits ?? 0 });
    }

    // For now accept `hands` in body as array of strings
    const { hands } = req.body || {};
    if (!hands || !Array.isArray(hands)) return res.status(400).json({ ok: false, message: 'hands array required' });

    // Placeholder: in future call provider
    // TODO: persist hands
    return res.json({ ok: true, imported: hands.length });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err?.message || 'internal' });
  }
});

// POST /api/poker/analise
router.post('/analise', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ ok: false, message: 'unauthorized' });

    const { hand } = req.body || {};
    if (!hand || typeof hand !== 'string') return res.status(400).json({ ok: false, message: 'hand required' });

    const allowed = await deductCredit(req.userId as string, 'poker.analyze');
    if (!allowed) {
      const u = await getUserById(req.userId);
      return res.status(403).json({ ok: false, error: 'no_credits', message: 'Você atingiu o limite de usos gratuitos. Faça upgrade para premium.', remaining: u?.usosRestantes ?? u?.credits ?? 0 });
    }

    const result = await analyzeHand(hand);
    return res.json({ ok: true, result });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err?.message || 'internal' });
  }
});

// GET /api/poker/historico
router.get('/historico', authMiddleware, async (req: AuthRequest, res) => {
  try {
    // Placeholder: return empty history
    return res.json({ ok: true, history: [] });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err?.message || 'internal' });
  }
});

// POST /api/poker/conectar-plataforma
router.post('/conectar-plataforma', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await connect();
    return res.json({ ok: true, result });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err?.message || 'internal' });
  }
});

export default router;
