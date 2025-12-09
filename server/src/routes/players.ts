import { Router } from 'express';
import {
  searchPlayers,
  getPlayerStats,
  getPlayerResults,
  getRankings,
  getNetworks,
} from '../controllers/playerController';

const router = Router();

router.get('/networks', getNetworks);
router.get('/rankings', getRankings);
router.get('/', searchPlayers);
router.get('/:id/stats', getPlayerStats);
router.get('/:id/results', getPlayerResults);

export default router;
