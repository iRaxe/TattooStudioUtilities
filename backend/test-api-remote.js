const { Pool } = require('pg');
require('dotenv').config();

async function testRemoteAPIs() {
  console.log('🔗 Test API remote database...');

  const pool = new Pool({
    host: 'tinkstudio.it',
    port: 5432,
    database: 'tinkstudio',
    user: 'postgres',
    password: process.env.REMOTE_DB_PASSWORD || 'tinkstudio_secure_password',
    ssl: false
  });

  try {
    // Test tatuatori API
    console.log('\n👥 Test API Tatuatori:');
    const tatuatoriResult = await pool.query(
      'SELECT id, nome, attivo, created_at FROM tatuatori ORDER BY nome'
    );

    console.log(`Trovati ${tatuatoriResult.rows.length} tatuatori:`);
    tatuatoriResult.rows.forEach(t => {
      console.log(`  - ${t.nome} (${t.attivo ? 'attivo' : 'inattivo'}) - ID: ${t.id}`);
    });

    // Test stanze API
    console.log('\n🏢 Test API Stanze:');
    const stanzeResult = await pool.query(
      'SELECT id, nome, attivo, no_overbooking, created_at FROM stanze ORDER BY nome'
    );

    console.log(`Trovate ${stanzeResult.rows.length} stanze:`);
    stanzeResult.rows.forEach(s => {
      console.log(`  - ${s.nome} (${s.attivo ? 'attiva' : 'inattiva'}${s.no_overbooking ? ', no overbooking' : ''}) - ID: ${s.id}`);
    });

    // Test creazione appuntamento simulata
    console.log('\n📅 Test creazione appuntamento simulato:');
    const tatuatoreId = tatuatoriResult.rows[0]?.id;
    const stanzaId = stanzeResult.rows.find(s => s.no_overbooking)?.id || stanzeResult.rows[0]?.id;

    if (tatuatoreId && stanzaId) {
      // Verifica se ci sono conflitti per un orario di test
      const testTime = new Date();
      testTime.setHours(14, 0, 0, 0); // 14:00 oggi

      const conflictsResult = await pool.query(`
        SELECT COUNT(*) as conflicts
        FROM appuntamenti
        WHERE (tatuatore_id = $1 OR stanza_id = $2)
        AND stato != 'cancellato'
        AND orario_inizio < $3::timestamptz + interval '60 minutes'
        AND orario_inizio + interval '1 minute' * durata_minuti > $3::timestamptz
      `, [tatuatoreId, stanzaId, testTime]);

      const hasConflicts = parseInt(conflictsResult.rows[0].conflicts) > 0;
      console.log(`Orario di test: ${testTime.toISOString()}`);
      console.log(`Conflitti trovati: ${hasConflicts ? 'Sì' : 'No'}`);
      console.log(`Slot disponibile: ${!hasConflicts ? 'Sì' : 'No'}`);

      if (!hasConflicts) {
        console.log('✅ Sistema di appuntamenti funzionante!');
      } else {
        console.log('⚠️ Orario di test occupato');
      }
    } else {
      console.log('❌ Impossibile testare creazione appuntamento: dati mancanti');
    }

    // Test form creazione appuntamento
    console.log('\n📋 Test dati per form creazione appuntamento:');
    const formDataQuery = await pool.query(`
      SELECT
        t.id as tatuatore_id, t.nome as tatuatore_nome, t.attivo as tatuatore_attivo,
        s.id as stanza_id, s.nome as stanza_nome, s.attivo as stanza_attivo, s.no_overbooking
      FROM tatuatori t
      CROSS JOIN stanze s
      WHERE t.attivo = true AND s.attivo = true
      ORDER BY t.nome, s.nome
    `);

    if (formDataQuery.rows.length > 0) {
      console.log('✅ Dati per form disponibili:');
      console.log(`  Combinazioni tatuatore-stanza: ${formDataQuery.rows.length}`);

      const tatuatori = [...new Set(formDataQuery.rows.map(r => r.tatuatore_nome))];
      const stanze = [...new Set(formDataQuery.rows.map(r => r.stanza_nome))];

      console.log(`  Tatuatori attivi: ${tatuatori.join(', ')}`);
      console.log(`  Stanze attive: ${stanze.join(', ')}`);

      const noOverbookingRooms = formDataQuery.rows.filter(r => r.no_overbooking).map(r => r.stanza_nome);
      if (noOverbookingRooms.length > 0) {
        console.log(`  Stanze no-overbooking: ${noOverbookingRooms.join(', ')}`);
      }
    } else {
      console.log('❌ Nessun dato disponibile per il form');
    }

    await pool.end();

    console.log('\n🎉 Test completato con successo!');
    return {
      success: true,
      tatuatori: tatuatoriResult.rows,
      stanze: stanzeResult.rows,
      formReady: formDataQuery.rows.length > 0
    };

  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
    await pool.end();
    return { success: false, error: error.message };
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  testRemoteAPIs()
    .then(result => {
      console.log('\n📊 Risultato test:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Errore durante il test:', error);
      process.exit(1);
    });
}

module.exports = { testRemoteAPIs };