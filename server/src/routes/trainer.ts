import { Router } from 'express';
import {
  generateScenario,
  recordResult,
  getStats,
  getUsage,
  subscribe,
} from '../controllers/playerController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Protect generation endpoint so it consumes a user usage
router.post('/generate', authMiddleware, generateScenario);
router.post('/record', authMiddleware, recordResult);
router.get('/stats', getStats);
router.get('/usage', authMiddleware, getUsage);
router.post('/subscribe', authMiddleware, subscribe);

export default router;
