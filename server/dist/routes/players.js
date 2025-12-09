"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const playerController_1 = require("../controllers/playerController");
const router = (0, express_1.Router)();
router.get('/networks', playerController_1.getNetworks);
router.get('/rankings', playerController_1.getRankings);
router.get('/', playerController_1.searchPlayers);
router.get('/:id/stats', playerController_1.getPlayerStats);
router.get('/:id/results', playerController_1.getPlayerResults);
exports.default = router;
//# sourceMappingURL=players.js.map