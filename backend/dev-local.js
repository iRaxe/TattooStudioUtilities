// Development server con SQLite locale
require('dotenv').config({ path: '.env.local' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Use SQLite for local development
const db = require('./db-local');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for development
  message: 'Troppe richieste da questo IP'
});
app.use(limiter);

// Middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token di accesso richiesto' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token non valido o scaduto' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), mode: 'development-sqlite' });
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username e password richiesti' });
    }

    // Simple admin check for development
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign(
        { username, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({ token, message: 'Login effettuato con successo' });
    } else {
      res.status(401).json({ message: 'Credenziali non valide' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Errore interno del server' });
  }
});

// Create draft gift card
app.post('/api/admin/gift-cards/drafts', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Importo valido richiesto' });
    }

    const claimToken = uuidv4();
    const landingToken = uuidv4();
    const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';

    const result = await db.query(
      `INSERT INTO gift_cards (amount, claim_token, landing_token, status) 
       VALUES (?, ?, ?, 'draft')`,
      [amount, claimToken, landingToken]
    );

    const claimUrl = `${baseUrl}/gift/claim/${claimToken}`;
    const landingUrl = `${baseUrl}/gift/landing/${landingToken}`;

    res.json({
      success: true,
      draft_id: result.insertId,
      claim_token: claimToken,
      landing_token: landingToken,
      claim_url: claimUrl,
      landing_url: landingUrl,
      amount: parseFloat(amount)
    });
  } catch (error) {
    console.error('Create draft error:', error);
    res.status(500).json({ message: 'Errore interno del server' });
  }
});

// Get gift card for landing page
app.get('/api/gift-cards/landing/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const result = await db.query(
      'SELECT * FROM gift_cards WHERE landing_token = ?',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Gift card non trovata' });
    }

    const giftCard = result.rows[0];
    res.json({
      id: giftCard.id,
      amount: giftCard.amount,
      status: giftCard.status,
      first_name: giftCard.first_name,
      last_name: giftCard.last_name,
      dedication: giftCard.dedication,
      expires_at: giftCard.expires_at,
      created_at: giftCard.created_at
    });
  } catch (error) {
    console.error('Get landing gift card error:', error);
    res.status(500).json({ message: 'Errore interno del server' });
  }
});

// Get gift card for claim
app.get('/api/gift-cards/claim/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const result = await db.query(
      'SELECT * FROM gift_cards WHERE claim_token = ? AND status = "draft"',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Gift card non trovata o già utilizzata' });
    }

    const giftCard = result.rows[0];
    res.json({
      id: giftCard.id,
      amount: giftCard.amount,
      status: giftCard.status
    });
  } catch (error) {
    console.error('Get claim gift card error:', error);
    res.status(500).json({ message: 'Errore interno del server' });
  }
});

// Claim gift card
app.post('/api/gift-cards/claim/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { first_name, last_name, email, phone, dedication } = req.body;

    if (!first_name || !last_name || !phone) {
      return res.status(400).json({ message: 'Nome, cognome e telefono sono obbligatori' });
    }

    // Check if gift card exists and is draft
    const checkResult = await db.query(
      'SELECT * FROM gift_cards WHERE claim_token = ? AND status = "draft"',
      [token]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Gift card non trovata o già utilizzata' });
    }

    const giftCard = checkResult.rows[0];
    const landingToken = giftCard.landing_token;
    const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';

    // Update gift card
    await db.query(
      `UPDATE gift_cards 
       SET first_name = ?, last_name = ?, email = ?, phone = ?, dedication = ?, 
           status = 'active', claimed_at = CURRENT_TIMESTAMP
       WHERE claim_token = ?`,
      [first_name, last_name, email, phone, dedication, token]
    );

    // Insert or update customer
    await db.query(
      `INSERT OR REPLACE INTO customers 
       (phone, first_name, last_name, email, updated_at) 
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [phone, first_name, last_name, email]
    );

    const landingUrl = `${baseUrl}/gift/landing/${landingToken}`;

    res.json({
      success: true,
      message: 'Gift card personalizzata con successo!',
      landing_url: landingUrl
    });
  } catch (error) {
    console.error('Claim gift card error:', error);
    res.status(500).json({ message: 'Errore interno del server' });
  }
});

// Get all gift cards (admin)
app.get('/api/admin/gift-cards', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM gift_cards ORDER BY created_at DESC'
    );

    res.json({ giftCards: result.rows });
  } catch (error) {
    console.error('Get gift cards error:', error);
    res.status(500).json({ message: 'Errore interno del server' });
  }
});

// Get draft gift cards (admin)
app.get('/api/admin/gift-cards/drafts', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM gift_cards WHERE status = "draft" ORDER BY created_at DESC'
    );

    res.json({ drafts: result.rows });
  } catch (error) {
    console.error('Get draft gift cards error:', error);
    res.status(500).json({ message: 'Errore interno del server' });
  }
});

// Get stats (admin)
app.get('/api/admin/gift-cards/stats', authenticateToken, async (req, res) => {
  try {
    const totalResult = await db.query('SELECT COUNT(*) as count FROM gift_cards');
    const activeResult = await db.query('SELECT COUNT(*) as count FROM gift_cards WHERE status = "active"');
    const draftResult = await db.query('SELECT COUNT(*) as count FROM gift_cards WHERE status = "draft"');
    const usedResult = await db.query('SELECT COUNT(*) as count FROM gift_cards WHERE status = "used"');
    const expiredResult = await db.query('SELECT COUNT(*) as count FROM gift_cards WHERE status = "expired"');
    const totalRevenueResult = await db.query('SELECT SUM(amount) as total FROM gift_cards WHERE status IN ("draft", "active", "used")');
    const usedRevenueResult = await db.query('SELECT SUM(amount) as total FROM gift_cards WHERE status = "used"');

    res.json({
      total: totalResult.rows[0].count,
      active: activeResult.rows[0].count,
      draft: draftResult.rows[0].count,
      used: usedResult.rows[0].count,
      expired: expiredResult.rows[0].count,
      totalRevenue: totalRevenueResult.rows[0].total || 0,
      usedRevenue: usedRevenueResult.rows[0].total || 0
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Errore interno del server' });
  }
});

// Get customers (admin)
app.get('/api/admin/customers', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, COUNT(g.id) as total_cards
      FROM customers c
      LEFT JOIN gift_cards g ON c.phone = g.phone
      GROUP BY c.phone
      ORDER BY c.created_at DESC
    `);

    res.json({ customers: result.rows });
  } catch (error) {
    console.error('Delete gift card error:', error);
    res.status(500).json({ message: 'Errore interno del server' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Percorso non trovato' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await db.initSchema();
    
    app.listen(PORT, () => {
      console.log(`🚀 Development server running on port ${PORT}`);
      console.log(`📊 Using SQLite database for local development`);
      console.log(`🌐 CORS enabled for: http://localhost:3000, http://localhost:5173`);
      console.log(`🔑 Admin credentials: ${process.env.ADMIN_USERNAME}/${process.env.ADMIN_PASSWORD}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();