import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import session from 'express-session';
import passport from './middleware/passport';

import playersRouter from './routes/players';
import trainerRouter from './routes/trainer';
import aiRouter from './routes/ai';
import authRouter from './routes/auth';
import paymentsRouter from './routes/payments';
import dashboardRouter from './routes/dashboard';
import { startAutoConfirmation } from './services/pixService';
import sharkscopeRouter from './routes/sharkscope';
import pokerRouter from './routes/poker';
import gtoRouter from './routes/gto';
import { initUserService } from './services/userService';

const app = express();

// Middlewares principais
app.use(cors());
app.use(express.json());

// Sessão necessária para Google OAuth
app.use(
  session({
    secret: process.env.JWT_SECRET || 'secret123',
    resave: false,
    saveUninitialized: true,
  })
);

// Inicializar Passport (Google OAuth)
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (_req, res) => {
  res.json({ ok: true, message: 'PokerWizard API' });
});

/* ------------------ ROTAS --------------------- */

// Rotas públicas (login normal + login Google)
app.use('/api/auth', authRouter);

// Rotas protegidas
app.use('/api/payments', paymentsRouter);
app.use('/api/dashboard', dashboardRouter);

// Rotas existentes
app.use('/api/players', playersRouter);
app.use('/api/trainer', trainerRouter);
app.use('/api/ai', aiRouter);
app.use('/api/sharkscope', sharkscopeRouter);
app.use('/api/poker', pokerRouter);
app.use('/api/gto', gtoRouter);

/* ------------ INICIAR SERVIDOR ------------ */

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// Initialize database before starting server
async function startServer() {
  try {
    // Initialize PostgreSQL connection
    console.log('[server] Initializing database...');
    await initUserService();
    
    app.listen(port, () => {
      console.log(`\n🚀 PokerWizard API running on http://localhost:${port}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      try {
        const intervalMs = process.env.PIX_AUTO_CONFIRM_INTERVAL_MS ? Number(process.env.PIX_AUTO_CONFIRM_INTERVAL_MS) : undefined;
        const thresholdMs = process.env.PIX_AUTO_CONFIRM_THRESHOLD_MS ? Number(process.env.PIX_AUTO_CONFIRM_THRESHOLD_MS) : undefined;

        if (intervalMs && thresholdMs) {
          console.log(`[index] Starting PIX auto-confirmation (interval=${intervalMs}ms, threshold=${thresholdMs}ms)`);
          startAutoConfirmation(intervalMs, thresholdMs);
        } else if (intervalMs) {
          console.log(`[index] Starting PIX auto-confirmation (interval=${intervalMs}ms, threshold=default)`);
          startAutoConfirmation(intervalMs);
        } else if (thresholdMs) {
          console.log(`[index] Starting PIX auto-confirmation (interval=default, threshold=${thresholdMs}ms)`);
          startAutoConfirmation(undefined, thresholdMs);
        } else {
          startAutoConfirmation();
        }
      } catch (err) {
        console.error('Failed to start PIX auto-confirmation', err);
      }
    });
  } catch (err) {
    console.error('[server] Failed to start:', err);
    process.exit(1);
  }
}

startServer();
