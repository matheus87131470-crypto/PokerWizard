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
import sharkscopeRouter from './routes/sharkscope';
import pokerRouter from './routes/poker';
import gtoRouter from './routes/gto';
import gtoAnalyzeRouter from './routes/gtoAnalyze';
import { initUserService } from './services/userService';
import db from './services/database';
import leaderboardRouter from './routes/leaderboard';
import healthRouter from './routes/health';

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
app.use('/api/gto-analyze', gtoAnalyzeRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/health', healthRouter);

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
      console.log('[index] Mercado Pago webhook configurado em /api/payments/webhook/mercadopago');

      // Leaderboard auto-refresh every 30 minutes
      setInterval(async () => {
        try {
          await db.dbRecalculateLeaderboard();
          console.log('[index] Leaderboard cache refreshed');
        } catch (err) {
          console.error('[index] Leaderboard refresh failed:', err);
        }
      }, 30 * 60 * 1000);

      // Warm leaderboard route cache every 2 minutes for common queries
      setInterval(async () => {
        try {
          const base = process.env.BASE_URL || `http://localhost:${port}`;
          const metrics = ['lucro','roi','volume','wl'];
          for (const m of metrics) {
            const url = `${base}/api/leaderboard?metric=${m}&limit=100`;
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`warm failed: ${m} status ${resp.status}`);
          }
          console.log('[index] Warmed leaderboard cache for metrics: lucro, roi, volume, wl');
        } catch (err) {
          console.error('[index] Warm leaderboard cache failed:', err);
        }
      }, 2 * 60 * 1000);

      // Health strict logger every 5 minutes
      const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
      setInterval(async () => {
        try {
          const resp = await fetch(`${baseUrl}/api/health/strict`);
          const json: any = await resp.json().catch(() => ({}));
          const ok = !!json.ok;
          const dbOk = json?.results?.db?.ok;
          const lbOk = json?.results?.leaderboard?.ok;
          const ssOk = json?.results?.sharkscope?.ok;
          const summary = `health(strict): ok=${ok} db=${dbOk} lb=${lbOk} ss=${ssOk}`;
          if (ok) {
            console.log(`[index] ✅ ${summary}`);
          } else {
            console.error(`[index] ❌ ${summary}`);
          }
        } catch (err) {
          console.error('[index] ❌ health(strict) failed:', err);
        }
      }, 5 * 60 * 1000);
    });
  } catch (err) {
    console.error('[server] Failed to start:', err);
    process.exit(1);
  }
}

startServer();
