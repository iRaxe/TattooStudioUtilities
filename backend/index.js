require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { initSchema } = require('./db');

const app = express();

// Basic security and middlewares
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
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
      'https://www.tinkstudio.it'
    ];

    // Allow all tinkstudio.it subdomains and ports
    if (origin.includes('tinkstudio.it') || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS: Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Token']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(morgan('dev'));

// Simple in-memory stores (replace with Postgres later)
const giftCards = new Map(); // id -> card
const codeIndex = new Map(); // code -> id
const tokenIndex = new Map(); // token -> id
const consensi = new Map(); // id -> consenso data
const ordini = new Map(); // id -> ordine

// Appointment system stores
const tatuatori = new Map(); // id -> tatuatore
const stanze = new Map(); // id -> stanza
const appuntamenti = new Map(); // id -> appuntamento

// Helpers
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:5174';
const CLAIM_TOKEN_TTL_MINUTES = parseInt(process.env.CLAIM_TOKEN_TTL_MINUTES || '10080', 10);
const GIFT_CARD_VALIDITY_MONTHS = parseInt(process.env.GIFT_CARD_VALIDITY_MONTHS || '12', 10);

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Admin credentials for dev/demo (in production, use bcrypt and database)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function now() { return new Date(); }
function minutesFromNow(mins) { return new Date(Date.now() + mins * 60 * 1000); }
function monthsFromDate(date, months) { 
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}
function isExpired(giftCard) {
  if (!giftCard.expires_at) return false;
  return now() > new Date(giftCard.expires_at);
}
function toISO(dt) { return dt ? new Date(dt).toISOString() : null; }
function genCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

// Orders helpers
const ORDER_STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Confermato' },
  { value: 'processing', label: 'In lavorazione' },
  { value: 'completed', label: 'Completato' },
  { value: 'cancelled', label: 'Annullato' }
];

const ORDER_TYPE_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'ritocco', label: 'Ritocco' },
  { value: 'vip', label: 'VIP' }
];

const ORDER_ACTIVE_OPTIONS = [
  { value: 'true', label: 'Attiva' },
  { value: 'false', label: 'Disattiva' }
];

const DEFAULT_ORDER_SORTERS = [
  { field: 'data_ordine', order: 'desc', isDefault: true }
];

function getOrderStatusLabel(value) {
  const match = ORDER_STATUS_OPTIONS.find(option => option.value === value);
  return match ? match.label : value;
}

function getOrderTypeLabel(value) {
  const match = ORDER_TYPE_OPTIONS.find(option => option.value === value);
  return match ? match.label : value;
}

function getOrderActiveLabel(value) {
  return value ? 'Attiva' : 'Disattiva';
}

function normalizeBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;
    return ['true', '1', 'yes', 'y', 'attiva', 'attivo'].includes(normalized);
  }
  return false;
}

function seedOrders() {
  if (ordini.size > 0) return;

  const surnames = ['Rossi', 'Bianchi', 'Verdi', 'Neri', 'Russo', 'Ferrari'];
  const names = ['Alessia', 'Marco', 'Giulia', 'Davide', 'Sara', 'Luca', 'Martina', 'Fabio'];
  const nowDate = new Date();

  for (let index = 0; index < 40; index++) {
    const id = uuidv4();
    const statusIndex = index % ORDER_STATUS_OPTIONS.length;
    const status = statusIndex === 1 && index % 5 === 0 ? 'processing'
      : statusIndex === 3 && index % 7 === 0 ? 'cancelled'
      : statusIndex === 2 && index % 4 === 0 ? 'completed'
      : 'confirmed';
    const type = index % 6 === 0 ? 'vip' : index % 4 === 0 ? 'ritocco' : 'standard';
    const createdAt = new Date(nowDate.getTime() - index * 86400000 - (index % 6) * 3600000);
    ordini.set(id, {
      id,
      numero: `ORD-${(1000 + index).toString().padStart(4, '0')}`,
      cliente_nome: `${names[index % names.length]} ${surnames[index % surnames.length]}`,
      stato: status,
      attivo: status === 'confirmed' || status === 'processing',
      tipo: type,
      data_ordine: createdAt,
      importo: Number((85 + (index % 6) * 17 + (index % 3) * 4).toFixed(2)),
      valuta: 'EUR',
      note: type === 'ritocco'
        ? 'Sessione di ritocco programmata'
        : type === 'vip'
          ? 'Pacchetto VIP con orario dedicato'
          : 'Ordine standard'
    });
  }
}

function buildOrderFilterOptions() {
  return {
    stato: ORDER_STATUS_OPTIONS,
    attivo: ORDER_ACTIVE_OPTIONS,
    tipo: ORDER_TYPE_OPTIONS
  };
}

function parseOrderFilters(rawFilters) {
  if (!rawFilters) return [];

  let filtersArray = rawFilters;
  if (typeof rawFilters === 'string') {
    if (!rawFilters.trim()) return [];
    try {
      filtersArray = JSON.parse(rawFilters);
    } catch (error) {
      throw new Error('INVALID_ORDER_FILTERS');
    }
  }

  if (!Array.isArray(filtersArray)) return [];

  return filtersArray
    .map(filter => {
      const field = filter?.field || filter?.id;
      if (!field) return null;
      return {
        field,
        operator: filter?.operator || 'eq',
        value: filter?.value,
        variant: filter?.variant || null,
        filterId: filter?.filterId || null
      };
    })
    .filter(Boolean);
}

function ensureDefaultOrderFilters(filters) {
  const normalized = Array.isArray(filters) ? [...filters] : [];
  const hasField = (field) => normalized.some(filter => filter.field === field);

  if (!hasField('stato')) {
    normalized.push({
      field: 'stato',
      operator: 'inArray',
      value: ['confirmed'],
      variant: 'multiSelect',
      filterId: 'default-stato',
      isDefault: true
    });
  }

  if (!hasField('attivo')) {
    normalized.push({
      field: 'attivo',
      operator: 'inArray',
      value: ['true'],
      variant: 'multiSelect',
      filterId: 'default-attivo',
      isDefault: true
    });
  }

  if (!hasField('tipo')) {
    normalized.push({
      field: 'tipo',
      operator: 'inArray',
      value: ['standard'],
      variant: 'multiSelect',
      filterId: 'default-tipo',
      isDefault: true
    });
  }

  return normalized;
}

function matchesOrderFilter(order, filter) {
  if (!filter || !filter.field) return true;
  const comparisonValues = Array.isArray(filter.value) ? filter.value : [filter.value];
  if (!comparisonValues.length) return true;

  const orderValue = order[filter.field];

  if (filter.field === 'attivo') {
    const orderBoolean = normalizeBoolean(orderValue);
    if (filter.operator === 'ne' || filter.operator === 'notIn') {
      return !comparisonValues.some(value => orderBoolean === normalizeBoolean(value));
    }
    return comparisonValues.some(value => orderBoolean === normalizeBoolean(value));
  }

  if (filter.field === 'stato' || filter.field === 'tipo') {
    const normalizedOrderValue = (orderValue || '').toString().toLowerCase();
    if (filter.operator === 'ne' || filter.operator === 'notIn') {
      return !comparisonValues.some(value => normalizedOrderValue === (value || '').toString().toLowerCase());
    }
    if (filter.operator === 'contains') {
      return comparisonValues.some(value => normalizedOrderValue.includes((value || '').toString().toLowerCase()));
    }
    return comparisonValues.some(value => normalizedOrderValue === (value || '').toString().toLowerCase());
  }

  if (filter.field === 'data_ordine' || filter.field === 'created_at') {
    const orderTimestamp = new Date(orderValue).getTime();
    return comparisonValues.every(value => {
      const valueTimestamp = new Date(value).getTime();
      if (Number.isNaN(valueTimestamp) || Number.isNaN(orderTimestamp)) return true;
      switch (filter.operator) {
        case 'gte':
        case 'afterOrEqual':
          return orderTimestamp >= valueTimestamp;
        case 'gt':
          return orderTimestamp > valueTimestamp;
        case 'lte':
        case 'beforeOrEqual':
          return orderTimestamp <= valueTimestamp;
        case 'lt':
          return orderTimestamp < valueTimestamp;
        default:
          return orderTimestamp === valueTimestamp;
      }
    });
  }

  const normalizedOrderValue = orderValue !== undefined && orderValue !== null
    ? orderValue.toString().toLowerCase()
    : '';

  switch (filter.operator) {
    case 'contains':
      return comparisonValues.some(value => normalizedOrderValue.includes((value || '').toString().toLowerCase()));
    case 'startsWith':
      return comparisonValues.some(value => normalizedOrderValue.startsWith((value || '').toString().toLowerCase()));
    case 'endsWith':
      return comparisonValues.some(value => normalizedOrderValue.endsWith((value || '').toString().toLowerCase()));
    case 'ne':
    case 'notIn':
      return !comparisonValues.some(value => normalizedOrderValue === (value || '').toString().toLowerCase());
    default:
      return comparisonValues.some(value => normalizedOrderValue === (value || '').toString().toLowerCase());
  }
}

function applyOrderFilters(data, filters) {
  if (!filters || filters.length === 0) return [...data];
  return data.filter(order => filters.every(filter => matchesOrderFilter(order, filter)));
}

function parseOrderSorters(rawSorters) {
  if (!rawSorters) return [];

  let sortersArray = rawSorters;
  if (typeof rawSorters === 'string') {
    if (!rawSorters.trim()) return [];
    try {
      sortersArray = JSON.parse(rawSorters);
    } catch (error) {
      throw new Error('INVALID_ORDER_SORTERS');
    }
  }

  if (!Array.isArray(sortersArray)) return [];

  return sortersArray
    .map(sorter => {
      const field = sorter?.field || sorter?.id;
      if (!field) return null;
      const order = (sorter?.order || sorter?.direction || 'asc').toString().toLowerCase() === 'desc' ? 'desc' : 'asc';
      return { field, order };
    })
    .filter(Boolean);
}

function sortOrders(data, sorters) {
  if (!Array.isArray(data)) return [];
  if (!sorters || sorters.length === 0) {
    return [...data].sort((a, b) => new Date(b.data_ordine) - new Date(a.data_ordine));
  }

  return [...data].sort((a, b) => {
    for (const sorter of sorters) {
      const valueA = a[sorter.field];
      const valueB = b[sorter.field];

      let comparison = 0;
      if (valueA === valueB) {
        comparison = 0;
      } else if (valueA === undefined || valueA === null) {
        comparison = -1;
      } else if (valueB === undefined || valueB === null) {
        comparison = 1;
      } else if (valueA instanceof Date || valueB instanceof Date || sorter.field === 'data_ordine' || sorter.field === 'created_at') {
        comparison = new Date(valueA).getTime() - new Date(valueB).getTime();
      } else if (typeof valueA === 'number' && typeof valueB === 'number') {
        comparison = valueA - valueB;
      } else if (typeof valueA === 'boolean' && typeof valueB === 'boolean') {
        comparison = valueA === valueB ? 0 : valueA ? 1 : -1;
      } else {
        comparison = valueA.toString().localeCompare(valueB.toString());
      }

      if (comparison !== 0) {
        return sorter.order === 'desc' ? -comparison : comparison;
      }
    }
    return 0;
  });
}

function serializeOrder(order) {
  return {
    id: order.id,
    numero: order.numero,
    cliente_nome: order.cliente_nome,
    stato: order.stato,
    stato_label: getOrderStatusLabel(order.stato),
    attivo: order.attivo,
    attivo_label: getOrderActiveLabel(order.attivo),
    tipo: order.tipo,
    tipo_label: getOrderTypeLabel(order.tipo),
    data_ordine: toISO(order.data_ordine),
    importo: order.importo,
    valuta: order.valuta,
    note: order.note || null
  };
}

function buildOrderSummary(orders) {
  const summary = {
    totale: Array.isArray(orders) ? orders.length : 0,
    attivi: 0,
    perStato: ORDER_STATUS_OPTIONS.reduce((acc, option) => ({ ...acc, [option.value]: 0 }), {}),
    perTipo: ORDER_TYPE_OPTIONS.reduce((acc, option) => ({ ...acc, [option.value]: 0 }), {})
  };

  if (!Array.isArray(orders)) {
    return summary;
  }

  for (const order of orders) {
    if (order?.stato) {
      if (summary.perStato[order.stato] === undefined) {
        summary.perStato[order.stato] = 0;
      }
      summary.perStato[order.stato] += 1;
    }

    if (order?.tipo) {
      if (summary.perTipo[order.tipo] === undefined) {
        summary.perTipo[order.tipo] = 0;
      }
      summary.perTipo[order.tipo] += 1;
    }

    if (order?.attivo) {
      summary.attivi += 1;
    }
  }

  return summary;
}

function handleOrdersList(req, res) {
  try {
    let parsedFilters = [];
    let parsedSorters = [];

    try {
      parsedFilters = parseOrderFilters(req.query.filters || req.query.filter);
    } catch (error) {
      if (error.message === 'INVALID_ORDER_FILTERS') {
        return res.status(400).json({
          error: 'Parametro filters non valido: atteso JSON array',
          details: error.message
        });
      }
      throw error;
    }

    try {
      parsedSorters = parseOrderSorters(req.query.sorters || req.query.sort);
    } catch (error) {
      if (error.message === 'INVALID_ORDER_SORTERS') {
        return res.status(400).json({
          error: 'Parametro sorters non valido: atteso JSON array',
          details: error.message
        });
      }
      throw error;
    }

    const normalizedFilters = ensureDefaultOrderFilters(parsedFilters);
    const ordersArray = Array.from(ordini.values());
    const filteredOrders = applyOrderFilters(ordersArray, normalizedFilters);
    const summary = buildOrderSummary(filteredOrders);

    const sortersToApply = (parsedSorters.length ? parsedSorters : DEFAULT_ORDER_SORTERS).map(sorter => ({ ...sorter }));
    const sortedOrders = sortOrders(filteredOrders, sortersToApply);

    const total = sortedOrders.length;
    const defaultPageSize = parseInt(process.env.ORDERS_PAGE_SIZE || '25', 10);
    const currentPage = Math.max(parseInt(req.query.current || req.query.page || '1', 10) || 1, 1);
    const requestedPageSize = parseInt(req.query.pageSize || req.query.perPage || defaultPageSize, 10);
    const pageSizeValue = Number.isNaN(requestedPageSize)
      ? defaultPageSize
      : Math.min(Math.max(requestedPageSize, 1), 100);
    const startIndex = (currentPage - 1) * pageSizeValue;
    const paginatedOrders = sortedOrders.slice(startIndex, startIndex + pageSizeValue);

    const appliedFiltersPayload = normalizedFilters.map(filter => ({
      field: filter.field,
      operator: filter.operator,
      value: filter.value,
      variant: filter.variant || null,
      filterId: filter.filterId || null,
      isDefault: !!filter.isDefault
    }));

    const defaultsAddedPayload = normalizedFilters
      .filter(filter => filter.isDefault)
      .map(filter => ({
        field: filter.field,
        operator: filter.operator,
        value: filter.value,
        variant: filter.variant || null,
        filterId: filter.filterId || null,
        isDefault: true
      }));

    res.json({
      data: paginatedOrders.map(serializeOrder),
      total,
      current: currentPage,
      pageSize: pageSizeValue,
      filters: {
        applied: appliedFiltersPayload,
        defaultsAdded: defaultsAddedPayload,
        options: buildOrderFilterOptions()
      },
      sorters: sortersToApply,
      summary
    });
  } catch (error) {
    console.error('Errore nel recupero ordini:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
}

// Helper functions for appointment system
function isValidBusinessHours(dateTime) {
  const date = new Date(dateTime);
  const hour = date.getHours();
  return hour >= 9 && hour < 21; // 9:00-21:00
}

function isOverlappingAppointment(existingStart, existingDuration, newStart, newDuration) {
  const existingEnd = new Date(existingStart.getTime() + existingDuration * 60000);
  const newEnd = new Date(newStart.getTime() + newDuration * 60000);

  // Check for overlap
  return (newStart < existingEnd && newEnd > existingStart);
}

function checkRoomAvailability(stanzaId, tatuatoreId, startTime, duration, excludeAppointmentId = null) {
  const conflicts = [];

  for (const [id, appointment] of appuntamenti.entries()) {
    // Skip the appointment being updated
    if (excludeAppointmentId && id === excludeAppointmentId) continue;

    // Check if appointment conflicts with requested time
    if ((appointment.stanza_id === stanzaId || appointment.tatuatore_id === tatuatoreId) &&
        appointment.stato !== 'cancellato' &&
        isOverlappingAppointment(
          new Date(appointment.orario_inizio),
          appointment.durata_minuti,
          new Date(startTime),
          duration
        )) {
      conflicts.push({
        appointment_id: id,
        tatuatore_nome: tatuatori.get(appointment.tatuatore_id)?.nome,
        stanza_nome: stanze.get(appointment.stanza_id)?.nome,
        orario_inizio: appointment.orario_inizio,
        durata_minuti: appointment.durata_minuti,
        stato: appointment.stato
      });
    }
  }

  return conflicts;
}

function validateAppointmentData(data) {
  const errors = [];

  if (!data.tatuatore_id) errors.push('Tatuatore obbligatorio');
  if (!data.stanza_id) errors.push('Stanza obbligatoria');
  if (!data.orario_inizio) errors.push('Orario inizio obbligatorio');
  if (!data.durata_minuti || data.durata_minuti < 15) errors.push('Durata minima 15 minuti');

  // Validate business hours
  if (data.orario_inizio && !isValidBusinessHours(data.orario_inizio)) {
    errors.push('Orario fuori dall\'orario di lavoro (9:00-21:00)');
  }

  // Check tatuatore exists and is active
  if (data.tatuatore_id && !tatuatori.has(data.tatuatore_id)) {
    errors.push('Tatuatore non trovato');
  } else if (data.tatuatore_id) {
    const tatuatore = tatuatori.get(data.tatuatore_id);
    if (!tatuatore.attivo) {
      errors.push('Tatuatore non attivo');
    }
  }

  // Check stanza exists and is active
  if (data.stanza_id && !stanze.has(data.stanza_id)) {
    errors.push('Stanza non trovata');
  } else if (data.stanza_id) {
    const stanza = stanze.get(data.stanza_id);
    if (!stanza.attivo) {
      errors.push('Stanza non attiva');
    }
  }

  return errors;
}

// JWT Admin authentication middleware
function requireAdmin(req, res, next) {
  console.log('=== ADMIN MIDDLEWARE CHECK ===');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));

  const authHeader = req.header('Authorization');
  console.log('Authorization header:', authHeader);

  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  console.log('Extracted token:', token ? token.substring(0, 50) + '...' : 'NO TOKEN');

  if (!token) {
    console.log('ERROR: No token provided in Authorization header');
    return res.status(401).json({
      error: 'Access token required',
      debug: {
        headers: req.headers,
        authHeader: authHeader,
        hasToken: false
      }
    });
  }

  try {
    console.log('Verifying token...');
    console.log('JWT_SECRET loaded:', !!JWT_SECRET);
    console.log('JWT_SECRET length:', JWT_SECRET ? JWT_SECRET.length : 0);

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decoded successfully:', JSON.stringify(decoded, null, 2));
    req.admin = decoded;
    console.log('Middleware check passed, proceeding...');
    next();
  } catch (err) {
    console.log('ERROR: Token verification failed');
    console.log('Error name:', err.name);
    console.log('Error message:', err.message);
    console.log('JWT_SECRET loaded:', !!JWT_SECRET);

    return res.status(401).json({
      error: 'Invalid or expired token',
      debug: {
        errorName: err.name,
        errorMessage: err.message,
        tokenPrefix: token.substring(0, 20) + '...',
        jwtSecretLoaded: !!JWT_SECRET
      }
    });
  }
}

// Rate limit public claim routes
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

// Health
app.get('/api/health', (req, res) => { res.json({ ok: true }); });

// Admin login endpoint
app.post('/api/admin/login', async (req, res) => {
  try {
    console.log('=== ADMIN LOGIN ATTEMPT ===');
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Environment variables loaded:');
    console.log('- ADMIN_USERNAME:', ADMIN_USERNAME ? 'SET' : 'NOT SET');
    console.log('- ADMIN_PASSWORD:', ADMIN_PASSWORD ? 'SET' : 'NOT SET');
    console.log('- JWT_SECRET:', JWT_SECRET ? 'SET (length: ' + JWT_SECRET.length + ')' : 'NOT SET');
    console.log('- JWT_EXPIRES_IN:', JWT_EXPIRES_IN);

    const { username, password } = req.body || {};

    console.log('Parsed credentials:');
    console.log('- username:', username);
    console.log('- password:', password ? 'PROVIDED' : 'NOT PROVIDED');

    if (!username || !password) {
      console.log('ERROR: Missing username or password');
      return res.status(400).json({
        error: 'Username and password required',
        debug: {
          receivedUsername: !!username,
          receivedPassword: !!password
        }
      });
    }

    console.log('Credential validation:');
    console.log('- username match:', username === ADMIN_USERNAME);
    console.log('- password match:', password === ADMIN_PASSWORD);

    // Simple credential check (in production, use bcrypt)
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      console.log('ERROR: Invalid credentials provided');
      return res.status(401).json({
        error: 'Invalid credentials',
        debug: {
          usernameMatch: username === ADMIN_USERNAME,
          passwordMatch: password === ADMIN_PASSWORD,
          expectedUsername: ADMIN_USERNAME,
          providedUsername: username
        }
      });
    }

    console.log('Generating JWT token...');

    // Generate JWT
    const tokenPayload = {
      username,
      role: 'admin',
      iat: Math.floor(Date.now() / 1000)
    };

    console.log('Token payload:', JSON.stringify(tokenPayload, null, 2));

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    console.log('Token generated successfully');
    console.log('Token length:', token.length);
    console.log('Token preview:', token.substring(0, 50) + '...');

    const response = {
      token,
      expires_in: JWT_EXPIRES_IN,
      user: { username, role: 'admin' }
    };

    console.log('Login successful, sending response');
    console.log('=== END LOGIN ATTEMPT ===');

    return res.json(response);

  } catch (error) {
    console.error('=== CRITICAL ERROR IN LOGIN ENDPOINT ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return res.status(500).json({
      error: 'Internal Server Error',
      debug: {
        errorType: error.constructor.name,
        errorMessage: error.message,
        environmentLoaded: {
          ADMIN_USERNAME: !!ADMIN_USERNAME,
          ADMIN_PASSWORD: !!ADMIN_PASSWORD,
          JWT_SECRET: !!JWT_SECRET,
          JWT_EXPIRES_IN: !!JWT_EXPIRES_IN
        }
      }
    });
  }
});

// ========== APPOINTMENT SYSTEM ENDPOINTS ==========

// ========== TATUATORI CRUD ==========

// GET /api/admin/tatuatori - Lista tatuatori
app.get('/api/admin/tatuatori', requireAdmin, (req, res) => {
  try {
    const allTatuatori = Array.from(tatuatori.values())
      .map(tatuatore => ({
        id: tatuatore.id,
        nome: tatuatore.nome,
        attivo: tatuatore.attivo,
        created_at: toISO(tatuatore.created_at),
        updated_at: toISO(tatuatore.updated_at)
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ tatuatori: allTatuatori });
  } catch (error) {
    console.error('Errore nel recupero tatuatori:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// POST /api/admin/tatuatori - Crea tatuatore
app.post('/api/admin/tatuatori', requireAdmin, (req, res) => {
  try {
    const { nome, attivo = true } = req.body || {};

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'Nome tatuatore obbligatorio' });
    }

    const id = uuidv4();
    const now = new Date();

    const tatuatore = {
      id,
      nome: nome.trim(),
      attivo,
      created_at: now,
      updated_at: now
    };

    tatuatori.set(id, tatuatore);

    res.status(201).json({
      id: tatuatore.id,
      nome: tatuatore.nome,
      attivo: tatuatore.attivo,
      created_at: toISO(tatuatore.created_at)
    });
  } catch (error) {
    console.error('Errore nella creazione tatuatore:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// PUT /api/admin/tatuatori/:id - Modifica tatuatore
app.put('/api/admin/tatuatori/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { nome, attivo } = req.body || {};

    if (!tatuatori.has(id)) {
      return res.status(404).json({ error: 'Tatuatore non trovato' });
    }

    const tatuatore = tatuatori.get(id);

    if (nome !== undefined) {
      if (!nome || !nome.trim()) {
        return res.status(400).json({ error: 'Nome tatuatore obbligatorio' });
      }
      tatuatore.nome = nome.trim();
    }

    if (attivo !== undefined) {
      tatuatore.attivo = !!attivo;
    }

    tatuatore.updated_at = new Date();

    res.json({
      id: tatuatore.id,
      nome: tatuatore.nome,
      attivo: tatuatore.attivo,
      updated_at: toISO(tatuatore.updated_at)
    });
  } catch (error) {
    console.error('Errore nella modifica tatuatore:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// DELETE /api/admin/tatuatori/:id - Elimina tatuatore
app.delete('/api/admin/tatuatori/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;

    if (!tatuatori.has(id)) {
      return res.status(404).json({ error: 'Tatuatore non trovato' });
    }

    // Check if tatuatore has appointments
    const hasAppointments = Array.from(appuntamenti.values())
      .some(app => app.tatuatore_id === id && app.stato !== 'cancellato');

    if (hasAppointments) {
      return res.status(400).json({
        error: 'Impossibile eliminare tatuatore con appuntamenti esistenti'
      });
    }

    const tatuatore = tatuatori.get(id);
    tatuatori.delete(id);

    res.json({
      success: true,
      message: 'Tatuatore eliminato con successo',
      deletedTatuatore: {
        id: tatuatore.id,
        nome: tatuatore.nome
      }
    });
  } catch (error) {
    console.error('Errore nell\'eliminazione tatuatore:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// ========== STANZE CRUD ==========

// GET /api/admin/stanze - Lista stanze
app.get('/api/admin/stanze', requireAdmin, (req, res) => {
  try {
    const allStanze = Array.from(stanze.values())
      .map(stanza => ({
        id: stanza.id,
        nome: stanza.nome,
        no_overbooking: stanza.no_overbooking,
        attivo: stanza.attivo,
        created_at: toISO(stanza.created_at),
        updated_at: toISO(stanza.updated_at)
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ stanze: allStanze });
  } catch (error) {
    console.error('Errore nel recupero stanze:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// POST /api/admin/stanze - Crea stanza
app.post('/api/admin/stanze', requireAdmin, (req, res) => {
  try {
    const { nome, no_overbooking = false, attivo = true } = req.body || {};

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'Nome stanza obbligatorio' });
    }

    const id = uuidv4();
    const now = new Date();

    const stanza = {
      id,
      nome: nome.trim(),
      no_overbooking,
      attivo,
      created_at: now,
      updated_at: now
    };

    stanze.set(id, stanza);

    res.status(201).json({
      id: stanza.id,
      nome: stanza.nome,
      no_overbooking: stanza.no_overbooking,
      attivo: stanza.attivo,
      created_at: toISO(stanza.created_at)
    });
  } catch (error) {
    console.error('Errore nella creazione stanza:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// PUT /api/admin/stanze/:id - Modifica stanza
app.put('/api/admin/stanze/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { nome, no_overbooking, attivo } = req.body || {};

    if (!stanze.has(id)) {
      return res.status(404).json({ error: 'Stanza non trovata' });
    }

    const stanza = stanze.get(id);

    if (nome !== undefined) {
      if (!nome || !nome.trim()) {
        return res.status(400).json({ error: 'Nome stanza obbligatorio' });
      }
      stanza.nome = nome.trim();
    }

    if (no_overbooking !== undefined) {
      stanza.no_overbooking = !!no_overbooking;
    }

    if (attivo !== undefined) {
      stanza.attivo = !!attivo;
    }

    stanza.updated_at = new Date();

    res.json({
      id: stanza.id,
      nome: stanza.nome,
      no_overbooking: stanza.no_overbooking,
      attivo: stanza.attivo,
      updated_at: toISO(stanza.updated_at)
    });
  } catch (error) {
    console.error('Errore nella modifica stanza:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// DELETE /api/admin/stanze/:id - Elimina stanza
app.delete('/api/admin/stanze/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;

    if (!stanze.has(id)) {
      return res.status(404).json({ error: 'Stanza non trovata' });
    }

    // Check if stanza has appointments
    const hasAppointments = Array.from(appuntamenti.values())
      .some(app => app.stanza_id === id && app.stato !== 'cancellato');

    if (hasAppointments) {
      return res.status(400).json({
        error: 'Impossibile eliminare stanza con appuntamenti esistenti'
      });
    }

    const stanza = stanze.get(id);
    stanze.delete(id);

    res.json({
      success: true,
      message: 'Stanza eliminata con successo',
      deletedStanza: {
        id: stanza.id,
        nome: stanza.nome
      }
    });
  } catch (error) {
    console.error('Errore nell\'eliminazione stanza:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// ========== APPUNTAMENTI CRUD ==========

// GET /api/admin/appuntamenti - Lista appuntamenti
app.get('/api/admin/appuntamenti', requireAdmin, (req, res) => {
  try {
    const {
      tatuatore_id,
      stanza_id,
      stato,
      data_inizio,
      data_fine,
      cliente_telefono
    } = req.query;

    let filteredAppointments = Array.from(appuntamenti.values());

    // Apply filters
    if (tatuatore_id) {
      filteredAppointments = filteredAppointments.filter(app => app.tatuatore_id === tatuatore_id);
    }

    if (stanza_id) {
      filteredAppointments = filteredAppointments.filter(app => app.stanza_id === stanza_id);
    }

    if (stato) {
      filteredAppointments = filteredAppointments.filter(app => app.stato === stato);
    }

    if (cliente_telefono) {
      filteredAppointments = filteredAppointments.filter(app =>
        app.cliente_telefono && app.cliente_telefono.includes(cliente_telefono)
      );
    }

    if (data_inizio || data_fine) {
      filteredAppointments = filteredAppointments.filter(app => {
        const appDate = new Date(app.orario_inizio);
        if (data_inizio && appDate < new Date(data_inizio)) return false;
        if (data_fine) {
          const endDate = new Date(app.orario_inizio);
          endDate.setMinutes(endDate.getMinutes() + app.durata_minuti);
          if (endDate > new Date(data_fine)) return false;
        }
        return true;
      });
    }

    const appointmentsWithDetails = filteredAppointments.map(appuntamento => {
      const tatuatore = tatuatori.get(appuntamento.tatuatore_id);
      const stanza = stanze.get(appuntamento.stanza_id);

      return {
        id: appuntamento.id,
        tatuatore_id: appuntamento.tatuatore_id,
        tatuatore_nome: tatuatore?.nome || 'Sconosciuto',
        stanza_id: appuntamento.stanza_id,
        stanza_nome: stanza?.nome || 'Sconosciuta',
        cliente_telefono: appuntamento.cliente_telefono,
        cliente_nome: appuntamento.cliente_nome,
        orario_inizio: toISO(appuntamento.orario_inizio),
        durata_minuti: appuntamento.durata_minuti,
        note: appuntamento.note,
        stato: appuntamento.stato,
        created_at: toISO(appuntamento.created_at),
        updated_at: toISO(appuntamento.updated_at)
      };
    }).sort((a, b) => new Date(b.orario_inizio) - new Date(a.orario_inizio));

    res.json({ appuntamenti: appointmentsWithDetails });
  } catch (error) {
    console.error('Errore nel recupero appuntamenti:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// POST /api/admin/appuntamenti - Crea appuntamento
app.post('/api/admin/appuntamenti', requireAdmin, (req, res) => {
  try {
    const {
      tatuatore_id,
      stanza_id,
      cliente_telefono,
      cliente_nome,
      orario_inizio,
      durata_minuti = 60,
      note
    } = req.body || {};

    const appointmentData = {
      tatuatore_id,
      stanza_id,
      cliente_telefono,
      cliente_nome,
      orario_inizio,
      durata_minuti,
      note,
      stato: 'confermato'
    };

    // Validate data
    const validationErrors = validateAppointmentData(appointmentData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Dati appuntamento non validi',
        details: validationErrors
      });
    }

    // Check availability
    const conflicts = checkRoomAvailability(stanza_id, tatuatore_id, orario_inizio, durata_minuti);

    // Check if conflicts are blocking (only for "sexy" room)
    const currentStanza = stanze.get(stanza_id);
    const hasBlockingConflicts = conflicts.some(conflict => {
      const conflictStanza = stanze.get(conflict.stanza_id);
      return conflictStanza && conflictStanza.no_overbooking;
    });

    if (hasBlockingConflicts) {
      return res.status(409).json({
        error: 'Conflitto di prenotazione',
        conflicts,
        message: 'La stanza "sexy" non permette sovrapposizioni'
      });
    }

    const id = uuidv4();
    const now = new Date();

    const appuntamento = {
      id,
      tatuatore_id,
      stanza_id,
      cliente_telefono: cliente_telefono || null,
      cliente_nome: cliente_nome || null,
      orario_inizio: new Date(orario_inizio),
      durata_minuti,
      note: note || null,
      stato: 'confermato',
      created_at: now,
      updated_at: now
    };

    appuntamenti.set(id, appuntamento);

    // Return appointment with details
    const tatuatore = tatuatori.get(tatuatore_id);
    const stanza = stanze.get(stanza_id);

    res.status(201).json({
      id: appuntamento.id,
      tatuatore_id: appuntamento.tatuatore_id,
      tatuatore_nome: tatuatore?.nome,
      stanza_id: appuntamento.stanza_id,
      stanza_nome: stanza?.nome,
      cliente_telefono: appuntamento.cliente_telefono,
      cliente_nome: appuntamento.cliente_nome,
      orario_inizio: toISO(appuntamento.orario_inizio),
      durata_minuti: appuntamento.durata_minuti,
      note: appuntamento.note,
      stato: appuntamento.stato,
      created_at: toISO(appuntamento.created_at),
      conflicts: conflicts.length > 0 ? conflicts : undefined
    });
  } catch (error) {
    console.error('Errore nella creazione appuntamento:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// GET /api/admin/appuntamenti/:id - Dettagli appuntamento
app.get('/api/admin/appuntamenti/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;

    if (!appuntamenti.has(id)) {
      return res.status(404).json({ error: 'Appuntamento non trovato' });
    }

    const appuntamento = appuntamenti.get(id);
    const tatuatore = tatuatori.get(appuntamento.tatuatore_id);
    const stanza = stanze.get(appuntamento.stanza_id);

    res.json({
      id: appuntamento.id,
      tatuatore_id: appuntamento.tatuatore_id,
      tatuatore_nome: tatuatore?.nome,
      stanza_id: appuntamento.stanza_id,
      stanza_nome: stanza?.nome,
      cliente_telefono: appuntamento.cliente_telefono,
      cliente_nome: appuntamento.cliente_nome,
      orario_inizio: toISO(appuntamento.orario_inizio),
      durata_minuti: appuntamento.durata_minuti,
      note: appuntamento.note,
      stato: appuntamento.stato,
      created_at: toISO(appuntamento.created_at),
      updated_at: toISO(appuntamento.updated_at)
    });
  } catch (error) {
    console.error('Errore nel recupero appuntamento:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// PUT /api/admin/appuntamenti/:id - Modifica appuntamento
app.put('/api/admin/appuntamenti/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const {
      tatuatore_id,
      stanza_id,
      cliente_telefono,
      cliente_nome,
      orario_inizio,
      durata_minuti,
      note,
      stato
    } = req.body || {};

    if (!appuntamenti.has(id)) {
      return res.status(404).json({ error: 'Appuntamento non trovato' });
    }

    const appuntamento = appuntamenti.get(id);

    // Build update data
    const updateData = {};
    if (tatuatore_id !== undefined) updateData.tatuatore_id = tatuatore_id;
    if (stanza_id !== undefined) updateData.stanza_id = stanza_id;
    if (cliente_telefono !== undefined) updateData.cliente_telefono = cliente_telefono;
    if (cliente_nome !== undefined) updateData.cliente_nome = cliente_nome;
    if (orario_inizio !== undefined) updateData.orario_inizio = orario_inizio;
    if (durata_minuti !== undefined) updateData.durata_minuti = durata_minuti;
    if (note !== undefined) updateData.note = note;
    if (stato !== undefined) updateData.stato = stato;

    // Validate data if any changes
    if (Object.keys(updateData).length > 0) {
      const validationErrors = validateAppointmentData(updateData);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'Dati appuntamento non validi',
          details: validationErrors
        });
      }

      // Check availability for time/room changes
      if (updateData.orario_inizio || updateData.stanza_id || updateData.tatuatore_id) {
        const checkStanzaId = updateData.stanza_id || appuntamento.stanza_id;
        const checkTatuatoreId = updateData.tatuatore_id || appuntamento.tatuatore_id;
        const checkStartTime = updateData.orario_inizio ? new Date(updateData.orario_inizio) : appuntamento.orario_inizio;
        const checkDuration = updateData.durata_minuti || appuntamento.durata_minuti;

        const conflicts = checkRoomAvailability(checkStanzaId, checkTatuatoreId, checkStartTime, checkDuration, id);

        // Check if conflicts are blocking (only for "sexy" room)
        const checkStanza = stanze.get(checkStanzaId);
        const hasBlockingConflicts = conflicts.some(conflict => {
          const conflictStanza = stanze.get(conflict.stanza_id);
          return conflictStanza && conflictStanza.no_overbooking;
        });

        if (hasBlockingConflicts) {
          return res.status(409).json({
            error: 'Conflitto di prenotazione',
            conflicts,
            message: 'La stanza "sexy" non permette sovrapposizioni'
          });
        }
      }

      // Apply updates
      Object.assign(appuntamento, updateData);
      appuntamento.updated_at = new Date();
    }

    const tatuatore = tatuatori.get(appuntamento.tatuatore_id);
    const stanza = stanze.get(appuntamento.stanza_id);

    res.json({
      id: appuntamento.id,
      tatuatore_id: appuntamento.tatuatore_id,
      tatuatore_nome: tatuatore?.nome,
      stanza_id: appuntamento.stanza_id,
      stanza_nome: stanza?.nome,
      cliente_telefono: appuntamento.cliente_telefono,
      cliente_nome: appuntamento.cliente_nome,
      orario_inizio: toISO(appuntamento.orario_inizio),
      durata_minuti: appuntamento.durata_minuti,
      note: appuntamento.note,
      stato: appuntamento.stato,
      updated_at: toISO(appuntamento.updated_at)
    });
  } catch (error) {
    console.error('Errore nella modifica appuntamento:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// DELETE /api/admin/appuntamenti/:id - Elimina appuntamento
app.delete('/api/admin/appuntamenti/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;

    if (!appuntamenti.has(id)) {
      return res.status(404).json({ error: 'Appuntamento non trovato' });
    }

    const appuntamento = appuntamenti.get(id);
    appuntamenti.delete(id);

    res.json({
      success: true,
      message: 'Appuntamento eliminato con successo',
      deletedAppointment: {
        id: appuntamento.id,
        tatuatore_id: appuntamento.tatuatore_id,
        stanza_id: appuntamento.stanza_id,
        orario_inizio: toISO(appuntamento.orario_inizio)
      }
    });
  } catch (error) {
    console.error('Errore nell\'eliminazione appuntamento:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// ========== DISPONIBILITA' ENDPOINTS ==========

// GET /api/admin/disponibilita - Verifica disponibilità
app.get('/api/admin/disponibilita', requireAdmin, (req, res) => {
  try {
    const {
      tatuatore_id,
      stanza_id,
      data,
      durata_minuti = 60
    } = req.query;

    if (!data) {
      return res.status(400).json({ error: 'Data obbligatoria' });
    }

    const targetDate = new Date(data);
    const dayStart = new Date(targetDate);
    dayStart.setHours(9, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(21, 0, 0, 0);

    const availableSlots = [];

    // Generate 15-minute slots for the day
    for (let time = new Date(dayStart); time < dayEnd; time.setMinutes(time.getMinutes() + 15)) {
      const slotStart = new Date(time);
      const slotEnd = new Date(slotStart.getTime() + durata_minuti * 60000);

      // Skip if slot goes beyond business hours
      if (slotEnd > dayEnd) continue;

      // Check conflicts
      const conflicts = checkRoomAvailability(
        stanza_id,
        tatuatore_id,
        slotStart,
        durata_minuti
      );

      // Check if slot is available
      const isAvailable = conflicts.length === 0;

      availableSlots.push({
        orario_inizio: toISO(slotStart),
        orario_fine: toISO(slotEnd),
        disponibile: isAvailable,
        durata_minuti,
        conflicts: conflicts.length > 0 ? conflicts : undefined
      });
    }

    res.json({
      data: toISO(targetDate),
      durata_minuti,
      tatuatore_id,
      stanza_id,
      slots_disponibili: availableSlots.filter(slot => slot.disponibile).length,
      total_slots: availableSlots.length,
      slots: availableSlots
    });
  } catch (error) {
    console.error('Errore nel controllo disponibilità:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// ========== INTEGRAZIONE CLIENTI ==========

// GET /api/admin/appuntamenti/cliente/:telefono - Appuntamenti per telefono cliente
app.get('/api/admin/appuntamenti/cliente/:telefono', requireAdmin, (req, res) => {
  try {
    const { telefono } = req.params;

    const customerAppointments = Array.from(appuntamenti.values())
      .filter(app => app.cliente_telefono === telefono)
      .map(appuntamento => {
        const tatuatore = tatuatori.get(appuntamento.tatuatore_id);
        const stanza = stanze.get(appuntamento.stanza_id);

        return {
          id: appuntamento.id,
          tatuatore_nome: tatuatore?.nome,
          stanza_nome: stanza?.nome,
          orario_inizio: toISO(appuntamento.orario_inizio),
          durata_minuti: appuntamento.durata_minuti,
          stato: appuntamento.stato,
          note: appuntamento.note
        };
      })
      .sort((a, b) => new Date(b.orario_inizio) - new Date(a.orario_inizio));

    // Get customer info from existing systems
    let customerInfo = null;

    // Check in gift cards
    for (const [cardId, card] of giftCards.entries()) {
      if (card.phone === telefono) {
        customerInfo = {
          nome: `${card.first_name} ${card.last_name}`,
          email: card.email,
          telefono: card.phone,
          fonte: 'gift_card'
        };
        break;
      }
    }

    // Check in customers from consent
    if (!customerInfo && global.customersFromConsent) {
      const consentCustomer = global.customersFromConsent.get(telefono);
      if (consentCustomer) {
        customerInfo = {
          nome: `${consentCustomer.first_name} ${consentCustomer.last_name}`,
          email: consentCustomer.email,
          telefono: consentCustomer.phone,
          fonte: 'consenso'
        };
      }
    }

    res.json({
      telefono,
      cliente: customerInfo,
      appuntamenti: customerAppointments,
      totale: customerAppointments.length
    });
  } catch (error) {
    console.error('Errore nel recupero appuntamenti cliente:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Admin: create draft
app.post('/api/admin/gift-cards/drafts', requireAdmin, (req, res) => {
  console.log('=== CREATING DRAFT GIFT CARD ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('PUBLIC_BASE_URL:', PUBLIC_BASE_URL);

  const { amount, currency = 'EUR', expires_at = null, notes = null } = req.body || {};
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    console.log('ERROR: Invalid amount:', amount);
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const id = uuidv4();
  const claim_token = uuidv4();
  const claim_token_expires_at = minutesFromNow(CLAIM_TOKEN_TTL_MINUTES);
  const createdAt = now();
  const calculatedExpiresAt = monthsFromDate(createdAt, GIFT_CARD_VALIDITY_MONTHS);

  console.log('Generated IDs:');
  console.log('- Gift card ID:', id);
  console.log('- Claim token:', claim_token);

  const draft = {
    id,
    status: 'draft',
    amount,
    currency,
    expires_at: expires_at ? new Date(expires_at) : calculatedExpiresAt,
    notes,
    claim_token,
    claim_token_expires_at,
    claimed_at: null,
    claimed_by_customer_id: null,
    code: null,
    created_at: createdAt,
    updated_at: createdAt,
  };

  giftCards.set(id, draft);
  tokenIndex.set(claim_token, id);

  const claim_url = `${PUBLIC_BASE_URL}/gift/claim/${claim_token}`;
  console.log('Generated claim URL:', claim_url);

  const response = {
    draft_id: id,
    amount,
    claim_token,
    expires_at: toISO(draft.expires_at),
    claim_url,
    claim_token_expires_at: toISO(claim_token_expires_at),
  };

  console.log('Sending response:', JSON.stringify(response, null, 2));
  return res.status(201).json(response);
});

// Admin: create complete gift card with customer data
app.post('/api/admin/gift-cards/complete', requireAdmin, (req, res) => {
  console.log('=== CREATING COMPLETE GIFT CARD ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('PUBLIC_BASE_URL:', PUBLIC_BASE_URL);

  const { firstName, lastName, phone, amount, currency = 'EUR', expires_at = null, notes = null } = req.body || {};

  // Validation
  if (!firstName || !firstName.trim()) {
    console.log('ERROR: First name is required');
    return res.status(400).json({ error: 'First name is required' });
  }
  if (!lastName || !lastName.trim()) {
    console.log('ERROR: Last name is required');
    return res.status(400).json({ error: 'Last name is required' });
  }
  if (!phone || !phone.trim()) {
    console.log('ERROR: Phone is required');
    return res.status(400).json({ error: 'Phone is required' });
  }
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    console.log('ERROR: Invalid amount:', amount);
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const id = uuidv4();
  const customer_id = uuidv4();
  const code = genCode();
  const createdAt = now();
  const calculatedExpiresAt = monthsFromDate(createdAt, GIFT_CARD_VALIDITY_MONTHS);

  console.log('Generated IDs for complete gift card:');
  console.log('- Gift card ID:', id);
  console.log('- Customer ID:', customer_id);
  console.log('- Generated code:', code);

  const giftCard = {
    id,
    status: 'active',
    amount,
    currency,
    expires_at: expires_at ? new Date(expires_at) : calculatedExpiresAt,
    notes,
    claim_token: null,
    claim_token_expires_at: null,
    claimed_at: createdAt,
    claimed_by_customer_id: customer_id,
    code,
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    email: null,
    phone: phone.trim(),
    birth_date: null,
    dedication: null,
    consents: null,
    created_at: createdAt,
    updated_at: createdAt,
  };

  giftCards.set(id, giftCard);
  codeIndex.set(code, id);

  const redeem_url = `${PUBLIC_BASE_URL}/gift/landing/${id}`;
  console.log('Generated redeem URL:', redeem_url);

  const response = {
    gift_card_id: id,
    amount,
    code,
    expires_at: toISO(giftCard.expires_at),
    redeem_url,
    customer: {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim()
    }
  };

  console.log('Sending complete gift card response:', JSON.stringify(response, null, 2));
  return res.status(201).json(response);
});

// Admin: get all gift cards
app.get('/api/admin/ordini', requireAdmin, handleOrdersList);
app.get('/api/admin/orders', requireAdmin, handleOrdersList);

app.get('/api/admin/gift-cards', requireAdmin, (req, res) => {
  // Disable cache to ensure fresh data after customer updates
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  const allCards = Array.from(giftCards.values())
    .map(card => ({
      id: card.id,
      status: card.status,
      amount: card.amount,
      currency: card.currency,
      code: card.code,
      claim_token: card.claim_token,
      customer_name: (card.first_name && card.last_name) ? `${card.first_name} ${card.last_name}` : null,
      first_name: card.first_name || null,
      last_name: card.last_name || null,
      email: card.email || null,
      phone: card.phone || null,
      birth_date: card.birth_date || null,
      created_at: toISO(card.created_at),
      claimed_at: toISO(card.claimed_at),
      expires_at: toISO(card.expires_at)
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  return res.json({ giftCards: allCards });
});

// Admin: get all drafts
app.get('/api/admin/gift-cards/drafts', requireAdmin, (req, res) => {
  const drafts = Array.from(giftCards.values())
    .filter(gc => gc.status === 'draft')
    .map(draft => ({
      id: draft.id,
      status: draft.status,
      amount: draft.amount,
      currency: draft.currency,
      claim_token: draft.claim_token,
      created_at: toISO(draft.created_at),
      expires_at: toISO(draft.expires_at),
      claim_token_expires_at: toISO(draft.claim_token_expires_at)
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return res.json({ drafts });
});

// Admin: get draft by id
app.get('/api/admin/gift-cards/drafts/:id', requireAdmin, (req, res) => {
  const draft = giftCards.get(req.params.id);
  if (!draft) return res.status(404).json({ error: 'Not found' });
  return res.json({
    id: draft.id,
    status: draft.status,
    amount: draft.amount,
    currency: draft.currency,
    expires_at: toISO(draft.expires_at),
    claim_token_expires_at: toISO(draft.claim_token_expires_at),
    claim_token_used: !!draft.claimed_at,
  });
});

// Admin: get statistics
app.get('/api/admin/gift-cards/stats', requireAdmin, (req, res) => {
  const allCards = Array.from(giftCards.values());
  
  // Count expired cards based on expires_at date
  const expiredByDate = allCards.filter(gc => isExpired(gc)).length;
  
  const stats = {
    total: allCards.length,
    draft: allCards.filter(gc => gc.status === 'draft').length,
    active: allCards.filter(gc => gc.status === 'active').length,
    used: allCards.filter(gc => gc.status === 'used').length,
    expired: allCards.filter(gc => gc.status === 'expired').length,
    expiredByDate: expiredByDate,
    totalRevenue: allCards
      .filter(gc => gc.status === 'draft' || gc.status === 'active' || gc.status === 'used')
      .reduce((sum, gc) => sum + gc.amount, 0),
    pendingRevenue: allCards
      .filter(gc => gc.status === 'draft')
      .reduce((sum, gc) => sum + gc.amount, 0),
    usedRevenue: allCards
      .filter(gc => gc.status === 'used')
      .reduce((sum, gc) => sum + gc.amount, 0)
  };
  
  return res.json(stats);
});

// Admin: get customers list with gift card stats
app.get('/api/admin/customers', requireAdmin, (req, res) => {
  // Disable cache to ensure fresh data after customer updates
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  const customerMap = new Map();
  
  // Aggregate data by customer (using phone as unique identifier)
  Array.from(giftCards.values())
    .filter(card => card.status !== 'draft' && card.first_name && card.last_name && card.phone)
    .forEach(card => {
      const customerKey = card.phone;
      
      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          first_name: card.first_name,
          last_name: card.last_name,
          email: card.email,
          phone: card.phone,
          total_cards: 0,
          active_cards: 0,
          used_cards: 0,
          expired_cards: 0,
          total_amount: 0,
          last_purchase: null
        });
      }
      
      const customer = customerMap.get(customerKey);
      customer.total_cards++;
      customer.total_amount += parseFloat(card.amount);
      
      if (card.status === 'active') {
        if (isExpired(card)) {
          customer.expired_cards++;
        } else {
          customer.active_cards++;
        }
      } else if (card.status === 'used') {
        customer.used_cards++;
      }
      
      // Update last purchase date
      const cardDate = new Date(card.claimed_at || card.created_at);
      if (!customer.last_purchase || cardDate > new Date(customer.last_purchase)) {
        customer.last_purchase = toISO(cardDate);
      }
    });
  
  // Aggiungi e aggiorna i clienti con i dati dei consensi (più completi)
  if (global.customersFromConsent) {
    for (const [customerId, customer] of global.customersFromConsent.entries()) {
      const customerKey = customer.phone;
      
      if (!customerMap.has(customerKey)) {
        // Nuovo cliente creato dal consenso
        customerMap.set(customerKey, {
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.phone,
          birth_date: customer.birth_date,
          birth_place: customer.birth_place,
          fiscal_code: customer.fiscal_code,
          address: customer.address,
          city: customer.city,
          total_cards: 0,
          active_cards: 0,
          used_cards: 0,
          expired_cards: 0,
          total_amount: 0,
          last_purchase: customer.created_at || customer.updated_at,
          created_from_consent: true,
          updated_from_consent: customer.updated_from_consent,
          consent_type: customer.consent_type
        });
      } else {
        // Cliente esistente: aggiorna con i dati più completi del consenso
        const existingCustomer = customerMap.get(customerKey);
        existingCustomer.first_name = customer.first_name;
        existingCustomer.last_name = customer.last_name;
        existingCustomer.email = customer.email || existingCustomer.email;
        existingCustomer.birth_date = customer.birth_date;
        existingCustomer.birth_place = customer.birth_place;
        existingCustomer.fiscal_code = customer.fiscal_code;
        existingCustomer.address = customer.address;
        existingCustomer.city = customer.city;
        existingCustomer.updated_from_consent = true;
        existingCustomer.consent_type = customer.consent_type;
        
        // Aggiorna la data dell'ultimo acquisto se il consenso è più recente
        const consentDate = new Date(customer.updated_at || customer.created_at);
        const lastPurchaseDate = new Date(existingCustomer.last_purchase);
        if (consentDate > lastPurchaseDate) {
          existingCustomer.last_purchase = customer.updated_at || customer.created_at;
        }
      }
    }
  }
  
  const customers = Array.from(customerMap.values())
    .sort((a, b) => new Date(b.last_purchase) - new Date(a.last_purchase));
  
  return res.json({ customers });
});

// Admin: delete gift card
app.delete('/api/admin/gift-cards/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'ID required' });
  
  const gc = giftCards.get(id);
  if (!gc) return res.status(404).json({ error: 'Gift card not found' });
  
  // Only allow deletion of draft, active, or used cards
  if (gc.status !== 'draft' && gc.status !== 'active' && gc.status !== 'used') {
    return res.status(400).json({ 
      error: 'Can only delete draft, active, or used gift cards', 
      currentStatus: gc.status 
    });
  }
  
  // Remove from all indexes
  giftCards.delete(id);
  if (gc.code) {
    codeIndex.delete(gc.code);
  }
  if (gc.claim_token) {
    tokenIndex.delete(gc.claim_token);
  }
  
  return res.json({
    success: true,
    message: 'Gift card deleted successfully',
    deletedCard: {
      id: gc.id,
      status: gc.status,
      amount: gc.amount,
      code: gc.code
    }
  });
});

// Admin: renew gift card expiration
app.put('/api/admin/gift-cards/:id/renew', requireAdmin, (req, res) => {
  const gc = giftCards.get(req.params.id);
  if (!gc) return res.status(404).json({ error: 'Gift card not found' });
  
  // Calculate new expiration date from current date
  const newExpiresAt = monthsFromDate(new Date(), GIFT_CARD_VALIDITY_MONTHS);
  gc.expires_at = newExpiresAt;
  gc.updated_at = now();
  
  // If the gift card was marked as expired, change status back to its previous state
  if (gc.status === 'expired') {
    gc.status = gc.claimed_at ? 'active' : 'draft';
  }
  
  res.json({
    id: gc.id,
    expires_at: toISO(gc.expires_at),
    status: gc.status,
    message: 'Gift card expiration renewed successfully'
  });
});

// Admin: mark gift card as used by code
app.post('/api/admin/gift-cards/mark-used', requireAdmin, (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Code required' });
  
  const id = codeIndex.get(code);
  if (!id) return res.status(404).json({ error: 'Gift card not found' });
  
  const gc = giftCards.get(id);
  if (!gc) return res.status(404).json({ error: 'Gift card not found' });
  
  if (gc.status !== 'active') {
    return res.status(400).json({ 
      error: 'Gift card is not active', 
      currentStatus: gc.status 
    });
  }
  
  // Mark as used
  gc.status = 'used';
  gc.used_at = now();
  gc.updated_at = now();
  
  res.json({
    success: true,
    message: 'Gift card marked as used successfully',
    giftCard: {
      id: gc.id,
      code: gc.code,
      amount: gc.amount,
      currency: gc.currency,
      status: gc.status,
      holder: {
        first_name: gc.first_name,
        last_name: gc.last_name,
        email: gc.email,
        phone: gc.phone
      },
      used_at: toISO(gc.used_at)
    }
  });
});

// Admin: update customer data and sync with gift cards
app.put('/api/admin/customers/:phone', requireAdmin, (req, res) => {
  const { phone } = req.params;
  const { first_name, last_name, email, birth_date, birth_place, fiscal_code, address, city } = req.body || {};
  
  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'First name and last name are required' });
  }
  
  // Find customer in customersFromConsent
  let customerFound = false;
  if (global.customersFromConsent && global.customersFromConsent.has(phone)) {
    const customer = global.customersFromConsent.get(phone);
    customer.first_name = first_name.trim();
    customer.last_name = last_name.trim();
    customer.email = email?.trim() || customer.email || '';
    customer.birth_date = birth_date || customer.birth_date;
    customer.birth_place = birth_place?.trim() || customer.birth_place || '';
    customer.fiscal_code = fiscal_code?.trim() || customer.fiscal_code || '';
    customer.address = address?.trim() || customer.address || '';
    customer.city = city?.trim() || customer.city || '';
    customer.updated_at = new Date().toISOString();
    customerFound = true;
  }
  
  // Update all gift cards with the same phone number
  let updatedCards = 0;
  for (const [cardId, card] of giftCards.entries()) {
    if (card.phone === phone) {
      card.first_name = first_name.trim();
      card.last_name = last_name.trim();
      if (email) card.email = email.trim();
      if (birth_date) card.birth_date = birth_date;
      card.updated_at = now();
      updatedCards++;
      customerFound = true;
    }
  }
  
  if (!customerFound) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  
  res.json({
    success: true,
    message: 'Customer data updated successfully',
    updatedGiftCards: updatedCards,
    customer: {
      phone,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email?.trim() || '',
      updated_at: new Date().toISOString()
    }
  });
});

// Public: get claim details by token (rate limited)
app.get('/api/gift-cards/claim/:token', limiter, (req, res) => {
  console.log('=== GIFT CARD CLAIM REQUEST ===');
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  console.log('Token parameter:', req.params.token);
  console.log('Available tokens in memory:', Array.from(tokenIndex.keys()));

  const id = tokenIndex.get(req.params.token);
  console.log('Token found in index:', !!id);
  console.log('Gift card ID:', id);

  if (!id) {
    console.log('ERROR: Invalid token - not found in tokenIndex');
    return res.status(404).json({
      error: 'Invalid token',
      debug: {
        requestedToken: req.params.token,
        availableTokens: Array.from(tokenIndex.keys()),
        tokenIndexSize: tokenIndex.size
      }
    });
  }

  const gc = giftCards.get(id);
  console.log('Gift card found:', !!gc);
  console.log('Gift card status:', gc?.status);

  if (!gc || gc.status !== 'draft') {
    console.log('ERROR: Token not valid for claim');
    return res.status(400).json({
      error: 'Token not valid for claim',
      debug: {
        giftCardStatus: gc?.status,
        expectedStatus: 'draft',
        giftCardId: id
      }
    });
  }

  if (gc.claim_token_expires_at && now() > gc.claim_token_expires_at) {
    console.log('ERROR: Token expired');
    return res.status(410).json({
      error: 'Token expired',
      debug: {
        expiresAt: toISO(gc.claim_token_expires_at),
        currentTime: toISO(now())
      }
    });
  }

  console.log('Claim request successful');
  return res.json({
    amount: gc.amount,
    currency: gc.currency,
    expires_at: toISO(gc.expires_at)
  });
});

// Public: finalize claim (rate limited)
app.post('/api/gift-cards/claim/:token/finalize', limiter, (req, res) => {
  const id = tokenIndex.get(req.params.token);
  if (!id) return res.status(404).json({ error: 'Invalid token' });
  const gc = giftCards.get(id);
  if (!gc || gc.status !== 'draft') return res.status(400).json({ error: 'Token not valid for claim' });
  if (gc.claim_token_expires_at && now() > gc.claim_token_expires_at) {
    return res.status(410).json({ error: 'Token expired' });
  }
  const { first_name, last_name, email = null, phone = null, birth_date = null, dedication = null, consents = null } = req.body || {};
  if (!first_name || !last_name || !phone) return res.status(400).json({ error: 'First name, last name and phone are required' });

  // Simulate customer creation/update
  const customer_id = uuidv4();

  // Finalize card
  const code = genCode();
  gc.status = 'active';
  gc.claimed_at = now();
  gc.claimed_by_customer_id = customer_id;
  gc.code = code;
  gc.first_name = first_name;
  gc.last_name = last_name;
  gc.email = email;
  gc.phone = phone;
  gc.birth_date = birth_date;
  gc.dedication = dedication;
  gc.consents = consents;
  gc.updated_at = now();

  codeIndex.set(code, id);
  tokenIndex.delete(req.params.token); // one-time use

  const verify_url = `${PUBLIC_BASE_URL}/verify?code=${code}`;
  const landing_url = `${PUBLIC_BASE_URL}/gift/landing/${gc.id}`;
  const qr_payload = landing_url; // use landing page instead of verify

  return res.json({
    id: gc.id,
    status: gc.status,
    amount: gc.amount,
    currency: gc.currency,
    expires_at: toISO(gc.expires_at),
    code,
    first_name,
    last_name,
    qr_code_data: qr_payload,
    landing_url: landing_url,
    holder: { first_name, last_name, email, phone, birth_date },
    dedication,
  });
});

// Verify (GET endpoint for frontend)
app.get('/api/gift-cards/verify/:code', (req, res) => {
  const { code } = req.params;
  if (!code) return res.status(400).json({ error: 'Code required' });
  const id = codeIndex.get(code);
  if (!id) return res.status(404).json({ isValid: false, message: 'Gift Card non trovata' });
  const gc = giftCards.get(id);
  if (!gc) return res.status(404).json({ isValid: false, message: 'Gift Card non trovata' });
  
  if (gc.status === 'active') {
    return res.json({ 
      isValid: true, 
      amount: gc.amount, 
      currency: gc.currency, 
      status: 'active',
      expires_at: toISO(gc.expires_at) 
    });
  }
  if (gc.status === 'used') {
    return res.json({ 
      isValid: true, 
      amount: gc.amount, 
      currency: gc.currency, 
      status: 'claimed',
      expires_at: toISO(gc.expires_at) 
    });
  }
  if (gc.status === 'expired') {
    return res.json({ 
      isValid: false, 
      amount: gc.amount, 
      currency: gc.currency, 
      status: 'expired',
      expires_at: toISO(gc.expires_at) 
    });
  }
  return res.json({ isValid: false, message: 'Gift Card non valida' });
});

// Gift Card Landing Page endpoint
app.get('/api/gift-cards/landing/:id', (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'ID required' });
  
  const gc = giftCards.get(id);
  if (!gc) return res.status(404).json({ error: 'Gift Card non trovata' });
  
  // Return gift card data for landing page
  return res.json({
    id: gc.id,
    amount: gc.amount,
    currency: gc.currency,
    code: gc.code,
    status: gc.status,
    first_name: gc.first_name,
    last_name: gc.last_name,
    phone: gc.phone,
    expires_at: toISO(gc.expires_at),
    created_at: toISO(gc.created_at)
  });
});

// Verify (POST endpoint for backward compatibility)
app.post('/api/gift-cards/verify', (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Code required' });
  const id = codeIndex.get(code);
  if (!id) return res.status(404).json({ status: 'not_found' });
  const gc = giftCards.get(id);
  if (!gc) return res.status(404).json({ status: 'not_found' });
  if (gc.status === 'active') return res.json({ status: 'valid', details: { amount: gc.amount, currency: gc.currency, expires_at: toISO(gc.expires_at) } });
  if (gc.status === 'used') return res.json({ status: 'used' });
  if (gc.status === 'expired') return res.json({ status: 'expired' });
  return res.json({ status: 'not_valid' });
});

// Use
app.post('/api/gift-cards/use', (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Code required' });
  const id = codeIndex.get(code);
  if (!id) return res.status(404).json({ status: 'not_found' });
  const gc = giftCards.get(id);
  if (!gc || gc.status !== 'active') return res.status(400).json({ status: 'not_valid' });
  gc.status = 'used';
  gc.updated_at = now();
  return res.json({ status: 'used' });
});

// Consenso endpoints

// Endpoint per salvare consenso tatuaggio
app.post('/api/consenso/tatuaggio', (req, res) => {
  try {
    const {
      firstName,
      lastName,
      birthDate,
      birthPlace,
      fiscalCode,
      address,
      city,
      phone,
      email,
      tattooDescription,
      tattooPosition,
      tattooSize,
      tattooColors,
      appointmentDate,
      isAdult,
      hasAllergies,
      allergiesDescription,
      hasHepatitis,
      hasHiv,
      hasDiabetes,
      hasHeartProblems,
      hasBloodDisorders,
      isPregnant,
      takesAnticoagulants,
      hasKeloidTendency,
      hasOtherConditions,
      otherConditionsDescription,
      consentInformedTreatment,
      consentDataProcessing,
      consentPhotos,
      type,
      submittedAt
    } = req.body;

    // Validazione campi obbligatori
    if (!firstName?.trim() || !lastName?.trim() || !birthDate || !fiscalCode?.trim() || 
        !phone?.trim() || !tattooDescription?.trim() || !consentInformedTreatment || 
        !consentDataProcessing || !isAdult) {
      return res.status(400).json({ 
        error: 'Campi obbligatori mancanti',
        required: ['firstName', 'lastName', 'birthDate', 'fiscalCode', 'phone', 'tattooDescription', 'consentInformedTreatment', 'consentDataProcessing', 'isAdult']
      });
    }

    // Genera ID univoco per il consenso
    const consensoId = uuidv4();
    
    // Crea oggetto consenso
    const consenso = {
      id: consensoId,
      type: 'tatuaggio',
      // Dati anagrafici
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate,
      birthPlace: birthPlace?.trim() || '',
      fiscalCode: fiscalCode.trim().toUpperCase(),
      address: address?.trim() || '',
      city: city?.trim() || '',
      phone: phone.trim(),
      email: email?.trim() || '',
      
      // Dati del trattamento
      tattooDescription: tattooDescription.trim(),
      tattooPosition: tattooPosition?.trim() || '',
      tattooSize: tattooSize?.trim() || '',
      tattooColors: tattooColors?.trim() || '',
      appointmentDate: appointmentDate || null,
      
      // Stato di salute
      isAdult: !!isAdult,
      hasAllergies: !!hasAllergies,
      allergiesDescription: allergiesDescription?.trim() || '',
      hasHepatitis: !!hasHepatitis,
      hasHiv: !!hasHiv,
      hasDiabetes: !!hasDiabetes,
      hasHeartProblems: !!hasHeartProblems,
      hasBloodDisorders: !!hasBloodDisorders,
      isPregnant: !!isPregnant,
      takesAnticoagulants: !!takesAnticoagulants,
      hasKeloidTendency: !!hasKeloidTendency,
      hasOtherConditions: !!hasOtherConditions,
      otherConditionsDescription: otherConditionsDescription?.trim() || '',
      
      // Consensi
      consentInformedTreatment: !!consentInformedTreatment,
      consentDataProcessing: !!consentDataProcessing,
      consentPhotos: !!consentPhotos,
      
      // Metadati
      submittedAt: submittedAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || ''
    };

    // Controlla se esiste già un cliente con questo numero di telefono
    let existingCustomer = null;
    let existingGiftCard = null;
    for (const [cardId, card] of giftCards.entries()) {
      if (card.phone === phone.trim()) {
        existingCustomer = {
          phone: card.phone,
          firstName: card.first_name,
          lastName: card.last_name,
          email: card.email,
          birthDate: card.birth_date
        };
        existingGiftCard = card;
        break;
      }
    }
    
    if (existingCustomer && existingGiftCard) {
      // Cliente esistente: aggiorna con i dati più completi del consenso e allega il consenso
      const updatedCustomer = {
        id: existingCustomer.phone, // Usa il telefono come ID
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email?.trim() || existingCustomer.email || '',
        phone: phone.trim(),
        birth_date: birthDate,
        birth_place: birthPlace?.trim() || '',
        fiscal_code: fiscalCode?.trim() || '',
        address: address?.trim() || '',
        city: city?.trim() || '',
        updated_at: new Date().toISOString(),
        updated_from_consent: true,
        consent_type: 'tatuaggio'
      };
      
      // Aggiorna anche i dati della gift card esistente
      existingGiftCard.first_name = firstName.trim();
      existingGiftCard.last_name = lastName.trim();
      existingGiftCard.email = email?.trim() || existingGiftCard.email || '';
      existingGiftCard.birth_date = birthDate;
      existingGiftCard.updated_at = now();
      existingGiftCard.updated_from_consent = true;
      
      // Salva il cliente aggiornato
      if (!global.customersFromConsent) {
        global.customersFromConsent = new Map();
      }
      global.customersFromConsent.set(phone.trim(), updatedCustomer);
      
      consenso.customerId = phone.trim(); // Usa il telefono come ID cliente
      consenso.linkedToExistingCustomer = true;
      consenso.updatedExistingCustomer = true;
      consenso.updatedGiftCard = true;
      console.log(`Cliente e gift card esistenti aggiornati con dati consenso tatuaggio: ${firstName} ${lastName} (${phone.trim()})`);
    } else {
      // Nuovo cliente: crea un nuovo cliente con i dati del consenso
      const newCustomerId = uuidv4();
      const newCustomer = {
        id: newCustomerId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email?.trim() || '',
        phone: phone.trim(),
        birth_date: birthDate,
        created_at: new Date().toISOString(),
        created_from_consent: true,
        consent_type: 'tatuaggio'
      };
      
      // Salva il nuovo cliente (per ora in memoria, in futuro nel database)
      // Nota: per ora usiamo una mappa separata per i clienti creati dai consensi
      if (!global.customersFromConsent) {
        global.customersFromConsent = new Map();
      }
      global.customersFromConsent.set(newCustomerId, newCustomer);
      
      consenso.customerId = newCustomerId;
      consenso.linkedToExistingCustomer = false;
      consenso.createdNewCustomer = true;
      console.log(`Nuovo cliente creato dal consenso tatuaggio: ${firstName} ${lastName} (${phone.trim()})`);
    }

    // Salva il consenso
    consensi.set(consensoId, consenso);
    
    console.log(`Nuovo consenso tatuaggio salvato: ${consensoId} per ${firstName} ${lastName}`);
    
    res.status(201).json({
      success: true,
      message: 'Consenso per tatuaggio salvato con successo',
      id: consensoId,
      customerId: consenso.customerId,
      linkedToExistingCustomer: consenso.linkedToExistingCustomer || false,
      createdNewCustomer: consenso.createdNewCustomer || false
    });
    
  } catch (error) {
    console.error('Errore nel salvare consenso tatuaggio:', error);
    res.status(500).json({ 
      error: 'Errore interno del server durante il salvataggio del consenso' 
    });
  }
});

// Endpoint per salvare consenso piercing
app.post('/api/consenso/piercing', (req, res) => {
  try {
    const {
      firstName,
      lastName,
      birthDate,
      birthPlace,
      fiscalCode,
      address,
      city,
      phone,
      email,
      piercingType,
      piercingPosition,
      jewelryType,
      jewelryMaterial,
      appointmentDate,
      isAdult,
      hasAllergies,
      allergiesDescription,
      hasHepatitis,
      hasHiv,
      hasDiabetes,
      hasHeartProblems,
      hasBloodDisorders,
      isPregnant,
      takesAnticoagulants,
      hasKeloidTendency,
      hasOtherConditions,
      otherConditionsDescription,
      consentInformedTreatment,
      consentDataProcessing,
      consentPhotos,
      type,
      submittedAt
    } = req.body;

    // Validazione campi obbligatori
    if (!firstName?.trim() || !lastName?.trim() || !birthDate || !fiscalCode?.trim() || 
        !phone?.trim() || !piercingType?.trim() || !piercingPosition?.trim() || 
        !consentInformedTreatment || !consentDataProcessing || !isAdult) {
      return res.status(400).json({ 
        error: 'Campi obbligatori mancanti',
        required: ['firstName', 'lastName', 'birthDate', 'fiscalCode', 'phone', 'piercingType', 'piercingPosition', 'consentInformedTreatment', 'consentDataProcessing', 'isAdult']
      });
    }

    // Genera ID univoco per il consenso
    const consensoId = uuidv4();
    
    // Crea oggetto consenso
    const consenso = {
      id: consensoId,
      type: 'piercing',
      // Dati anagrafici
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate,
      birthPlace: birthPlace?.trim() || '',
      fiscalCode: fiscalCode.trim().toUpperCase(),
      address: address?.trim() || '',
      city: city?.trim() || '',
      phone: phone.trim(),
      email: email?.trim() || '',
      
      // Dati del trattamento
      piercingType: piercingType.trim(),
      piercingPosition: piercingPosition.trim(),
      jewelryType: jewelryType?.trim() || '',
      jewelryMaterial: jewelryMaterial?.trim() || '',
      appointmentDate: appointmentDate || null,
      
      // Stato di salute
      isAdult: !!isAdult,
      hasAllergies: !!hasAllergies,
      allergiesDescription: allergiesDescription?.trim() || '',
      hasHepatitis: !!hasHepatitis,
      hasHiv: !!hasHiv,
      hasDiabetes: !!hasDiabetes,
      hasHeartProblems: !!hasHeartProblems,
      hasBloodDisorders: !!hasBloodDisorders,
      isPregnant: !!isPregnant,
      takesAnticoagulants: !!takesAnticoagulants,
      hasKeloidTendency: !!hasKeloidTendency,
      hasOtherConditions: !!hasOtherConditions,
      otherConditionsDescription: otherConditionsDescription?.trim() || '',
      
      // Consensi
      consentInformedTreatment: !!consentInformedTreatment,
      consentDataProcessing: !!consentDataProcessing,
      consentPhotos: !!consentPhotos,
      
      // Metadati
      submittedAt: submittedAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || ''
    };

    // Controlla se esiste già un cliente con questo numero di telefono
    let existingCustomer = null;
    let existingGiftCard = null;
    for (const [cardId, card] of giftCards.entries()) {
      if (card.phone === phone.trim()) {
        existingCustomer = {
          phone: card.phone,
          firstName: card.first_name,
          lastName: card.last_name,
          email: card.email,
          birthDate: card.birth_date
        };
        existingGiftCard = card;
        break;
      }
    }
    
    if (existingCustomer && existingGiftCard) {
      // Cliente esistente: aggiorna con i dati più completi del consenso e allega il consenso
      const updatedCustomer = {
        id: existingCustomer.phone, // Usa il telefono come ID
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email?.trim() || existingCustomer.email || '',
        phone: phone.trim(),
        birth_date: birthDate,
        birth_place: birthPlace?.trim() || '',
        fiscal_code: fiscalCode?.trim() || '',
        address: address?.trim() || '',
        city: city?.trim() || '',
        updated_at: new Date().toISOString(),
        updated_from_consent: true,
        consent_type: 'piercing'
      };
      
      // Aggiorna anche i dati della gift card esistente
      existingGiftCard.first_name = firstName.trim();
      existingGiftCard.last_name = lastName.trim();
      existingGiftCard.email = email?.trim() || existingGiftCard.email || '';
      existingGiftCard.birth_date = birthDate;
      existingGiftCard.updated_at = now();
      existingGiftCard.updated_from_consent = true;
      
      // Salva il cliente aggiornato
      if (!global.customersFromConsent) {
        global.customersFromConsent = new Map();
      }
      global.customersFromConsent.set(phone.trim(), updatedCustomer);
      
      consenso.customerId = phone.trim(); // Usa il telefono come ID cliente
      consenso.linkedToExistingCustomer = true;
      consenso.updatedExistingCustomer = true;
      consenso.updatedGiftCard = true;
      console.log(`Cliente e gift card esistenti aggiornati con dati consenso piercing: ${firstName} ${lastName} (${phone.trim()})`);
    } else {
      // Nuovo cliente: crea un nuovo cliente con i dati del consenso
      const newCustomerId = uuidv4();
      const newCustomer = {
        id: newCustomerId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email?.trim() || '',
        phone: phone.trim(),
        birth_date: birthDate,
        created_at: new Date().toISOString(),
        created_from_consent: true,
        consent_type: 'piercing'
      };
      
      // Salva il nuovo cliente (per ora in memoria, in futuro nel database)
      // Nota: per ora usiamo una mappa separata per i clienti creati dai consensi
      if (!global.customersFromConsent) {
        global.customersFromConsent = new Map();
      }
      global.customersFromConsent.set(newCustomerId, newCustomer);
      
      consenso.customerId = newCustomerId;
      consenso.linkedToExistingCustomer = false;
      consenso.createdNewCustomer = true;
      console.log(`Nuovo cliente creato dal consenso piercing: ${firstName} ${lastName} (${phone.trim()})`);
    }

    // Salva il consenso
    consensi.set(consensoId, consenso);
    
    console.log(`Nuovo consenso piercing salvato: ${consensoId} per ${firstName} ${lastName}`);
    
    res.status(201).json({
      success: true,
      message: 'Consenso per piercing salvato con successo',
      id: consensoId,
      customerId: consenso.customerId,
      linkedToExistingCustomer: consenso.linkedToExistingCustomer || false,
      createdNewCustomer: consenso.createdNewCustomer || false
    });
    
  } catch (error) {
    console.error('Errore nel salvare consenso piercing:', error);
    res.status(500).json({ 
      error: 'Errore interno del server durante il salvataggio del consenso' 
    });
  }
});

// Endpoint admin per visualizzare tutti i consensi
app.get('/api/admin/consensi', requireAdmin, (req, res) => {
  try {
    const allConsensi = Array.from(consensi.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      consensi: allConsensi,
      total: allConsensi.length,
      tatuaggi: allConsensi.filter(c => c.type === 'tatuaggio').length,
      piercing: allConsensi.filter(c => c.type === 'piercing').length
    });
  } catch (error) {
    console.error('Errore nel recuperare consensi:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Endpoint admin per visualizzare un consenso specifico
app.get('/api/admin/consensi/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const consenso = consensi.get(id);
    
    if (!consenso) {
      return res.status(404).json({ error: 'Consenso non trovato' });
    }
    
    res.json(consenso);
  } catch (error) {
    console.error('Errore nel recuperare consenso:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Admin: get consents by customer phone
app.get('/api/admin/customers/:phone/consensi', requireAdmin, (req, res) => {
  const { phone } = req.params;
  
  const customerConsents = [];
  for (const [id, consenso] of consensi.entries()) {
    if (consenso.phone === phone) {
      customerConsents.push({
        id: consenso.id,
        type: consenso.type,
        submittedAt: consenso.submittedAt,
        createdAt: consenso.createdAt,
        linkedToExistingCustomer: consenso.linkedToExistingCustomer,
        createdNewCustomer: consenso.createdNewCustomer
      });
    }
  }
  
  res.json({ 
    phone,
    consents: customerConsents,
    total: customerConsents.length
  });
});

// Admin: delete specific consent by ID
app.delete('/api/admin/consensi/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Tentativo di eliminazione consenso: ${id}`);
    console.log(`Consensi attualmente in memoria: ${consensi.size}`);
    
    if (!consensi.has(id)) {
      console.log(`Consenso ${id} non trovato. Consensi disponibili:`, Array.from(consensi.keys()));
      return res.status(404).json({ error: 'Consenso non trovato' });
    }
    
    const consenso = consensi.get(id);
    consensi.delete(id);
    
    console.log(`Consenso eliminato: ${id} per ${consenso.firstName} ${consenso.lastName}`);
    
    res.json({ 
      success: true, 
      message: 'Consenso eliminato con successo',
      deletedConsent: {
        id: consenso.id,
        type: consenso.type,
        firstName: consenso.firstName,
        lastName: consenso.lastName
      }
    });
  } catch (error) {
    console.error('Errore nell\'eliminare consenso:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});



// Health check endpoint for Docker
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Global error handler to ensure JSON responses on unexpected errors
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3001;

(async () => {
  await initSchema();
  seedOrders();
  app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
  });
})();
