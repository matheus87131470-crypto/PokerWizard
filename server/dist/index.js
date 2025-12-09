"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("./middleware/passport"));
const players_1 = __importDefault(require("./routes/players"));
const trainer_1 = __importDefault(require("./routes/trainer"));
const ai_1 = __importDefault(require("./routes/ai"));
const auth_1 = __importDefault(require("./routes/auth"));
const payments_1 = __importDefault(require("./routes/payments"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const pixService_1 = require("./services/pixService");
const app = (0, express_1.default)();
// Middlewares principais
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Sessão necessária para Google OAuth
app.use((0, express_session_1.default)({
    secret: process.env.JWT_SECRET || 'secret123',
    resave: false,
    saveUninitialized: true,
}));
// Inicializar Passport (Google OAuth)
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.get('/', (_req, res) => {
    res.json({ ok: true, message: 'PokerWizard API' });
});
/* ------------------ ROTAS --------------------- */
// Rotas públicas (login normal + login Google)
app.use('/api/auth', auth_1.default);
// Rotas protegidas
app.use('/api/payments', payments_1.default);
app.use('/api/dashboard', dashboard_1.default);
// Rotas existentes
app.use('/api/players', players_1.default);
app.use('/api/trainer', trainer_1.default);
app.use('/api/ai', ai_1.default);
/* ------------ INICIAR SERVIDOR ------------ */
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, () => {
    console.log(`API rodando em http://localhost:${port}`);
    try {
        const intervalMs = process.env.PIX_AUTO_CONFIRM_INTERVAL_MS ? Number(process.env.PIX_AUTO_CONFIRM_INTERVAL_MS) : undefined;
        const thresholdMs = process.env.PIX_AUTO_CONFIRM_THRESHOLD_MS ? Number(process.env.PIX_AUTO_CONFIRM_THRESHOLD_MS) : undefined;
        if (intervalMs && thresholdMs) {
            console.log(`[index] Starting PIX auto-confirmation (interval=${intervalMs}ms, threshold=${thresholdMs}ms)`);
            (0, pixService_1.startAutoConfirmation)(intervalMs, thresholdMs);
        }
        else if (intervalMs) {
            console.log(`[index] Starting PIX auto-confirmation (interval=${intervalMs}ms, threshold=default)`);
            (0, pixService_1.startAutoConfirmation)(intervalMs);
        }
        else if (thresholdMs) {
            console.log(`[index] Starting PIX auto-confirmation (interval=default, threshold=${thresholdMs}ms)`);
            (0, pixService_1.startAutoConfirmation)(undefined, thresholdMs);
        }
        else {
            (0, pixService_1.startAutoConfirmation)();
        }
    }
    catch (err) {
        console.error('Failed to start PIX auto-confirmation', err);
    }
});
//# sourceMappingURL=index.js.map