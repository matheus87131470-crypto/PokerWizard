"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const playerController_1 = require("../controllers/playerController");
const router = (0, express_1.Router)();
router.post('/generate', playerController_1.generateScenario);
router.post('/record', playerController_1.recordResult);
router.get('/stats', playerController_1.getStats);
router.get('/usage', playerController_1.getUsage);
router.post('/subscribe', playerController_1.subscribe);
exports.default = router;
//# sourceMappingURL=trainer.js.map