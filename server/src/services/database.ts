import { Pool } from 'pg';

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
        price DECIMAL(10,2) DEFAULT 5.90,
        credits INTEGER DEFAULT 5,
        usos_restantes INTEGER DEFAULT 5,
        status_plano VARCHAR(50) DEFAULT 'free',
        premium BOOLEAN DEFAULT false,
        premium_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
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
  } catch (err) {
    console.error('[database] Error initializing tables:', err);
    throw err;
  }
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

export default {
  initDatabase,
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
