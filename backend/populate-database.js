const { Pool } = require('pg');
require('dotenv').config();

const tatuatoriData = [
  { nome: 'zi frenk', attivo: true },
  { nome: 'zi nicol', attivo: true },
  { nome: 'giannino', attivo: true },
  { nome: 'o merican', attivo: true }
];

const stanzeData = [
  { nome: 'Stanza 1', attivo: true, no_overbooking: false },
  { nome: 'Stanza 2', attivo: true, no_overbooking: false },
  { nome: 'Stanza Sexy', attivo: true, no_overbooking: true },
  { nome: 'Stanza 3', attivo: true, no_overbooking: false }
];

async function populateDatabase() {
  console.log('🌱 Popolamento database con dati iniziali...');

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

    // Inserisci tatuatori
    console.log('👥 Inserimento tatuatori...');
    for (const tatuatore of tatuatoriData) {
      const result = await client.query(
        'INSERT INTO tatuatori (nome, attivo) VALUES ($1, $2) RETURNING id, nome, attivo, created_at',
        [tatuatore.nome, tatuatore.attivo]
      );
      console.log(`  ✅ ${result.rows[0].nome} (ID: ${result.rows[0].id})`);
    }

    // Inserisci stanze
    console.log('🏢 Inserimento stanze...');
    for (const stanza of stanzeData) {
      const result = await client.query(
        'INSERT INTO stanze (nome, attivo, no_overbooking) VALUES ($1, $2, $3) RETURNING id, nome, attivo, no_overbooking, created_at',
        [stanza.nome, stanza.attivo, stanza.no_overbooking]
      );
      console.log(`  ✅ ${result.rows[0].nome} (ID: ${result.rows[0].id})${stanza.no_overbooking ? ' - No Overbooking' : ''}`);
    }

    await client.query('COMMIT');
    console.log('🎉 Database popolato con successo!');

    // Verifica dati inseriti
    console.log('\n📊 Verifica dati inseriti:');

    const tatuatoriResult = await client.query('SELECT COUNT(*) as count FROM tatuatori WHERE attivo = true');
    console.log(`👥 Tatuatori attivi: ${tatuatoriResult.rows[0].count}`);

    const stanzeResult = await client.query('SELECT COUNT(*) as count FROM stanze WHERE attivo = true');
    console.log(`🏢 Stanze attive: ${stanzeResult.rows[0].count}`);

    const stanzeSexyResult = await client.query('SELECT COUNT(*) as count FROM stanze WHERE no_overbooking = true');
    console.log(`🚫 Stanze no-overbooking: ${stanzeSexyResult.rows[0].count}`);

    // Mostra dettagli
    const tatuatoriDetails = await client.query('SELECT nome, attivo FROM tatuatori ORDER BY nome');
    console.log('\n📋 Elenco tatuatori:');
    tatuatoriDetails.rows.forEach(t => {
      console.log(`  - ${t.nome} (${t.attivo ? 'attivo' : 'inattivo'})`);
    });

    const stanzeDetails = await client.query('SELECT nome, attivo, no_overbooking FROM stanze ORDER BY nome');
    console.log('\n📋 Elenco stanze:');
    stanzeDetails.rows.forEach(s => {
      console.log(`  - ${s.nome} (${s.attivo ? 'attiva' : 'inattiva'}${s.no_overbooking ? ', no overbooking' : ''})`);
    });

    return true;

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Errore durante il popolamento del database:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Verifica se i dati esistono già
async function checkExistingData() {
  console.log('🔍 Verifica dati esistenti...');

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
    const tatuatoriResult = await client.query('SELECT COUNT(*) as count FROM tatuatori');
    const stanzeResult = await client.query('SELECT COUNT(*) as count FROM stanze');

    const hasData = tatuatoriResult.rows[0].count > 0 || stanzeResult.rows[0].count > 0;

    if (hasData) {
      console.log(`⚠️ Database contiene già dati:`);
      console.log(`  👥 Tatuatori: ${tatuatoriResult.rows[0].count}`);
      console.log(`  🏢 Stanze: ${stanzeResult.rows[0].count}`);

      // Chiedi conferma per sovrascrivere
      console.log('\n❓ Vuoi sovrascrivere i dati esistenti? (y/N)');
      // Per ora procedi automaticamente, ma in futuro potresti voler chiedere conferma
    }

    return !hasData; // true se non ci sono dati, false se ci sono già

  } catch (err) {
    console.error('❌ Errore durante la verifica:', err.message);
    return false;
  } finally {
    client.release();
    await pool.end();
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  checkExistingData()
    .then(hasNoData => {
      if (hasNoData) {
        console.log('📝 Database vuoto, procedo con il popolamento...');
        return populateDatabase();
      } else {
        console.log('📝 Database contiene già dati, procedo con il popolamento sovrascrivendo...');
        return populateDatabase();
      }
    })
    .then(success => {
      if (success) {
        console.log('\n✅ Popolamento completato con successo!');
        process.exit(0);
      } else {
        console.log('\n❌ Popolamento fallito!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Errore durante il popolamento:', error);
      process.exit(1);
    });
}

module.exports = { populateDatabase, checkExistingData };