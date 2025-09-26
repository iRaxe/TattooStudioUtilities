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

// Admin: create draft
app.post('/api/admin/gift-cards/drafts', requireAdmin, (req, res) => {
  const { amount, currency = 'EUR', expires_at = null, notes = null } = req.body || {};
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  const id = uuidv4();
  const claim_token = uuidv4();
  const claim_token_expires_at = minutesFromNow(CLAIM_TOKEN_TTL_MINUTES);
  const createdAt = now();
  const calculatedExpiresAt = monthsFromDate(createdAt, GIFT_CARD_VALIDITY_MONTHS);
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
  return res.status(201).json({
    draft_id: id,
    amount,
    claim_token,
    expires_at: toISO(draft.expires_at),
    claim_url,
    claim_token_expires_at: toISO(claim_token_expires_at),
  });
});

// Admin: create complete gift card with customer data
app.post('/api/admin/gift-cards/complete', requireAdmin, (req, res) => {
  const { firstName, lastName, phone, amount, currency = 'EUR', expires_at = null, notes = null } = req.body || {};
  
  // Validation
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
  
  const id = uuidv4();
  const customer_id = uuidv4();
  const code = genCode();
  const createdAt = now();
  const calculatedExpiresAt = monthsFromDate(createdAt, GIFT_CARD_VALIDITY_MONTHS);
  
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
  
  return res.status(201).json({
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
  });
});

// Admin: get all gift cards
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
  const id = tokenIndex.get(req.params.token);
  if (!id) return res.status(404).json({ error: 'Invalid token' });
  const gc = giftCards.get(id);
  if (!gc || gc.status !== 'draft') return res.status(400).json({ error: 'Token not valid for claim' });
  if (gc.claim_token_expires_at && now() > gc.claim_token_expires_at) {
    return res.status(410).json({ error: 'Token expired' });
  }
  return res.json({ amount: gc.amount, currency: gc.currency, expires_at: toISO(gc.expires_at) });
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
  const qr_payload = verify_url; // keep simple

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
  app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
  });
})();
