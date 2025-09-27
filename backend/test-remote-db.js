const { Pool } = require('pg');
require('dotenv').config();

async function testRemoteDatabase() {
  console.log('🔍 Verifica configurazione database remoto...');

  // Prova a connetterti al database remoto di tinkstudio.it
  const remoteConfig = {
    host: 'tinkstudio.it',
    port: 5432,
    database: 'tinkstudio',
    user: 'postgres',
    password: process.env.REMOTE_DB_PASSWORD || 'tinkstudio_secure_password',
    ssl: false // Disabilita SSL completamente
  };

  console.log('Configurazione test:', {
    ...remoteConfig,
    password: '***'
  });

  const pool = new Pool(remoteConfig);

  try {
    const client = await pool.connect();
    console.log('✅ Connessione al database remoto riuscita!');

    // Verifica se esistono le tabelle
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('tatuatori', 'stanze', 'appuntamenti')
    `);

    console.log('📋 Tabelle esistenti:');
    if (tables.rows.length > 0) {
      tables.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('  Nessuna tabella per il sistema di appuntamenti trovata');
    }

    // Verifica se esistono tatuatori
    if (tables.rows.some(row => row.table_name === 'tatuatori')) {
      const tatuatori = await client.query('SELECT * FROM tatuatori ORDER BY nome');
      console.log(`👥 Tatuatori esistenti: ${tatuatori.rows.length}`);
      tatuatori.rows.forEach(t => {
        console.log(`  - ${t.nome} (${t.attivo ? 'attivo' : 'inattivo'})`);
      });
    }

    // Verifica se esistono stanze
    if (tables.rows.some(row => row.table_name === 'stanze')) {
      const stanze = await client.query('SELECT * FROM stanze ORDER BY nome');
      console.log(`🏢 Stanze esistenti: ${stanze.rows.length}`);
      stanze.rows.forEach(s => {
        console.log(`  - ${s.nome} (${s.attivo ? 'attiva' : 'inattiva'}${s.no_overbooking ? ', no overbooking' : ''})`);
      });
    }

    client.release();
    await pool.end();

    return {
      connected: true,
      tables: tables.rows.map(r => r.table_name),
      tatuatoriCount: tables.rows.some(row => row.table_name === 'tatuatori') ?
        (await pool.query('SELECT COUNT(*) as count FROM tatuatori')).rows[0].count : 0,
      stanzeCount: tables.rows.some(row => row.table_name === 'stanze') ?
        (await pool.query('SELECT COUNT(*) as count FROM stanze')).rows[0].count : 0
    };

  } catch (error) {
    console.error('❌ Errore di connessione:', error.message);

    // Se il database non esiste, proviamo a crearlo
    if (error.code === '3D000') { // database does not exist
      console.log('📝 Database non esiste, tentativo di creazione...');

      const rootPool = new Pool({
        host: 'tinkstudio.it',
        port: 5432,
        database: 'postgres', // Connect to default database
        user: 'postgres',
        password: process.env.REMOTE_DB_PASSWORD || 'tinkstudio_secure_password',
        ssl: false // Disabilita SSL completamente
      });

      try {
        await rootPool.query('CREATE DATABASE tinkstudio');
        console.log('✅ Database tinkstudio creato con successo!');
        await rootPool.end();
        return { connected: false, created: true };
      } catch (createError) {
        console.error('❌ Impossibile creare il database:', createError.message);
        await rootPool.end();
        return { connected: false, error: createError.message };
      }
    }

    await pool.end();
    return { connected: false, error: error.message };
  }
}

// Esegui il test se chiamato direttamente
if (require.main === module) {
  testRemoteDatabase()
    .then(result => {
      console.log('\n📊 Risultato test:', result);
      process.exit(result.connected ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Errore durante il test:', error);
      process.exit(1);
    });
}

module.exports = { testRemoteDatabase };