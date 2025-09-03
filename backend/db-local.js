const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, 'tinkstudio_local.db');
const db = new sqlite3.Database(dbPath);

// Initialize database schema
const initSchema = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create tables
      db.run(`CREATE TABLE IF NOT EXISTS gift_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount DECIMAL(10,2) NOT NULL,
        claim_token VARCHAR(255) UNIQUE NOT NULL,
        landing_token VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(20),
        dedication TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        claimed_at DATETIME,
        used_at DATETIME
      )`);
      
      db.run(`CREATE TABLE IF NOT EXISTS customers (
        phone VARCHAR(20) PRIMARY KEY,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        email VARCHAR(255),
        birth_date DATE,
        birth_place VARCHAR(255),
        fiscal_code VARCHAR(16),
        address TEXT,
        city VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      
      console.log('✅ Database schema initialized (SQLite)');
      resolve();
    });
  });
};

// Database query functions
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve({ rows });
      });
    } else {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ rowCount: this.changes, insertId: this.lastID });
      });
    }
  });
};

module.exports = {
  query,
  initSchema,
  db
};
