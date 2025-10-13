require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool, initSchema } = require('./db');

if (!pool) {
  throw new Error('PostgreSQL connection is required. Configure DATABASE_URL or PG* environment variables.');
}

const app = express();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const query = (text, params = []) => pool.query(text, params);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:3000',
        'http://tinkstudio.it',
        'https://tinkstudio.it',
        'http://www.tinkstudio.it',
        'https://www.tinkstudio.it',
      ];
      if (origin.includes('tinkstudio.it') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Token'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(morgan('dev'));

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:5174';
const CLAIM_TOKEN_TTL_MINUTES = parseInt(process.env.CLAIM_TOKEN_TTL_MINUTES || '10080', 10);
const GIFT_CARD_VALIDITY_MONTHS = parseInt(process.env.GIFT_CARD_VALIDITY_MONTHS || '12', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const now = () => new Date();
const minutesFromNow = (mins) => new Date(Date.now() + mins * 60 * 1000);
const monthsFromDate = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};
const toISO = (value) => (value ? new Date(value).toISOString() : null);
const genCode = () => Math.random().toString(36).slice(2, 10).toUpperCase();

async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function generateUniqueCode(client) {
  const runner = client || pool;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = genCode();
    const { rows } = await runner.query('SELECT 1 FROM gift_cards WHERE code = $1', [code]);
    if (rows.length === 0) {
      return code;
    }
  }
  throw new Error('Unable to generate unique gift card code');
}

function isValidBusinessHours(dateTime) {
  const date = new Date(dateTime);
  const hour = date.getHours();
  return hour >= 9 && hour < 21;
}

function validateAppointmentData(data) {
  const errors = [];
  if (!data.tatuatore_id) errors.push('Tatuatore obbligatorio');
  if (!data.stanza_id) errors.push('Stanza obbligatoria');
  if (!data.orario_inizio) errors.push('Orario inizio obbligatorio');
  if (!data.durata_minuti || data.durata_minuti < 15) errors.push('Durata minima 15 minuti');
  if (data.orario_inizio && !isValidBusinessHours(data.orario_inizio)) {
    errors.push("Orario fuori dall'orario di lavoro (9:00-21:00)");
  }
  return errors;
}

async function findConflictingAppointments({ stanzaId, tatuatoreId, startTime, durationMinutes, excludeId = null }) {
  const newStart = new Date(startTime);
  const newEnd = new Date(newStart.getTime() + durationMinutes * 60000);
  const params = [stanzaId, tatuatoreId, newEnd, newStart];
  let queryText = `
    SELECT a.id, a.tatuatore_id, a.stanza_id, a.orario_inizio, a.durata_minuti, a.stato,
           t.nome AS tatuatore_nome,
           s.nome AS stanza_nome,
           s.no_overbooking
    FROM appuntamenti a
    JOIN tatuatori t ON t.id = a.tatuatore_id
    JOIN stanze s ON s.id = a.stanza_id
    WHERE a.stato <> 'cancellato'
      AND (a.stanza_id = $1 OR a.tatuatore_id = $2)
      AND a.orario_inizio < $3
      AND (a.orario_inizio + make_interval(mins => a.durata_minuti)) > $4
  `;
  if (excludeId) {
    params.push(excludeId);
    queryText += ' AND a.id <> $5';
  }
  const { rows } = await query(queryText, params);
  return rows.map((row) => ({
    appointment_id: row.id,
    tatuatore_nome: row.tatuatore_nome,
    stanza_nome: row.stanza_nome,
    stanza_id: row.stanza_id,
    tatuatore_id: row.tatuatore_id,
    orario_inizio: toISO(row.orario_inizio),
    durata_minuti: row.durata_minuti,
    stato: row.stato,
    no_overbooking: row.no_overbooking,
  }));
}

function requireAdmin(req, res, next) {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post(
  '/api/admin/login',
  asyncHandler(async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const tokenPayload = { username, role: 'admin', iat: Math.floor(Date.now() / 1000) };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.json({ token, expires_in: JWT_EXPIRES_IN, user: { username, role: 'admin' } });
  })
);
app.get(
  '/api/admin/tatuatori',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      'SELECT id, nome, attivo, created_at, updated_at FROM tatuatori ORDER BY created_at DESC'
    );
    res.json({
      tatuatori: rows.map((row) => ({
        id: row.id,
        nome: row.nome,
        attivo: row.attivo,
        created_at: toISO(row.created_at),
        updated_at: toISO(row.updated_at),
      })),
    });
  })
);

app.post(
  '/api/admin/tatuatori',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { nome, attivo = true } = req.body || {};
    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'Nome tatuatore obbligatorio' });
    }
    const { rows } = await query(
      `INSERT INTO tatuatori (id, nome, attivo, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, nome, attivo, created_at`,
      [uuidv4(), nome.trim(), !!attivo]
    );
    const tatuatore = rows[0];
    res.status(201).json({
      id: tatuatore.id,
      nome: tatuatore.nome,
      attivo: tatuatore.attivo,
      created_at: toISO(tatuatore.created_at),
    });
  })
);

app.put(
  '/api/admin/tatuatori/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { nome, attivo } = req.body || {};
    const fields = [];
    const values = [];
    if (nome !== undefined) {
      if (!nome || !nome.trim()) {
        return res.status(400).json({ error: 'Nome tatuatore obbligatorio' });
      }
      values.push(nome.trim());
      fields.push(`nome = $${values.length}`);
    }
    if (attivo !== undefined) {
      values.push(!!attivo);
      fields.push(`attivo = $${values.length}`);
    }
    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nessun campo da aggiornare' });
    }
    values.push(id);
    const { rows } = await query(
      `UPDATE tatuatori SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING id, nome, attivo, updated_at`,
      values
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Tatuatore non trovato' });
    }
    const tatuatore = rows[0];
    res.json({
      id: tatuatore.id,
      nome: tatuatore.nome,
      attivo: tatuatore.attivo,
      updated_at: toISO(tatuatore.updated_at),
    });
  })
);

app.delete(
  '/api/admin/tatuatori/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rows: appointmentCount } = await query(
      `SELECT COUNT(*)::int AS total
       FROM appuntamenti
       WHERE tatuatore_id = $1 AND stato <> 'cancellato'`,
      [id]
    );
    if (appointmentCount[0].total > 0) {
      return res.status(400).json({ error: 'Impossibile eliminare tatuatore con appuntamenti esistenti' });
    }
    const { rows } = await query(
      'DELETE FROM tatuatori WHERE id = $1 RETURNING id, nome',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Tatuatore non trovato' });
    }
    res.json({
      success: true,
      message: 'Tatuatore eliminato con successo',
      deletedTatuatore: rows[0],
    });
  })
);

app.get(
  '/api/admin/stanze',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      'SELECT id, nome, no_overbooking, attivo, created_at, updated_at FROM stanze ORDER BY created_at DESC'
    );
    res.json({
      stanze: rows.map((row) => ({
        id: row.id,
        nome: row.nome,
        no_overbooking: row.no_overbooking,
        attivo: row.attivo,
        created_at: toISO(row.created_at),
        updated_at: toISO(row.updated_at),
      })),
    });
  })
);

app.post(
  '/api/admin/stanze',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { nome, no_overbooking = false, attivo = true } = req.body || {};
    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'Nome stanza obbligatorio' });
    }
    const { rows } = await query(
      `INSERT INTO stanze (id, nome, no_overbooking, attivo, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, nome, no_overbooking, attivo, created_at`,
      [uuidv4(), nome.trim(), !!no_overbooking, !!attivo]
    );
    const stanza = rows[0];
    res.status(201).json({
      id: stanza.id,
      nome: stanza.nome,
      no_overbooking: stanza.no_overbooking,
      attivo: stanza.attivo,
      created_at: toISO(stanza.created_at),
    });
  })
);

app.put(
  '/api/admin/stanze/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { nome, no_overbooking, attivo } = req.body || {};
    const fields = [];
    const values = [];
    if (nome !== undefined) {
      if (!nome || !nome.trim()) {
        return res.status(400).json({ error: 'Nome stanza obbligatorio' });
      }
      values.push(nome.trim());
      fields.push(`nome = $${values.length}`);
    }
    if (no_overbooking !== undefined) {
      values.push(!!no_overbooking);
      fields.push(`no_overbooking = $${values.length}`);
    }
    if (attivo !== undefined) {
      values.push(!!attivo);
      fields.push(`attivo = $${values.length}`);
    }
    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nessun campo da aggiornare' });
    }
    values.push(id);
    const { rows } = await query(
      `UPDATE stanze SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING id, nome, no_overbooking, attivo, updated_at`,
      values
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Stanza non trovata' });
    }
    const stanza = rows[0];
    res.json({
      id: stanza.id,
      nome: stanza.nome,
      no_overbooking: stanza.no_overbooking,
      attivo: stanza.attivo,
      updated_at: toISO(stanza.updated_at),
    });
  })
);

app.delete(
  '/api/admin/stanze/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rows: appointmentCount } = await query(
      `SELECT COUNT(*)::int AS total
       FROM appuntamenti
       WHERE stanza_id = $1 AND stato <> 'cancellato'`,
      [id]
    );
    if (appointmentCount[0].total > 0) {
      return res.status(400).json({ error: 'Impossibile eliminare stanza con appuntamenti esistenti' });
    }
    const { rows } = await query('DELETE FROM stanze WHERE id = $1 RETURNING id, nome', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Stanza non trovata' });
    }
    res.json({
      success: true,
      message: 'Stanza eliminata con successo',
      deletedStanza: rows[0],
    });
  })
);

app.get(
  '/api/admin/appuntamenti',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { tatuatore_id, stanza_id, stato, data_inizio, data_fine, cliente_telefono } = req.query;
    const conditions = [];
    const values = [];
    if (tatuatore_id) {
      values.push(tatuatore_id);
      conditions.push(`a.tatuatore_id = $${values.length}`);
    }
    if (stanza_id) {
      values.push(stanza_id);
      conditions.push(`a.stanza_id = $${values.length}`);
    }
    if (stato) {
      values.push(stato);
      conditions.push(`a.stato = $${values.length}`);
    }
    if (cliente_telefono) {
      values.push(`%${cliente_telefono}%`);
      conditions.push(`a.cliente_telefono ILIKE $${values.length}`);
    }
    if (data_inizio) {
      values.push(new Date(data_inizio));
      conditions.push(`a.orario_inizio >= $${values.length}`);
    }
    if (data_fine) {
      values.push(new Date(data_fine));
      conditions.push(`(a.orario_inizio + make_interval(mins => a.durata_minuti)) <= $${values.length}`);
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT a.*, t.nome AS tatuatore_nome, s.nome AS stanza_nome
       FROM appuntamenti a
       JOIN tatuatori t ON t.id = a.tatuatore_id
       JOIN stanze s ON s.id = a.stanza_id
       ${whereClause}
       ORDER BY a.orario_inizio DESC`,
      values
    );
    res.json({
      appuntamenti: rows.map((row) => ({
        id: row.id,
        tatuatore_id: row.tatuatore_id,
        tatuatore_nome: row.tatuatore_nome,
        stanza_id: row.stanza_id,
        stanza_nome: row.stanza_nome,
        cliente_telefono: row.cliente_telefono,
        cliente_nome: row.cliente_nome,
        orario_inizio: toISO(row.orario_inizio),
        durata_minuti: row.durata_minuti,
        note: row.note,
        stato: row.stato,
        created_at: toISO(row.created_at),
        updated_at: toISO(row.updated_at),
      })),
    });
  })
);

app.post(
  '/api/admin/appuntamenti',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { tatuatore_id, stanza_id, cliente_telefono, cliente_nome, orario_inizio, durata_minuti = 60, note } =
      req.body || {};
    const appointmentData = {
      tatuatore_id,
      stanza_id,
      cliente_telefono,
      cliente_nome,
      orario_inizio,
      durata_minuti,
      note,
      stato: 'confermato',
    };
    const validationErrors = validateAppointmentData(appointmentData);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Dati appuntamento non validi', details: validationErrors });
    }
    const conflicts = await findConflictingAppointments({
      stanzaId: stanza_id,
      tatuatoreId: tatuatore_id,
      startTime: orario_inizio,
      durationMinutes: durata_minuti,
    });
    const hasBlockingConflicts = conflicts.some((conflict) => conflict.no_overbooking);
    if (hasBlockingConflicts) {
      return res.status(409).json({
        error: 'Conflitto di prenotazione',
        conflicts,
        message: 'La stanza "sexy" non permette sovrapposizioni',
      });
    }
    const { rows } = await query(
      `INSERT INTO appuntamenti (id, tatuatore_id, stanza_id, cliente_telefono, cliente_nome, orario_inizio, durata_minuti, note, stato, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'confermato', NOW(), NOW())
       RETURNING *`,
      [uuidv4(), tatuatore_id, stanza_id, cliente_telefono || null, cliente_nome || null, new Date(orario_inizio), durata_minuti, note || null]
    );
    const appointment = rows[0];
    res.status(201).json({
      id: appointment.id,
      tatuatore_id: appointment.tatuatore_id,
      stanza_id: appointment.stanza_id,
      cliente_telefono: appointment.cliente_telefono,
      cliente_nome: appointment.cliente_nome,
      orario_inizio: toISO(appointment.orario_inizio),
      durata_minuti: appointment.durata_minuti,
      note: appointment.note,
      stato: appointment.stato,
      created_at: toISO(appointment.created_at),
      conflicts: conflicts.length > 0 ? conflicts : undefined,
    });
  })
);

app.get(
  '/api/admin/appuntamenti/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rows } = await query(
      `SELECT a.*, t.nome AS tatuatore_nome, s.nome AS stanza_nome
       FROM appuntamenti a
       JOIN tatuatori t ON t.id = a.tatuatore_id
       JOIN stanze s ON s.id = a.stanza_id
       WHERE a.id = $1`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Appuntamento non trovato' });
    }
    const row = rows[0];
    res.json({
      id: row.id,
      tatuatore_id: row.tatuatore_id,
      tatuatore_nome: row.tatuatore_nome,
      stanza_id: row.stanza_id,
      stanza_nome: row.stanza_nome,
      cliente_telefono: row.cliente_telefono,
      cliente_nome: row.cliente_nome,
      orario_inizio: toISO(row.orario_inizio),
      durata_minuti: row.durata_minuti,
      note: row.note,
      stato: row.stato,
      created_at: toISO(row.created_at),
      updated_at: toISO(row.updated_at),
    });
  })
);

app.put(
  '/api/admin/appuntamenti/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { tatuatore_id, stanza_id, cliente_telefono, cliente_nome, orario_inizio, durata_minuti, note, stato } =
      req.body || {};
    const { rows: existingRows } = await query('SELECT * FROM appuntamenti WHERE id = $1', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Appuntamento non trovato' });
    }
    const existing = existingRows[0];
    const updateData = {
      tatuatore_id: tatuatore_id !== undefined ? tatuatore_id : existing.tatuatore_id,
      stanza_id: stanza_id !== undefined ? stanza_id : existing.stanza_id,
      cliente_telefono: cliente_telefono !== undefined ? cliente_telefono : existing.cliente_telefono,
      cliente_nome: cliente_nome !== undefined ? cliente_nome : existing.cliente_nome,
      orario_inizio: orario_inizio !== undefined ? orario_inizio : existing.orario_inizio,
      durata_minuti: durata_minuti !== undefined ? durata_minuti : existing.durata_minuti,
      note: note !== undefined ? note : existing.note,
      stato: stato !== undefined ? stato : existing.stato,
    };
    const validationErrors = validateAppointmentData(updateData);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: 'Dati appuntamento non validi', details: validationErrors });
    }
    const conflicts = await findConflictingAppointments({
      stanzaId: updateData.stanza_id,
      tatuatoreId: updateData.tatuatore_id,
      startTime: updateData.orario_inizio,
      durationMinutes: updateData.durata_minuti,
      excludeId: id,
    });
    const hasBlockingConflicts = conflicts.some((conflict) => conflict.no_overbooking);
    if (hasBlockingConflicts) {
      return res.status(409).json({
        error: 'Conflitto di prenotazione',
        conflicts,
        message: 'La stanza "sexy" non permette sovrapposizioni',
      });
    }
    const updateFields = [];
    const values = [];
    Object.entries(updateData).forEach(([key, value]) => {
      const normalized = key === 'orario_inizio' ? new Date(value) : value;
      values.push(normalized);
      updateFields.push(`${key} = $${values.length}`);
    });
    values.push(id);
    const { rows } = await query(
      `UPDATE appuntamenti SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );
    const appointment = rows[0];
    const { rows: details } = await query(
      `SELECT t.nome AS tatuatore_nome, s.nome AS stanza_nome FROM appuntamenti a
       JOIN tatuatori t ON t.id = a.tatuatore_id
       JOIN stanze s ON s.id = a.stanza_id
       WHERE a.id = $1`,
      [id]
    );
    res.json({
      id: appointment.id,
      tatuatore_id: appointment.tatuatore_id,
      tatuatore_nome: details[0]?.tatuatore_nome || null,
      stanza_id: appointment.stanza_id,
      stanza_nome: details[0]?.stanza_nome || null,
      cliente_telefono: appointment.cliente_telefono,
      cliente_nome: appointment.cliente_nome,
      orario_inizio: toISO(appointment.orario_inizio),
      durata_minuti: appointment.durata_minuti,
      note: appointment.note,
      stato: appointment.stato,
      updated_at: toISO(appointment.updated_at),
    });
  })
);

app.delete(
  '/api/admin/appuntamenti/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rows } = await query(
      'DELETE FROM appuntamenti WHERE id = $1 RETURNING id, tatuatore_id, stanza_id, orario_inizio',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Appuntamento non trovato' });
    }
    res.json({
      success: true,
      message: 'Appuntamento eliminato con successo',
      deletedAppointment: {
        id: rows[0].id,
        tatuatore_id: rows[0].tatuatore_id,
        stanza_id: rows[0].stanza_id,
        orario_inizio: toISO(rows[0].orario_inizio),
      },
    });
  })
);

app.get(
  '/api/admin/appuntamenti/cliente/:telefono',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { telefono } = req.params;
    const { rows } = await query(
      `SELECT a.*, t.nome AS tatuatore_nome, s.nome AS stanza_nome
       FROM appuntamenti a
       JOIN tatuatori t ON t.id = a.tatuatore_id
       JOIN stanze s ON s.id = a.stanza_id
       WHERE a.cliente_telefono = $1
       ORDER BY a.orario_inizio DESC`,
      [telefono]
    );
    res.json({
      appointments: rows.map((row) => ({
        id: row.id,
        tatuatore_id: row.tatuatore_id,
        tatuatore_nome: row.tatuatore_nome,
        stanza_id: row.stanza_id,
        stanza_nome: row.stanza_nome,
        cliente_telefono: row.cliente_telefono,
        cliente_nome: row.cliente_nome,
        orario_inizio: toISO(row.orario_inizio),
        durata_minuti: row.durata_minuti,
        note: row.note,
        stato: row.stato,
        created_at: toISO(row.created_at),
        updated_at: toISO(row.updated_at),
      })),
    });
  })
);
async function upsertCustomerByPhone(client, data) {
  const {
    firstName,
    lastName,
    email = null,
    phone,
    birthDate = null,
    birthPlace = null,
    fiscalCode = null,
    address = null,
    city = null,
  } = data;
  if (!phone) {
    throw new Error('Phone is required for customer upsert');
  }
  const params = [
    firstName.trim(),
    lastName.trim(),
    email ? email.trim() : null,
    phone.trim(),
    birthDate,
    birthPlace,
    fiscalCode,
    address,
    city,
  ];
  const result = await client.query(
    `INSERT INTO customers (id, first_name, last_name, email, phone, birth_date, birth_place, fiscal_code, address, city, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
     ON CONFLICT (phone)
     DO UPDATE SET
       first_name = EXCLUDED.first_name,
       last_name = EXCLUDED.last_name,
       email = COALESCE(EXCLUDED.email, customers.email),
       birth_date = COALESCE(EXCLUDED.birth_date, customers.birth_date),
       birth_place = COALESCE(EXCLUDED.birth_place, customers.birth_place),
       fiscal_code = COALESCE(EXCLUDED.fiscal_code, customers.fiscal_code),
       address = COALESCE(EXCLUDED.address, customers.address),
       city = COALESCE(EXCLUDED.city, customers.city),
       updated_at = NOW()
     RETURNING id`,
    params
  );
  return result.rows[0].id;
}

app.post(
  '/api/admin/gift-cards/drafts',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { amount, currency = 'EUR', expires_at = null, notes = null } = req.body || {};
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    const id = uuidv4();
    const claim_token = uuidv4();
    const createdAt = now();
    const calculatedExpiresAt = monthsFromDate(createdAt, GIFT_CARD_VALIDITY_MONTHS);
    const claim_token_expires_at = minutesFromNow(CLAIM_TOKEN_TTL_MINUTES);
    const { rows } = await query(
      `INSERT INTO gift_cards (id, status, amount, currency, expires_at, notes, claim_token, claim_token_expires_at, created_at, updated_at)
       VALUES ($1, 'draft', $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, amount, claim_token, expires_at, claim_token_expires_at`,
      [id, amount, currency, expires_at ? new Date(expires_at) : calculatedExpiresAt, notes, claim_token, claim_token_expires_at]
    );
    const draft = rows[0];
    const claim_url = `${PUBLIC_BASE_URL}/gift/claim/${draft.claim_token}`;
    res.status(201).json({
      draft_id: draft.id,
      amount: Number(draft.amount),
      claim_token: draft.claim_token,
      expires_at: toISO(draft.expires_at),
      claim_url,
      claim_token_expires_at: toISO(draft.claim_token_expires_at),
    });
  })
);

app.post(
  '/api/admin/gift-cards/complete',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { firstName, lastName, phone, amount, currency = 'EUR', expires_at = null, notes = null } = req.body || {};
    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ error: 'First name is required' });
    }
    if (!lastName || !lastName.trim()) {
      return res.status(400).json({ error: 'Last name is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Phone is required' });
    }
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    const giftCard = await withTransaction(async (client) => {
      const customerId = await upsertCustomerByPhone(client, {
        firstName,
        lastName,
        phone,
      });
      const code = await generateUniqueCode(client);
      const expiresAt = expires_at ? new Date(expires_at) : monthsFromDate(now(), GIFT_CARD_VALIDITY_MONTHS);
      const { rows } = await client.query(
        `INSERT INTO gift_cards (
          id, status, amount, currency, expires_at, notes,
          claim_token, claim_token_expires_at, claimed_at, claimed_by_customer_id,
          code, first_name, last_name, email, phone, birth_date, dedication, consents, created_at, updated_at
        ) VALUES (
          $1, 'active', $2, $3, $4, $5,
          NULL, NULL, NOW(), $6,
          $7, $8, $9, NULL, $10, NULL, NULL, NULL, NOW(), NOW()
        )
        RETURNING id, amount, code, expires_at, first_name, last_name, phone`,
        [uuidv4(), amount, currency, expiresAt, notes, customerId, code, firstName.trim(), lastName.trim(), phone.trim()]
      );
      return rows[0];
    });
    const redeem_url = `${PUBLIC_BASE_URL}/gift/landing/${giftCard.id}`;
    res.status(201).json({
      gift_card_id: giftCard.id,
      amount: Number(giftCard.amount),
      code: giftCard.code,
      expires_at: toISO(giftCard.expires_at),
      redeem_url,
      customer: {
        first_name: giftCard.first_name,
        last_name: giftCard.last_name,
        phone: giftCard.phone,
      },
    });
  })
);

function mapGiftCard(row) {
  return {
    id: row.id,
    status: row.status,
    amount: Number(row.amount),
    currency: row.currency,
    code: row.code,
    claim_token: row.claim_token,
    customer_name: row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : null,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    phone: row.phone,
    birth_date: row.birth_date ? row.birth_date.toISOString().split('T')[0] : null,
    created_at: toISO(row.created_at),
    claimed_at: toISO(row.claimed_at),
    expires_at: toISO(row.expires_at),
  };
}

app.get(
  '/api/admin/gift-cards',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { rows } = await query('SELECT * FROM gift_cards ORDER BY created_at DESC');
    res.set({ 'Cache-Control': 'no-cache, no-store, must-revalidate', Pragma: 'no-cache', Expires: '0' });
    res.json({ giftCards: rows.map(mapGiftCard) });
  })
);

app.get(
  '/api/admin/gift-cards/drafts',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT id, status, amount, currency, claim_token, created_at, expires_at, claim_token_expires_at
       FROM gift_cards
       WHERE status = 'draft'
       ORDER BY created_at DESC`
    );
    res.json({
      drafts: rows.map((row) => ({
        id: row.id,
        status: row.status,
        amount: Number(row.amount),
        currency: row.currency,
        claim_token: row.claim_token,
        created_at: toISO(row.created_at),
        expires_at: toISO(row.expires_at),
        claim_token_expires_at: toISO(row.claim_token_expires_at),
      })),
    });
  })
);

app.get(
  '/api/admin/gift-cards/drafts/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rows } = await query(
      `SELECT id, status, amount, currency, expires_at, claim_token_expires_at, claim_token, claimed_at
       FROM gift_cards
       WHERE id = $1`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    const draft = rows[0];
    res.json({
      id: draft.id,
      status: draft.status,
      amount: Number(draft.amount),
      currency: draft.currency,
      expires_at: toISO(draft.expires_at),
      claim_token_expires_at: toISO(draft.claim_token_expires_at),
      claim_token_used: !!draft.claimed_at,
    });
  })
);

app.get(
  '/api/admin/gift-cards/stats',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { rows } = await query('SELECT status, amount, expires_at FROM gift_cards');
    const stats = {
      total: rows.length,
      draft: 0,
      active: 0,
      used: 0,
      expired: 0,
      expiredByDate: 0,
      totalRevenue: 0,
      pendingRevenue: 0,
      usedRevenue: 0,
    };
    const nowDate = now();
    rows.forEach((row) => {
      const amount = Number(row.amount);
      stats[row.status] = (stats[row.status] || 0) + 1;
      if (['draft', 'active', 'used'].includes(row.status)) {
        stats.totalRevenue += amount;
      }
      if (row.status === 'draft') {
        stats.pendingRevenue += amount;
      }
      if (row.status === 'used') {
        stats.usedRevenue += amount;
      }
      if (row.expires_at && new Date(row.expires_at) < nowDate) {
        stats.expiredByDate += 1;
      }
    });
    res.json(stats);
  })
);

app.delete(
  '/api/admin/gift-cards/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rows } = await query('SELECT * FROM gift_cards WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Gift card not found' });
    }
    const gc = rows[0];
    if (!['draft', 'active', 'used'].includes(gc.status)) {
      return res.status(400).json({ error: 'Can only delete draft, active, or used gift cards', currentStatus: gc.status });
    }
    await query('DELETE FROM gift_cards WHERE id = $1', [id]);
    res.json({
      success: true,
      message: 'Gift card deleted successfully',
      deletedCard: {
        id: gc.id,
        status: gc.status,
        amount: Number(gc.amount),
        code: gc.code,
      },
    });
  })
);

app.put(
  '/api/admin/gift-cards/:id/renew',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const newExpiresAt = monthsFromDate(now(), GIFT_CARD_VALIDITY_MONTHS);
    const { rows } = await query(
      `UPDATE gift_cards
       SET expires_at = $1,
           status = CASE WHEN status = 'expired' THEN CASE WHEN claimed_at IS NULL THEN 'draft' ELSE 'active' END ELSE status END,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, expires_at, status`,
      [newExpiresAt, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Gift card not found' });
    }
    const gc = rows[0];
    res.json({
      id: gc.id,
      expires_at: toISO(gc.expires_at),
      status: gc.status,
      message: 'Gift card expiration renewed successfully',
    });
  })
);

app.post(
  '/api/admin/gift-cards/mark-used',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { code } = req.body || {};
    if (!code) {
      return res.status(400).json({ error: 'Code required' });
    }
    const { rows } = await query(
      `UPDATE gift_cards
       SET status = 'used', used_at = NOW(), updated_at = NOW()
       WHERE code = $1 AND status = 'active'
       RETURNING *`,
      [code]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Gift card not found or not active' });
    }
    const gc = rows[0];
    res.json({
      success: true,
      message: 'Gift card marked as used successfully',
      giftCard: {
        id: gc.id,
        code: gc.code,
        amount: Number(gc.amount),
        currency: gc.currency,
        status: gc.status,
        holder: {
          first_name: gc.first_name,
          last_name: gc.last_name,
          email: gc.email,
          phone: gc.phone,
        },
        used_at: toISO(gc.used_at),
      },
    });
  })
);
app.put(
  '/api/admin/customers/:phone',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { phone } = req.params;
    const { first_name, last_name, email, birth_date, birth_place, fiscal_code, address, city } = req.body || {};
    if (!first_name || !last_name) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }
    const { rows } = await query(
      `UPDATE customers
       SET first_name = $1,
           last_name = $2,
           email = $3,
           birth_date = $4,
           birth_place = $5,
           fiscal_code = $6,
           address = $7,
           city = $8,
           updated_at = NOW()
       WHERE phone = $9
       RETURNING id`,
      [first_name.trim(), last_name.trim(), email ? email.trim() : null, birth_date || null, birth_place || null, fiscal_code || null, address || null, city || null, phone]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    await query(
      `UPDATE gift_cards
       SET first_name = $1,
           last_name = $2,
           email = $3,
           birth_date = $4,
           updated_at = NOW()
       WHERE phone = $5`,
      [first_name.trim(), last_name.trim(), email ? email.trim() : null, birth_date || null, phone]
    );
    res.json({
      success: true,
      message: 'Customer data updated successfully',
      customer: {
        phone,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email ? email.trim() : '',
        updated_at: toISO(now()),
      },
    });
  })
);

app.get(
  '/api/admin/customers',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `WITH card_stats AS (
        SELECT
          phone,
          MAX(first_name) FILTER (WHERE first_name IS NOT NULL) AS gc_first_name,
          MAX(last_name) FILTER (WHERE last_name IS NOT NULL) AS gc_last_name,
          MAX(email) FILTER (WHERE email IS NOT NULL) AS gc_email,
          MAX(birth_date) FILTER (WHERE birth_date IS NOT NULL) AS gc_birth_date,
          COUNT(*) FILTER (WHERE status <> 'draft') AS total_cards,
          COUNT(*) FILTER (WHERE status = 'active') AS active_cards,
          COUNT(*) FILTER (WHERE status = 'used') AS used_cards,
          COUNT(*) FILTER (WHERE status = 'expired') AS expired_cards,
          SUM(amount) FILTER (WHERE status IN ('draft','active','used')) AS total_amount,
          SUM(amount) FILTER (WHERE status = 'draft') AS pending_revenue,
          SUM(amount) FILTER (WHERE status = 'used') AS used_revenue,
          MAX(created_at) AS last_purchase
        FROM gift_cards
        WHERE phone IS NOT NULL
        GROUP BY phone
      )
      SELECT
        COALESCE(c.phone, cs.phone) AS phone,
        COALESCE(c.first_name, cs.gc_first_name) AS first_name,
        COALESCE(c.last_name, cs.gc_last_name) AS last_name,
        COALESCE(c.email, cs.gc_email) AS email,
        COALESCE(c.birth_date, cs.gc_birth_date) AS birth_date,
        c.birth_place,
        c.fiscal_code,
        c.address,
        c.city,
        c.created_at,
        c.updated_at,
        COALESCE(cs.total_cards, 0) AS total_cards,
        COALESCE(cs.active_cards, 0) AS active_cards,
        COALESCE(cs.used_cards, 0) AS used_cards,
        COALESCE(cs.expired_cards, 0) AS expired_cards,
        COALESCE(cs.total_amount, 0) AS total_amount,
        COALESCE(cs.pending_revenue, 0) AS pending_revenue,
        COALESCE(cs.used_revenue, 0) AS used_revenue,
        cs.last_purchase
      FROM customers c
      FULL OUTER JOIN card_stats cs ON c.phone = cs.phone
      WHERE COALESCE(c.phone, cs.phone) IS NOT NULL
      ORDER BY GREATEST(COALESCE(c.updated_at, c.created_at), COALESCE(cs.last_purchase, '1970-01-01')) DESC`
    );
    res.set({ 'Cache-Control': 'no-cache, no-store, must-revalidate', Pragma: 'no-cache', Expires: '0' });
    res.json({
      customers: rows.map((row) => ({
        phone: row.phone,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        birth_date: row.birth_date ? row.birth_date.toISOString().split('T')[0] : null,
        birth_place: row.birth_place,
        fiscal_code: row.fiscal_code,
        address: row.address,
        city: row.city,
        total_cards: Number(row.total_cards),
        active_cards: Number(row.active_cards),
        used_cards: Number(row.used_cards),
        expired_cards: Number(row.expired_cards),
        total_amount: Number(row.total_amount || 0),
        pending_revenue: Number(row.pending_revenue || 0),
        used_revenue: Number(row.used_revenue || 0),
        last_purchase: toISO(row.last_purchase),
        created_at: toISO(row.created_at),
        updated_at: toISO(row.updated_at),
      })),
    });
  })
);

app.get(
  '/api/gift-cards/claim/:token',
  limiter,
  asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { rows } = await query(
      `SELECT id, amount, currency, expires_at, claim_token_expires_at, status
       FROM gift_cards
       WHERE claim_token = $1`,
      [token]
    );
    if (rows.length === 0 || rows[0].status !== 'draft') {
      return res.status(400).json({ error: 'Token not valid for claim' });
    }
    const gc = rows[0];
    if (gc.claim_token_expires_at && now() > gc.claim_token_expires_at) {
      return res.status(410).json({ error: 'Token expired' });
    }
    res.json({ amount: Number(gc.amount), currency: gc.currency, expires_at: toISO(gc.expires_at) });
  })
);

app.post(
  '/api/gift-cards/claim/:token/finalize',
  limiter,
  asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { first_name, last_name, email = null, phone = null, birth_date = null, dedication = null, consents = null } =
      req.body || {};
    if (!first_name || !last_name || !phone) {
      return res.status(400).json({ error: 'First name, last name and phone are required' });
    }
    const result = await withTransaction(async (client) => {
      const { rows: draftRows } = await client.query(
        `SELECT id, amount, currency, expires_at, claim_token_expires_at
         FROM gift_cards
         WHERE claim_token = $1 AND status = 'draft'
         FOR UPDATE`,
        [token]
      );
      if (draftRows.length === 0) {
        return { error: { status: 400, message: 'Token not valid for claim' } };
      }
      const draft = draftRows[0];
      if (draft.claim_token_expires_at && now() > draft.claim_token_expires_at) {
        return { error: { status: 410, message: 'Token expired' } };
      }
      const customerId = await upsertCustomerByPhone(client, {
        firstName: first_name,
        lastName: last_name,
        email,
        phone,
        birthDate: birth_date,
      });
      const code = await generateUniqueCode(client);
      const { rows } = await client.query(
        `UPDATE gift_cards
         SET status = 'active',
             claimed_at = NOW(),
             claimed_by_customer_id = $1,
             code = $2,
             first_name = $3,
             last_name = $4,
             email = $5,
             phone = $6,
             birth_date = $7,
             dedication = $8,
             consents = $9,
             updated_at = NOW()
         WHERE id = $10
         RETURNING *`,
        [
          customerId,
          code,
          first_name,
          last_name,
          email,
          phone,
          birth_date,
          dedication,
          consents,
          draft.id,
        ]
      );
      return { card: rows[0], code };
    });
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message });
    }
    const gc = result.card;
    const landing_url = `${PUBLIC_BASE_URL}/gift/landing/${gc.id}`;
    res.json({
      id: gc.id,
      status: gc.status,
      amount: Number(gc.amount),
      currency: gc.currency,
      expires_at: toISO(gc.expires_at),
      code: result.code,
      first_name: gc.first_name,
      last_name: gc.last_name,
      qr_code_data: landing_url,
      landing_url,
      holder: {
        first_name: gc.first_name,
        last_name: gc.last_name,
        email: gc.email,
        phone: gc.phone,
        birth_date: gc.birth_date,
      },
      dedication,
    });
  })
);

app.get(
  '/api/gift-cards/verify/:code',
  asyncHandler(async (req, res) => {
    const { code } = req.params;
    const { rows } = await query(
      `SELECT amount, currency, status, expires_at FROM gift_cards WHERE code = $1`,
      [code]
    );
    if (rows.length === 0) {
      return res.status(404).json({ isValid: false, message: 'Gift Card non trovata' });
    }
    const gc = rows[0];
    if (gc.status === 'active') {
      return res.json({ isValid: true, amount: Number(gc.amount), currency: gc.currency, status: 'active', expires_at: toISO(gc.expires_at) });
    }
    if (gc.status === 'used') {
      return res.json({ isValid: true, amount: Number(gc.amount), currency: gc.currency, status: 'claimed', expires_at: toISO(gc.expires_at) });
    }
    if (gc.status === 'expired') {
      return res.json({ isValid: false, amount: Number(gc.amount), currency: gc.currency, status: 'expired', expires_at: toISO(gc.expires_at) });
    }
    return res.json({ isValid: false, message: 'Gift Card non valida' });
  })
);

app.get(
  '/api/gift-cards/landing/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rows } = await query(
      `SELECT id, amount, currency, code, status, first_name, last_name, email, phone, expires_at, created_at
       FROM gift_cards WHERE id = $1`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Gift Card non trovata' });
    }
    const gc = rows[0];
    res.json({
      id: gc.id,
      amount: Number(gc.amount),
      currency: gc.currency,
      code: gc.code,
      status: gc.status,
      first_name: gc.first_name,
      last_name: gc.last_name,
      email: gc.email,
      phone: gc.phone,
      expires_at: toISO(gc.expires_at),
      created_at: toISO(gc.created_at),
    });
  })
);

app.post(
  '/api/gift-cards/verify',
  asyncHandler(async (req, res) => {
    const { code } = req.body || {};
    if (!code) {
      return res.status(400).json({ error: 'Code required' });
    }
    const { rows } = await query('SELECT status, amount, currency, expires_at FROM gift_cards WHERE code = $1', [code]);
    if (rows.length === 0) {
      return res.status(404).json({ status: 'not_found' });
    }
    const gc = rows[0];
    if (gc.status === 'active') {
      return res.json({ status: 'valid', details: { amount: Number(gc.amount), currency: gc.currency, expires_at: toISO(gc.expires_at) } });
    }
    if (gc.status === 'used') {
      return res.json({ status: 'used' });
    }
    if (gc.status === 'expired') {
      return res.json({ status: 'expired' });
    }
    return res.json({ status: 'not_valid' });
  })
);

app.post(
  '/api/gift-cards/use',
  asyncHandler(async (req, res) => {
    const { code } = req.body || {};
    if (!code) {
      return res.status(400).json({ error: 'Code required' });
    }
    const { rows } = await query(
      `UPDATE gift_cards SET status = 'used', updated_at = NOW()
       WHERE code = $1 AND status = 'active'
       RETURNING status`,
      [code]
    );
    if (rows.length === 0) {
      return res.status(404).json({ status: 'not_found' });
    }
    res.json({ status: 'used' });
  })
);
async function saveConsent(client, { type, payload, phone }) {
  const { rows } = await client.query(
    `INSERT INTO consensi (id, type, phone, payload, submitted_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING id, created_at`,
    [uuidv4(), type, phone || null, payload, payload.submittedAt ? new Date(payload.submittedAt) : now()]
  );
  return rows[0];
}

async function attachConsentToCustomer(client, consentBody) {
  if (!consentBody.phone) {
    return { customerId: null, giftCardId: null };
  }
  const customerId = await upsertCustomerByPhone(client, {
    firstName: consentBody.firstName,
    lastName: consentBody.lastName,
    email: consentBody.email,
    phone: consentBody.phone,
    birthDate: consentBody.birthDate,
    birthPlace: consentBody.birthPlace,
    fiscalCode: consentBody.fiscalCode,
    address: consentBody.address,
    city: consentBody.city,
  });
  const { rows } = await client.query('SELECT id FROM gift_cards WHERE phone = $1 LIMIT 1', [consentBody.phone]);
  return { customerId, giftCardId: rows[0]?.id || null };
}

app.post(
  '/api/consenso/tatuaggio',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    if (!body.firstName?.trim() || !body.lastName?.trim() || !body.birthDate || !body.phone?.trim()) {
      return res.status(400).json({ error: 'Campi obbligatori mancanti' });
    }
    const result = await withTransaction(async (client) => {
      const linkage = await attachConsentToCustomer(client, body);
      const consent = await saveConsent(client, { type: 'tatuaggio', payload: body, phone: body.phone });
      await client.query(
        `UPDATE consensi SET customer_id = $1, gift_card_id = $2 WHERE id = $3`,
        [linkage.customerId, linkage.giftCardId, consent.id]
      );
      return { consent, linkage };
    });
    res.status(201).json({
      success: true,
      message: 'Consenso per tatuaggio salvato con successo',
      id: result.consent.id,
      customerId: result.linkage.customerId,
      linkedToExistingCustomer: !!result.linkage.customerId,
      createdNewCustomer: !!result.linkage.customerId,
    });
  })
);

app.post(
  '/api/consenso/piercing',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    if (
      !body.firstName?.trim() ||
      !body.lastName?.trim() ||
      !body.birthDate ||
      !body.phone?.trim() ||
      !body.piercingType?.trim() ||
      !body.piercingPosition?.trim() ||
      !body.isAdult ||
      !body.consentInformedTreatment ||
      !body.consentDataProcessing
    ) {
      return res.status(400).json({ error: 'Campi obbligatori mancanti' });
    }
    const result = await withTransaction(async (client) => {
      const linkage = await attachConsentToCustomer(client, body);
      const consent = await saveConsent(client, { type: 'piercing', payload: body, phone: body.phone });
      await client.query(
        `UPDATE consensi SET customer_id = $1, gift_card_id = $2 WHERE id = $3`,
        [linkage.customerId, linkage.giftCardId, consent.id]
      );
      return { consent, linkage };
    });
    res.status(201).json({
      success: true,
      message: 'Consenso piercing salvato con successo',
      id: result.consent.id,
      customerId: result.linkage.customerId,
      linkedToExistingCustomer: !!result.linkage.customerId,
      createdNewCustomer: !!result.linkage.customerId,
    });
  })
);

app.get(
  '/api/admin/consensi',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { rows } = await query('SELECT * FROM consensi ORDER BY created_at DESC');
    res.json({
      consensi: rows.map((row) => ({
        id: row.id,
        type: row.type,
        phone: row.phone,
        payload: row.payload,
        submittedAt: toISO(row.submitted_at),
        createdAt: toISO(row.created_at),
        customerId: row.customer_id,
        giftCardId: row.gift_card_id,
      })),
      total: rows.length,
      tatuaggi: rows.filter((row) => row.type === 'tatuaggio').length,
      piercing: rows.filter((row) => row.type === 'piercing').length,
    });
  })
);

app.get(
  '/api/admin/consensi/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rows } = await query('SELECT * FROM consensi WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Consenso non trovato' });
    }
    const consenso = rows[0];
    res.json({
      id: consenso.id,
      type: consenso.type,
      phone: consenso.phone,
      payload: consenso.payload,
      submittedAt: toISO(consenso.submitted_at),
      createdAt: toISO(consenso.created_at),
      customerId: consenso.customer_id,
      giftCardId: consenso.gift_card_id,
    });
  })
);

app.get(
  '/api/admin/customers/:phone/consensi',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { phone } = req.params;
    const { rows } = await query(
      `SELECT id, type, submitted_at, created_at, customer_id, gift_card_id
       FROM consensi WHERE phone = $1 ORDER BY created_at DESC`,
      [phone]
    );
    res.json({
      phone,
      consents: rows.map((row) => ({
        id: row.id,
        type: row.type,
        submittedAt: toISO(row.submitted_at),
        createdAt: toISO(row.created_at),
        customerId: row.customer_id,
        giftCardId: row.gift_card_id,
      })),
      total: rows.length,
    });
  })
);

app.delete(
  '/api/admin/consensi/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rows } = await query('DELETE FROM consensi WHERE id = $1 RETURNING id, type, phone', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Consenso non trovato' });
    }
    res.json({
      success: true,
      message: 'Consenso eliminato con successo',
      deletedConsent: rows[0],
    });
  })
);

app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3001;

(async () => {
  await initSchema();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on port ${PORT}`);
  });
})();
