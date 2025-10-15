const { Pool } = require('pg');

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  const hasDiscrete = process.env.PGHOST || process.env.PGDATABASE || process.env.PGUSER;
  if (!connectionString && !hasDiscrete) {
    throw new Error('Database connection not configured. Set DATABASE_URL or PG* environment variables.');
  }
  return new Pool(
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
}

const pool = createPool();

async function initSchema() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name text NOT NULL,
        last_name text NOT NULL,
        email text,
        phone text UNIQUE NOT NULL,
        birth_date date,
        birth_place text,
        fiscal_code text,
        address text,
        city text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS birth_place text`);
    await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS fiscal_code text`);
    await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS address text`);
    await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS city text`);

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
        claimed_by_customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
        code text UNIQUE,
        first_name text,
        last_name text,
        email text,
        phone text,
        birth_date date,
        dedication text,
        consents jsonb,
        used_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await client.query('ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS claim_token_expires_at timestamptz');
    await client.query(
      'ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS claimed_by_customer_id uuid REFERENCES customers(id) ON DELETE SET NULL'
    );
    await client.query('ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS code text UNIQUE');
    await client.query('ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS first_name text');
    await client.query('ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS last_name text');
    await client.query('ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS email text');
    await client.query('ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS phone text');
    await client.query('ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS birth_date date');
    await client.query('ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS dedication text');
    await client.query('ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS consents jsonb');
    await client.query('ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS used_at timestamptz');

    await client.query(`
      CREATE TABLE IF NOT EXISTS tatuatori (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        nome text NOT NULL,
        attivo boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS stanze (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        nome text NOT NULL,
        no_overbooking boolean NOT NULL DEFAULT false,
        attivo boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS appuntamenti (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tatuatore_id uuid NOT NULL REFERENCES tatuatori(id) ON DELETE CASCADE,
        stanza_id uuid NOT NULL REFERENCES stanze(id) ON DELETE CASCADE,
        cliente_telefono text,
        cliente_nome text,
        orario_inizio timestamptz NOT NULL,
        durata_minuti integer NOT NULL DEFAULT 60,
        note text,
        stato text NOT NULL DEFAULT 'confermato' CHECK (stato IN ('confermato','cancellato','completato')),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS consensi (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
        gift_card_id uuid REFERENCES gift_cards(id) ON DELETE SET NULL,
        type text NOT NULL,
        phone text,
        payload jsonb NOT NULL,
        submitted_at timestamptz NOT NULL DEFAULT now(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await client.query('CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)');
    await client.query(`
      DO $$
      BEGIN
        ALTER TABLE customers ADD CONSTRAINT customers_phone_unique UNIQUE (phone);
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END;
      $$;
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_gift_cards_claim_token ON gift_cards(claim_token)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_appuntamenti_tatuatore ON appuntamenti(tatuatore_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_appuntamenti_stanza ON appuntamenti(stanza_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_appuntamenti_orario ON appuntamenti(orario_inizio)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_consensi_phone ON consensi(phone)');

    await client.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS trigger AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query('DROP TRIGGER IF EXISTS trg_customers_updated ON customers');
    await client.query('DROP TRIGGER IF EXISTS trg_gift_cards_updated ON gift_cards');
    await client.query('DROP TRIGGER IF EXISTS trg_tatuatori_updated ON tatuatori');
    await client.query('DROP TRIGGER IF EXISTS trg_stanze_updated ON stanze');
    await client.query('DROP TRIGGER IF EXISTS trg_appuntamenti_updated ON appuntamenti');
    await client.query('DROP TRIGGER IF EXISTS trg_consensi_updated ON consensi');

    await client.query(`CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION set_updated_at()`);
    await client.query(`CREATE TRIGGER trg_gift_cards_updated BEFORE UPDATE ON gift_cards FOR EACH ROW EXECUTE FUNCTION set_updated_at()`);
    await client.query(`CREATE TRIGGER trg_tatuatori_updated BEFORE UPDATE ON tatuatori FOR EACH ROW EXECUTE FUNCTION set_updated_at()`);
    await client.query(`CREATE TRIGGER trg_stanze_updated BEFORE UPDATE ON stanze FOR EACH ROW EXECUTE FUNCTION set_updated_at()`);
    await client.query(`CREATE TRIGGER trg_appuntamenti_updated BEFORE UPDATE ON appuntamenti FOR EACH ROW EXECUTE FUNCTION set_updated_at()`);
    await client.query(`CREATE TRIGGER trg_consensi_updated BEFORE UPDATE ON consensi FOR EACH ROW EXECUTE FUNCTION set_updated_at()`);

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    // eslint-disable-next-line no-console
    console.error('[DB] Schema init failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { pool, initSchema };
