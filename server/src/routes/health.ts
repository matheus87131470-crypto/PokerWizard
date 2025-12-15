import { Router, Request, Response } from 'express';
import db from '../services/database';
import { Pool } from 'pg';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const now = new Date();
  const databaseConfigured = !!process.env.DATABASE_URL;
  const pixInterval = Number(process.env.PIX_AUTO_CONFIRM_INTERVAL_MS || 1000);
  const pixThreshold = Number(process.env.PIX_AUTO_CONFIRM_THRESHOLD_MS || 10000);

  let dbStatus: 'ok' | 'unconfigured' | 'error' = 'unconfigured';
  let dbTime: string | null = null;

  if (databaseConfigured) {
    try {
      const pool: any = (db as any);
      if (pool && pool.dbGetAllUsers) {
        // Lightweight ping
        const ping = await (pool as any).dbGetAllUsers().catch(() => []);
      }
      // If init worked earlier, consider OK. Try a direct NOW() when possible.
      // Strong DB check: select NOW() using a fresh Pool connection
      try {
        const connectionString = process.env.DATABASE_URL as string;
        const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
        const q = await pool.query('SELECT NOW() as now');
        dbTime = q.rows[0]?.now?.toISOString?.() || String(q.rows[0]?.now);
        dbStatus = 'ok';
        await pool.end();
      } catch {
        dbStatus = 'error';
      }
    } catch {
      dbStatus = 'error';
    }
  }

  return res.json({
    ok: true,
    timestamp: now.toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    env: process.env.NODE_ENV || 'production',
    database: { configured: databaseConfigured, status: dbStatus, serverTime: dbTime },
    pixAutoConfirm: { intervalMs: pixInterval, thresholdMs: pixThreshold },
  });
});

// Strict checklist: ping critical routes and DB
router.get('/strict', async (_req: Request, res: Response) => {
  const results: Record<string, any> = {};
  const baseUrl = process.env.BASE_URL || '';
  // DB check
  try {
    const connectionString = process.env.DATABASE_URL as string;
    if (!connectionString) throw new Error('DATABASE_URL missing');
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
    const q = await pool.query('SELECT NOW() as now');
    results.db = { ok: true, now: q.rows[0]?.now?.toISOString?.() || String(q.rows[0]?.now) };
    await pool.end();
  } catch (err: any) {
    results.db = { ok: false, error: err?.message || String(err) };
  }

  // Leaderboard route
  try {
    const fetchUrl = `${baseUrl}/api/leaderboard?metric=lucro&limit=5`;
    const resp = await fetch(fetchUrl);
    results.leaderboard = { ok: resp.ok, status: resp.status };
  } catch (err: any) {
    results.leaderboard = { ok: false, error: err?.message || String(err) };
  }

  // SharkScope route (uses mock if no key)
  try {
    const fetchUrl = `${baseUrl}/api/sharkscope/player/test`;
    const resp = await fetch(fetchUrl);
    results.sharkscope = { ok: resp.ok, status: resp.status };
  } catch (err: any) {
    results.sharkscope = { ok: false, error: err?.message || String(err) };
  }

  // PIX auto-confirm config snapshot
  results.pix = {
    intervalMs: Number(process.env.PIX_AUTO_CONFIRM_INTERVAL_MS || 1000),
    thresholdMs: Number(process.env.PIX_AUTO_CONFIRM_THRESHOLD_MS || 10000),
  };

  const allOk = [results.db?.ok, results.leaderboard?.ok, results.sharkscope?.ok].every(Boolean);
  res.status(allOk ? 200 : 500).json({ ok: allOk, results });
});

export default router;
