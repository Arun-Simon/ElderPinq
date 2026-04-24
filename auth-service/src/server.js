const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// ──────────────────────────────────────────────
// ROUTES
// ──────────────────────────────────────────────

// Kubernetes liveness / readiness probe
app.get('/health', (req, res) =>
  res.status(200).json({ status: 'ok', service: 'auth-service' })
);

app.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, hashedPassword, role || 'family']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header missing or malformed' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query(
      'SELECT id, username, role FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, username, role FROM users WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────
// SEED — creates demo users if the table is empty
// ──────────────────────────────────────────────
async function seedDemoUsers() {
  try {
    const { rows } = await pool.query('SELECT COUNT(*) AS cnt FROM users');
    if (parseInt(rows[0].cnt, 10) > 0) {
      console.log('ℹ️  Users table already has data — skipping seed.');
      return;
    }
    const elderHash  = await bcrypt.hash('password123', 10);
    const familyHash = await bcrypt.hash('password123', 10);
    await pool.query(
      `INSERT INTO users (username, password, role) VALUES
        ($1, $2, 'elder'),
        ($3, $4, 'family')
       ON CONFLICT (username) DO NOTHING`,
      ['grandma', elderHash, 'daughter', familyHash]
    );
    console.log("✅ Demo users seeded → grandma (elder) / daughter (family) — password: password123");
  } catch (err) {
    console.error('⚠️  Seeding failed:', err.message);
  }
}

// ──────────────────────────────────────────────
// STARTUP
// ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

async function start() {
  // Wait for a valid DB connection before seeding / starting
  let retries = 10;
  while (retries--) {
    try {
      await pool.query('SELECT 1');
      break;
    } catch {
      console.log(`⏳ Waiting for database… (${retries} retries left)`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  await seedDemoUsers();
  app.listen(PORT, () => {
    console.log(`Auth service running on port ${PORT}`);
  });
}

start();
