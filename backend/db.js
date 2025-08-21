const { Pool } = require('pg');

// Create a Pool only if a connection string or PG env variables are provided
function createPool() {
  const connectionString = process.env.DATABASE_URL;
  const hasDiscrete = process.env.PGHOST || process.env.PGDATABASE || process.env.PGUSER;
  if (!connectionString && !hasDiscrete) {
    return null; // DB not configured; backend will run with in-memory storage
  }
  const pool = new Pool(
    connectionString
      ? { connectionString, ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false }
      : {
          host: process.env.PGHOST || 'localhost',
          port: parseInt(process.env.PGPORT || '5432', 10),
          database: process.env.PGDATABASE || 'tinkstudio',
          user: process.env.PGUSER || 'postgres',
          password: process.env.PGPASSWORD || '',
          ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
        }
  );
  return pool;
}

const pool = createPool();

async function initSchema() {
  if (!pool) {
    console.log('[DB] No database configuration found. Skipping schema init (using in-memory storage).');
    return false;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Enable pgcrypto extension if available for gen_random_uuid
    await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

    // Customers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name text NOT NULL,
        last_name text NOT NULL,
        email text,
        phone text,
        birth_date date,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // Gift cards table
    await client.query(`
      CREATE TABLE IF NOT EXISTS gift_cards (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        status text NOT NULL CHECK (status IN ('draft','active','used','expired')),
        amount numeric(12,2) NOT NULL,
        currency text NOT NULL DEFAULT 'EUR',
        expires_at timestamptz,
        notes text,
        claim_token uuid UNIQUE,
        claim_token_expires_at timestamptz,
        claimed_at timestamptz,
        claimed_by_customer_id uuid REFERENCES customers(id),
        code text UNIQUE,
        first_name text,
        last_name text,
        email text,
        phone text,
        birth_date date,
        dedication text,
        consents jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_gift_cards_claim_token ON gift_cards(claim_token);`);

    await client.query('COMMIT');
    console.log('[DB] Schema initialized.');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[DB] Schema init failed:', err.message);
    return false;
  } finally {
    client.release();
  }
}

module.exports = { pool, initSchema };