const { Pool } = require('pg');
require('dotenv').config();

async function createAppointmentTables() {
  console.log('🏗️ Creazione tabelle per il sistema di appuntamenti...');

  const pool = new Pool({
    host: 'tinkstudio.it',
    port: 5432,
    database: 'tinkstudio',
    user: 'postgres',
    password: process.env.REMOTE_DB_PASSWORD || 'tinkstudio_secure_password',
    ssl: false
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Enable pgcrypto extension if available for gen_random_uuid
    try {
      await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
      console.log('✅ Estensione pgcrypto abilitata');
    } catch (err) {
      console.log('⚠️ Impossibile abilitare pgcrypto, userò gen_random_uuid() nativo');
    }

    // Tatuatori table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tatuatori (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        nome text NOT NULL,
        attivo boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    console.log('✅ Tabella tatuatori creata');

    // Stanze table
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
    console.log('✅ Tabella stanze creata');

    // Appuntamenti table
    await client.query(`
      CREATE TABLE IF NOT EXISTS appuntamenti (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tatuatore_id uuid NOT NULL REFERENCES tatuatori(id),
        stanza_id uuid NOT NULL REFERENCES stanze(id),
        cliente_telefono text,
        cliente_nome text,
        orario_inizio timestamptz NOT NULL,
        durata_minuti integer NOT NULL DEFAULT 60,
        note text,
        stato text NOT NULL DEFAULT 'confermato' CHECK (stato IN ('confermato', 'cancellato', 'completato')),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    console.log('✅ Tabella appuntamenti creata');

    // Indexes for better performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tatuatori_attivo ON tatuatori(attivo);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_stanze_attivo ON stanze(attivo);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_stanze_no_overbooking ON stanze(no_overbooking);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_appuntamenti_tatuatore ON appuntamenti(tatuatore_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_appuntamenti_stanza ON appuntamenti(stanza_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_appuntamenti_orario ON appuntamenti(orario_inizio);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_appuntamenti_stato ON appuntamenti(stato);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_appuntamenti_cliente_telefono ON appuntamenti(cliente_telefono);`);

    console.log('✅ Indici creati');

    await client.query('COMMIT');
    console.log('🎉 Tutte le tabelle create con successo!');

    // Verifica tabelle create
    const tables = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name IN ('tatuatori', 'stanze', 'appuntamenti')
      ORDER BY table_name, ordinal_position
    `);

    console.log('\n📋 Struttura tabelle create:');
    tables.rows.forEach(row => {
      console.log(`  ${row.table_name}.${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    return true;

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Errore durante la creazione delle tabelle:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  createAppointmentTables()
    .then(success => {
      if (success) {
        console.log('\n✅ Setup completato con successo!');
        process.exit(0);
      } else {
        console.log('\n❌ Setup fallito!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Errore durante il setup:', error);
      process.exit(1);
    });
}

module.exports = { createAppointmentTables };