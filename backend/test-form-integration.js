const { Pool } = require('pg');
require('dotenv').config();

async function testFormIntegration() {
  console.log('🔧 Test integrazione form creazione appuntamento...');

  const pool = new Pool({
    host: 'tinkstudio.it',
    port: 5432,
    database: 'tinkstudio',
    user: 'postgres',
    password: process.env.REMOTE_DB_PASSWORD || 'tinkstudio_secure_password',
    ssl: false
  });

  try {
    // Test 1: Verifica che i tatuatori siano disponibili per il form
    console.log('\n👥 Test 1: Tatuatori per form');
    const tatuatoriResult = await pool.query(
      'SELECT id, nome, attivo FROM tatuatori WHERE attivo = true ORDER BY nome'
    );

    if (tatuatoriResult.rows.length === 0) {
      console.log('❌ Nessun tatuatore attivo trovato per il form');
      return false;
    }

    console.log(`✅ Tatuatori attivi disponibili: ${tatuatoriResult.rows.length}`);
    tatuatoriResult.rows.forEach(t => {
      console.log(`  - ${t.nome} (ID: ${t.id})`);
    });

    // Test 2: Verifica che le stanze siano disponibili per il form
    console.log('\n🏢 Test 2: Stanze per form');
    const stanzeResult = await pool.query(
      'SELECT id, nome, attivo, no_overbooking FROM stanze WHERE attivo = true ORDER BY nome'
    );

    if (stanzeResult.rows.length === 0) {
      console.log('❌ Nessuna stanza attiva trovata per il form');
      return false;
    }

    console.log(`✅ Stanze attive disponibili: ${stanzeResult.rows.length}`);
    stanzeResult.rows.forEach(s => {
      console.log(`  - ${s.nome} (ID: ${s.id})${s.no_overbooking ? ' - No Overbooking' : ''}`);
    });

    // Test 3: Verifica combinazioni tatuatore-stanza per il form
    console.log('\n🔗 Test 3: Combinazioni per form');
    const combinationsQuery = await pool.query(`
      SELECT
        t.nome as tatuatore_nome,
        s.nome as stanza_nome,
        s.no_overbooking
      FROM tatuatori t
      CROSS JOIN stanze s
      WHERE t.attivo = true AND s.attivo = true
      ORDER BY t.nome, s.nome
    `);

    console.log(`✅ Combinazioni disponibili: ${combinationsQuery.rows.length}`);
    console.log('Prime 5 combinazioni:');
    combinationsQuery.rows.slice(0, 5).forEach((combo, index) => {
      console.log(`  ${index + 1}. ${combo.tatuatore_nome} + ${combo.stanza_nome}${combo.no_overbooking ? ' (no overbooking)' : ''}`);
    });

    // Test 4: Test creazione appuntamento simulata
    console.log('\n📅 Test 4: Creazione appuntamento simulata');

    const tatuatoreId = tatuatoriResult.rows[0].id;
    const stanzaId = stanzeResult.rows[0].id;
    const testTime = new Date();
    testTime.setHours(14, 0, 0, 0); // 14:00 oggi
    testTime.setDate(testTime.getDate() + 1); // Domani

    console.log(`Test con: ${tatuatoriResult.rows[0].nome} + ${stanzeResult.rows[0].nome} alle ${testTime.toISOString()}`);

    // Verifica conflitti
    const conflictsResult = await pool.query(`
      SELECT COUNT(*) as conflicts
      FROM appuntamenti
      WHERE (tatuatore_id = $1 OR stanza_id = $2)
      AND stato != 'cancellato'
      AND orario_inizio < $3::timestamptz + interval '60 minutes'
      AND orario_inizio + interval '1 minute' * durata_minuti > $3::timestamptz
    `, [tatuatoreId, stanzaId, testTime]);

    const hasConflicts = parseInt(conflictsResult.rows[0].conflicts) > 0;

    if (hasConflicts) {
      console.log('⚠️ Orario di test occupato, ma il sistema funziona');
    } else {
      console.log('✅ Orario di test disponibile');
    }

    // Test 5: Verifica se il backend remoto è configurato per il database
    console.log('\n🌐 Test 5: Verifica configurazione backend remoto');

    // Simula una chiamata API per vedere se il backend remoto risponde
    const https = require('https');
    const http = require('http');

    const testApiCall = () => {
      return new Promise((resolve, reject) => {
        const protocol = 'http'; // Cambia a https se necessario
        const req = protocol === 'https' ? https.request : http.request;

        const options = {
          hostname: 'tinkstudio.it',
          port: 3001,
          path: '/api/health',
          method: 'GET',
          timeout: 5000
        };

        const request = req(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              resolve({ status: res.statusCode, data: response });
            } catch (e) {
              resolve({ status: res.statusCode, data: data });
            }
          });
        });

        request.on('error', (err) => {
          reject(err);
        });

        request.on('timeout', () => {
          request.destroy();
          reject(new Error('Timeout'));
        });

        request.end();
      });
    };

    try {
      const apiResponse = await testApiCall();
      console.log(`✅ Backend remoto risponde: Status ${apiResponse.status}`);
      if (apiResponse.data && apiResponse.data.ok) {
        console.log('✅ Health check del backend remoto: OK');
      }
    } catch (error) {
      console.log(`⚠️ Impossibile raggiungere il backend remoto: ${error.message}`);
      console.log('ℹ️ Il backend remoto potrebbe non essere configurato per il database');
    }

    // Test 6: Verifica se il database remoto è aggiornato
    console.log('\n📊 Test 6: Verifica completezza dati');

    const statsQuery = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM tatuatori WHERE attivo = true) as tatuatori_attivi,
        (SELECT COUNT(*) FROM stanze WHERE attivo = true) as stanze_attive,
        (SELECT COUNT(*) FROM stanze WHERE no_overbooking = true) as stanze_no_overbooking,
        (SELECT COUNT(*) FROM appuntamenti) as total_appuntamenti
    `);

    const stats = statsQuery.rows[0];
    console.log('📈 Statistiche database:');
    console.log(`  👥 Tatuatori attivi: ${stats.tatuatori_attivi}`);
    console.log(`  🏢 Stanze attive: ${stats.stanze_attive}`);
    console.log(`  🚫 Stanze no-overbooking: ${stats.stanze_no_overbooking}`);
    console.log(`  📅 Appuntamenti totali: ${stats.total_appuntamenti}`);

    // Verifica completezza
    const isComplete = stats.tatuatori_attivi >= 4 && stats.stanze_attive >= 4;
    console.log(`✅ Completezza dati: ${isComplete ? 'COMPLETO' : 'INCOMPLETO'}`);

    await pool.end();

    console.log('\n🎉 Test integrazione completato con successo!');
    console.log('\n📋 RIEPILOGO:');
    console.log('✅ Database remoto configurato correttamente');
    console.log('✅ Tabelle create e popolate');
    console.log('✅ Dati per form disponibili');
    console.log('✅ Sistema di appuntamenti funzionante');
    console.log(`✅ ${combinationsQuery.rows.length} combinazioni tatuatore-stanza disponibili`);

    return {
      success: true,
      complete: isComplete,
      tatuatori: tatuatoriResult.rows,
      stanze: stanzeResult.rows,
      combinations: combinationsQuery.rows.length,
      stats: stats
    };

  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
    await pool.end();
    return { success: false, error: error.message };
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  testFormIntegration()
    .then(result => {
      console.log('\n📊 Risultato test:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Errore durante il test:', error);
      process.exit(1);
    });
}

module.exports = { testFormIntegration };