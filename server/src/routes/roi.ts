import express from 'express';
import { v4 as uuid } from 'uuid';
import { verifyToken } from '../middleware/auth';
import {
  dbCreateTournamentSession,
  dbGetUserROI,
  dbGetUserTournamentSessions,
  dbDeleteTournamentSession
} from '../services/database';

const router = express.Router();

/**
 * POST /api/roi/sessions
 * Criar nova sessão de torneio
 */
router.post('/sessions', verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { tipo_jogo, buy_in, premio, data } = req.body;

    // Validações
    if (!tipo_jogo || !['MTT', 'SNG'].includes(tipo_jogo)) {
      return res.status(400).json({ error: 'tipo_jogo deve ser MTT ou SNG' });
    }

    if (!buy_in || buy_in <= 0) {
      return res.status(400).json({ error: 'buy_in deve ser maior que 0' });
    }

    if (premio === undefined || premio < 0) {
      return res.status(400).json({ error: 'premio deve ser informado (pode ser 0)' });
    }

    const sessionDate = data ? new Date(data) : new Date();

    const session = {
      id: uuid(),
      userId,
      tipoJogo: tipo_jogo as 'MTT' | 'SNG',
      buyIn: parseFloat(buy_in),
      premio: parseFloat(premio),
      data: sessionDate
    };

    await dbCreateTournamentSession(session);

    res.json({
      success: true,
      session: {
        id: session.id,
        tipo_jogo: session.tipoJogo,
        buy_in: session.buyIn,
        premio: session.premio,
        data: session.data
      }
    });
  } catch (error: any) {
    console.error('[roi] Error creating tournament session:', error);
    res.status(500).json({ error: 'Erro ao criar sessão de torneio', details: error.message });
  }
});

/**
 * GET /api/roi
 * Obter ROI do usuário autenticado
 * 
 * Resposta exemplo:
 * {
 *   "roi": 25.5,
 *   "total_buyins": 1000.00,
 *   "total_premios": 1255.00,
 *   "num_torneios": 15
 * }
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const roiData = await dbGetUserROI(userId);

    if (!roiData) {
      return res.json({
        roi: null,
        total_buyins: 0,
        total_premios: 0,
        num_torneios: 0,
        message: 'Nenhum torneio registrado ainda'
      });
    }

    res.json({
      roi: parseFloat(roiData.roi.toFixed(2)),
      total_buyins: parseFloat(roiData.totalBuyins.toFixed(2)),
      total_premios: parseFloat(roiData.totalPremios.toFixed(2)),
      num_torneios: roiData.numTorneios
    });
  } catch (error: any) {
    console.error('[roi] Error fetching ROI:', error);
    res.status(500).json({ error: 'Erro ao buscar ROI', details: error.message });
  }
});

/**
 * GET /api/roi/sessions
 * Listar todas as sessões de torneio do usuário
 */
router.get('/sessions', verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const sessions = await dbGetUserTournamentSessions(userId, limit);

    res.json({
      sessions: sessions.map(s => ({
        id: s.id,
        tipo_jogo: s.tipoJogo,
        buy_in: s.buyIn,
        premio: s.premio,
        lucro: s.premio - s.buyIn,
        data: s.data,
        created_at: s.createdAt
      }))
    });
  } catch (error: any) {
    console.error('[roi] Error fetching sessions:', error);
    res.status(500).json({ error: 'Erro ao buscar sessões', details: error.message });
  }
});

/**
 * DELETE /api/roi/sessions/:id
 * Deletar uma sessão de torneio
 */
router.delete('/sessions/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const sessionId = req.params.id;
    await dbDeleteTournamentSession(sessionId, userId);

    res.json({ success: true, message: 'Sessão deletada com sucesso' });
  } catch (error: any) {
    console.error('[roi] Error deleting session:', error);
    res.status(500).json({ error: 'Erro ao deletar sessão', details: error.message });
  }
});

export default router;
