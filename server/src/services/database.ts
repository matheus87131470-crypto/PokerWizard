import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';

// PostgreSQL connection - use DATABASE_URL from Render
const connectionString = process.env.DATABASE_URL;

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    if (!connectionString) {
      console.error('[database] ⚠️ DATABASE_URL não configurada! Dados serão perdidos ao reiniciar.');
      throw new Error('DATABASE_URL not configured');
    }
    
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false // Required for Render PostgreSQL
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    
    pool.on('error', (err) => {
      console.error('[database] Pool error:', err);
    });
    
    console.log('[database] ✅ PostgreSQL pool initialized');
  }
  return pool;
}

// Initialize database tables
export async function initDatabase(): Promise<void> {
  const db = getPool();
  
  try {
    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255),
        google_id VARCHAR(255),
        price DECIMAL(10,2) DEFAULT 3.50,
        credits INTEGER DEFAULT 7,
        usos_restantes INTEGER DEFAULT 7,
        free_credits INTEGER DEFAULT 7,
        usos_analise INTEGER DEFAULT 5,
        usos_trainer INTEGER DEFAULT 5,
        usos_jogadores INTEGER DEFAULT 5,
        status_plano VARCHAR(50) DEFAULT 'free',
        premium BOOLEAN DEFAULT false,
        premium_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Migrations para adicionar colunas em tabelas existentes
    await db.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS free_credits INTEGER DEFAULT 7
    `).catch(() => {});
    
    await db.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS usos_analise INTEGER DEFAULT 5
    `).catch(() => {});
    
    await db.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS usos_trainer INTEGER DEFAULT 5
    `).catch(() => {});
    
    await db.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS usos_jogadores INTEGER DEFAULT 5
    `).catch(() => {});
    
    // Create payments table
    await db.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        amount INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        br_code TEXT,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        confirmed_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    // Create index for faster queries
    await db.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id)`);
    
    console.log('[database] ✅ Tables initialized');

    // Initialize leaderboard-related tables
    await initLeaderboardTables();
    console.log('[database] ✅ Leaderboard tables initialized');
    
    // Initialize tournament sessions table for ROI tracking
    await initTournamentSessionsTable();
    console.log('[database] ✅ Tournament sessions table initialized');
  } catch (err) {
    console.error('[database] Error initializing tables:', err);
    throw err;
  }
}

// Leaderboard & results tables
async function initLeaderboardTables(): Promise<void> {
  const db = getPool();
  // Players directory (optional separate from users)
  await db.query(`
    CREATE TABLE IF NOT EXISTS players (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      country VARCHAR(100),
      platform VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Raw results per game/tournament
  await db.query(`
    CREATE TABLE IF NOT EXISTS results (
      id VARCHAR(255) PRIMARY KEY,
      player_id VARCHAR(255) NOT NULL,
      buyin INTEGER NOT NULL,
      prize INTEGER NOT NULL,
      date TIMESTAMP NOT NULL,
      game VARCHAR(100),
      platform VARCHAR(100),
      won BOOLEAN,
      created_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (player_id) REFERENCES players(id)
    )
  `);

  await db.query(`CREATE INDEX IF NOT EXISTS idx_results_player ON results(player_id)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_results_date ON results(date)`);

  // Cached leaderboard for fast API responses
  await db.query(`
    CREATE TABLE IF NOT EXISTS leaderboard_cache (
      player_id VARCHAR(255) PRIMARY KEY,
      lucro_total INTEGER NOT NULL,
      roi NUMERIC(10,2) NOT NULL,
      jogos INTEGER NOT NULL,
      wl_percent NUMERIC(10,2) NOT NULL,
      volume INTEGER NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (player_id) REFERENCES players(id)
    )
  `);
}

// Tournament sessions table for ROI tracking
async function initTournamentSessionsTable(): Promise<void> {
  const db = getPool();
  
  await db.query(`
    CREATE TABLE IF NOT EXISTS tournament_sessions (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      tipo_jogo VARCHAR(10) NOT NULL CHECK (tipo_jogo IN ('MTT', 'SNG')),
      buy_in DECIMAL(10,2) NOT NULL CHECK (buy_in > 0),
      premio DECIMAL(10,2) NOT NULL DEFAULT 0,
      data TIMESTAMP NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  await db.query(`CREATE INDEX IF NOT EXISTS idx_tournament_sessions_user ON tournament_sessions(user_id)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_tournament_sessions_date ON tournament_sessions(data)`);
}

// User operations
export async function dbCreateUser(user: {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  googleId?: string;
  price?: number;
  credits?: number;
  usosRestantes?: number;
  statusPlano?: string;
  premium?: boolean;
  premiumUntil?: Date | null;
}): Promise<void> {
  const db = getPool();
  await db.query(
    `INSERT INTO users (id, email, name, password_hash, google_id, price, credits, usos_restantes, status_plano, premium, premium_until)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       name = EXCLUDED.name,
       password_hash = COALESCE(EXCLUDED.password_hash, users.password_hash),
       google_id = COALESCE(EXCLUDED.google_id, users.google_id),
       price = EXCLUDED.price,
       credits = EXCLUDED.credits,
       usos_restantes = EXCLUDED.usos_restantes,
       status_plano = EXCLUDED.status_plano,
       premium = EXCLUDED.premium,
       premium_until = EXCLUDED.premium_until`,
    [
      user.id,
      user.email,
      user.name,
      user.passwordHash || null,
      user.googleId || null,
      user.price ?? 5.9,
      user.credits ?? 5,
      user.usosRestantes ?? 5,
      user.statusPlano ?? 'free',
      user.premium ?? false,
      user.premiumUntil || null
    ]
  );
}

export async function dbGetUserById(id: string): Promise<any | null> {
  const db = getPool();
  const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  if (result.rows.length === 0) return null;
  return mapUserFromDb(result.rows[0]);
}

export async function dbGetUserByEmail(email: string): Promise<any | null> {
  const db = getPool();
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) return null;
  return mapUserFromDb(result.rows[0]);
}

export async function dbGetUserByGoogleId(googleId: string): Promise<any | null> {
  const db = getPool();
  const result = await db.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
  if (result.rows.length === 0) return null;
  return mapUserFromDb(result.rows[0]);
}

export async function dbUpdateUser(id: string, updates: Partial<{
  credits: number;
  usosRestantes: number | null;
  freeCredits: number;
  usosAnalise: number;
  usosTrainer: number;
  usosJogadores: number;
  statusPlano: string;
  premium: boolean;
  premiumUntil: Date | null;
  passwordHash: string;
}>): Promise<void> {
  const db = getPool();
  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (updates.credits !== undefined) {
    setClauses.push(`credits = $${paramIndex++}`);
    values.push(updates.credits);
  }
  if (updates.usosRestantes !== undefined) {
    setClauses.push(`usos_restantes = $${paramIndex++}`);
    values.push(updates.usosRestantes);
  }
  if (updates.freeCredits !== undefined) {
    setClauses.push(`free_credits = $${paramIndex++}`);
    values.push(updates.freeCredits);
  }
  if (updates.usosAnalise !== undefined) {
    setClauses.push(`usos_analise = $${paramIndex++}`);
    values.push(updates.usosAnalise);
  }
  if (updates.usosTrainer !== undefined) {
    setClauses.push(`usos_trainer = $${paramIndex++}`);
    values.push(updates.usosTrainer);
  }
  if (updates.usosJogadores !== undefined) {
    setClauses.push(`usos_jogadores = $${paramIndex++}`);
    values.push(updates.usosJogadores);
  }
  if (updates.statusPlano !== undefined) {
    setClauses.push(`status_plano = $${paramIndex++}`);
    values.push(updates.statusPlano);
  }
  if (updates.premium !== undefined) {
    setClauses.push(`premium = $${paramIndex++}`);
    values.push(updates.premium);
  }
  if (updates.premiumUntil !== undefined) {
    setClauses.push(`premium_until = $${paramIndex++}`);
    values.push(updates.premiumUntil);
  }
  if (updates.passwordHash !== undefined) {
    setClauses.push(`password_hash = $${paramIndex++}`);
    values.push(updates.passwordHash);
  }
  
  if (setClauses.length === 0) return;
  
  values.push(id);
  await db.query(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
    values
  );
}

export async function dbGetAllUsers(): Promise<any[]> {
  const db = getPool();
  const result = await db.query('SELECT * FROM users ORDER BY created_at DESC');
  return result.rows.map(mapUserFromDb);
}

// Payment operations
export async function dbCreatePayment(payment: {
  id: string;
  userId: string;
  amount: number;
  status: string;
  brCode: string;
  expiresAt: Date;
}): Promise<void> {
  const db = getPool();
  await db.query(
    `INSERT INTO payments (id, user_id, amount, status, br_code, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [payment.id, payment.userId, payment.amount, payment.status, payment.brCode, payment.expiresAt]
  );
}

export async function dbGetPaymentById(id: string): Promise<any | null> {
  const db = getPool();
  const result = await db.query('SELECT * FROM payments WHERE id = $1', [id]);
  if (result.rows.length === 0) return null;
  return mapPaymentFromDb(result.rows[0]);
}

export async function dbUpdatePaymentStatus(id: string, status: string): Promise<void> {
  const db = getPool();
  const confirmedAt = status === 'confirmed' ? new Date() : null;
  await db.query(
    'UPDATE payments SET status = $1, confirmed_at = $2 WHERE id = $3',
    [status, confirmedAt, id]
  );
}

export async function dbGetPaymentsByUserId(userId: string): Promise<any[]> {
  const db = getPool();
  const result = await db.query('SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return result.rows.map(mapPaymentFromDb);
}

// Leaderboard calculations
export async function dbRecalculateLeaderboard(): Promise<void> {
  const db = getPool();
  // Calculate aggregates from results
  const agg = await db.query(`
    SELECT r.player_id,
           SUM(r.prize - r.buyin) AS lucro_total,
           CASE WHEN SUM(r.buyin) = 0 THEN 0
                ELSE (SUM(r.prize) - SUM(r.buyin)) * 100.0 / SUM(r.buyin)
           END AS roi,
           COUNT(*) AS jogos,
           CASE WHEN COUNT(*) = 0 THEN 0
                ELSE SUM(CASE WHEN r.won THEN 1 ELSE 0 END) * 100.0 / COUNT(*)
           END AS wl_percent,
           COUNT(*) AS volume
    FROM results r
    GROUP BY r.player_id
  `);

  // Upsert into cache
  for (const row of agg.rows) {
    await db.query(`
      INSERT INTO leaderboard_cache (player_id, lucro_total, roi, jogos, wl_percent, volume, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (player_id) DO UPDATE SET
        lucro_total = EXCLUDED.lucro_total,
        roi = EXCLUDED.roi,
        jogos = EXCLUDED.jogos,
        wl_percent = EXCLUDED.wl_percent,
        volume = EXCLUDED.volume,
        updated_at = NOW()
    `, [row.player_id, row.lucro_total, row.roi, row.jogos, row.wl_percent, row.volume]);
  }
}

export async function dbGetLeaderboard(metric: 'lucro'|'roi'|'volume'|'wl', limit = 100): Promise<any[]> {
  const db = getPool();
  const orderColumn = metric === 'lucro' ? 'lucro_total'
                    : metric === 'roi' ? 'roi'
                    : metric === 'volume' ? 'volume'
                    : 'wl_percent';
  const res = await db.query(
    `SELECT lc.*, p.name, p.country, p.platform
     FROM leaderboard_cache lc
     JOIN players p ON p.id = lc.player_id
     ORDER BY ${orderColumn} DESC
     LIMIT $1`,
    [limit]
  );
  return res.rows.map((row) => ({
    playerId: row.player_id,
    name: row.name,
    country: row.country,
    platform: row.platform,
    lucro: Number(row.lucro_total),
    roi: Number(row.roi),
    jogos: Number(row.jogos),
    wlPercent: Number(row.wl_percent),
    volume: Number(row.volume),
    updatedAt: new Date(row.updated_at),
  }));
}

// Seed sample players and results for initial leaderboard demo
export async function dbSeedLeaderboard(): Promise<void> {
  const db = getPool();
  const samples = [
    { name: 'CariocaKing', country: 'Brasil', platform: 'GGPoker' },
    { name: 'SambaPlayer', country: 'Brasil', platform: 'partypoker' },
    { name: 'VolumeHunter', country: 'Portugal', platform: 'JackPoker' },
    { name: 'BrazilianPro', country: 'Brasil', platform: 'PokerStars' },
    { name: 'Matheusac7', country: 'Portugal', platform: 'SWC Poker' },
  ];

  for (const s of samples) {
    // Check if player exists
    const existing = await db.query('SELECT id FROM players WHERE name = $1 LIMIT 1', [s.name]);
    const playerId = existing.rows[0]?.id || uuid();
    if (!existing.rows[0]) {
      await db.query('INSERT INTO players (id, name, country, platform) VALUES ($1, $2, $3, $4)', [playerId, s.name, s.country, s.platform]);
    }

    // Insert some results
    for (let i = 0; i < 25; i++) {
      const buyin = 50 + Math.floor(Math.random() * 150); // 50-200
      const roiFactor = (Math.random() * 2.2) - 0.6; // -0.6 to 1.6 approx
      const prize = Math.max(0, Math.round(buyin * (1 + roiFactor)));
      const won = prize > buyin;
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 180));
      const id = uuid();
      await db.query(
        'INSERT INTO results (id, player_id, buyin, prize, date, game, platform, won) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [id, playerId, buyin, prize, date, 'MTT', s.platform, won]
      );
    }
  }

  // Recalculate cache after seeding
  await dbRecalculateLeaderboard();
}

// Helper functions to map database rows to app objects
function mapUserFromDb(row: any): any {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    googleId: row.google_id,
    price: parseFloat(row.price),
    credits: row.credits,
    usosRestantes: row.usos_restantes,
    // Novo campo global de créditos (fallback para usosRestantes se não existir)
    freeCredits: row.free_credits ?? row.usos_restantes ?? 7,
    // Campos específicos por feature
    usosAnalise: row.usos_analise ?? 5,
    usosTrainer: row.usos_trainer ?? 5,
    usosJogadores: row.usos_jogadores ?? 5,
    statusPlano: row.status_plano,
    premium: row.premium,
    premiumUntil: row.premium_until ? new Date(row.premium_until) : null,
    createdAt: new Date(row.created_at),
  };
}

function mapPaymentFromDb(row: any): any {
  return {
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    status: row.status,
    brCode: row.br_code,
    expiresAt: new Date(row.expires_at),
    createdAt: new Date(row.created_at),
    confirmedAt: row.confirmed_at ? new Date(row.confirmed_at) : null,
  };
}

// Tournament session operations
export async function dbCreateTournamentSession(session: {
  id: string;
  userId: string;
  tipoJogo: 'MTT' | 'SNG';
  buyIn: number;
  premio: number;
  data: Date;
}): Promise<void> {
  const db = getPool();
  await db.query(
    `INSERT INTO tournament_sessions (id, user_id, tipo_jogo, buy_in, premio, data)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [session.id, session.userId, session.tipoJogo, session.buyIn, session.premio, session.data]
  );
}

export async function dbGetUserROI(userId: string): Promise<{
  totalBuyins: number;
  totalPremios: number;
  roi: number;
  numTorneios: number;
} | null> {
  const db = getPool();
  const result = await db.query(
    `SELECT 
       COUNT(*) as num_torneios,
       SUM(buy_in) as total_buyins,
       SUM(premio) as total_premios
     FROM tournament_sessions
     WHERE user_id = $1`,
    [userId]
  );
  
  const row = result.rows[0];
  const numTorneios = parseInt(row.num_torneios || '0');
  const totalBuyins = parseFloat(row.total_buyins || '0');
  const totalPremios = parseFloat(row.total_premios || '0');
  
  if (numTorneios === 0 || totalBuyins === 0) {
    return null;
  }
  
  const roi = ((totalPremios - totalBuyins) / totalBuyins) * 100;
  
  return {
    totalBuyins,
    totalPremios,
    roi,
    numTorneios
  };
}

export async function dbGetUserTournamentSessions(userId: string, limit = 50): Promise<any[]> {
  const db = getPool();
  const result = await db.query(
    `SELECT * FROM tournament_sessions
     WHERE user_id = $1
     ORDER BY data DESC
     LIMIT $2`,
    [userId, limit]
  );
  
  return result.rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    tipoJogo: row.tipo_jogo,
    buyIn: parseFloat(row.buy_in),
    premio: parseFloat(row.premio),
    data: new Date(row.data),
    createdAt: new Date(row.created_at)
  }));
}

export async function dbDeleteTournamentSession(sessionId: string, userId: string): Promise<void> {
  const db = getPool();
  await db.query(
    `DELETE FROM tournament_sessions WHERE id = $1 AND user_id = $2`,
    [sessionId, userId]
  );
}

export default {
  initDatabase,
  // leaderboard
  dbRecalculateLeaderboard,
  dbGetLeaderboard,
  dbSeedLeaderboard,
  dbCreateUser,
  dbGetUserById,
  dbGetUserByEmail,
  dbGetUserByGoogleId,
  dbUpdateUser,
  dbGetAllUsers,
  dbCreatePayment,
  dbGetPaymentById,
  dbUpdatePaymentStatus,
  dbGetPaymentsByUserId,
};
