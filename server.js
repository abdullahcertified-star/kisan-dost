// server.js - Hardened Express Backend for Neon PostgreSQL Authentication
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const { encryptApiKey, decryptApiKey, maskApiKey, hashApiKey } = require('./lib/crypto');
const { getJwtSecret } = require('./lib/env');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = getJwtSecret();

// Simple in-memory rate limiter for Express auth routes
const expressRateLimitMap = new Map();
function checkExpressRateLimit(ip, maxRequests, windowMs) {
  const now = Date.now();
  let record = expressRateLimitMap.get(ip);
  if (!record) {
    record = [];
    expressRateLimitMap.set(ip, record);
  }
  record = record.filter((ts) => now - ts < windowMs);
  expressRateLimitMap.set(ip, record);
  if (record.length >= maxRequests) {
    return false;
  }
  record.push(now);
  return true;
}

// Strictly configured CORS allowlist
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser agents or explicitly whitelisted web origins
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Cross-Origin Request Blocked by Kisan Dost CORS Policy.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));

app.use(express.json({ limit: '50kb' }));
app.use(cookieParser());

// 1. Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Kisan Dost Neon Auth Service', timestamp: new Date() });
});

// 2. Registration Route (/api/register)
app.post('/api/register', async (req, res) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
    if (!checkExpressRateLimit(`reg_${clientIp}`, 5, 60000)) {
      return res.status(429).json({ error: 'Too many registration requests. Please try again in one minute.' });
    }

    const { phone, email, password, name, district, acres, crop, geminiApiKey } = req.body;

    if (!phone || !password || !name || !district) {
      return res.status(400).json({ error: 'Missing required fields: phone, password, name, and district are mandatory.' });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const cleanPhone = phone.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : cleanPhone;

    // Check if user already exists
    const existingCheck = await pool.query(
      'SELECT id FROM farmers WHERE phone = $1 OR (email IS NOT NULL AND email = $2) LIMIT 1',
      [cleanPhone, cleanEmail]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ error: 'This phone number or email is already registered. Please sign in.' });
    }

    // Hash password with bcrypt (salt rounds = 10)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Encrypt Gemini API Key with AES-256-GCM before saving at rest
    const rawApiKey = geminiApiKey && geminiApiKey.trim().length > 5 ? geminiApiKey.trim() : null;
    const encryptedKey = rawApiKey ? encryptApiKey(rawApiKey) : null;

    // Insert into farmers table
    const insertResult = await pool.query(
      `INSERT INTO farmers (phone, email, password_hash, name, district, acres, crop, gemini_api_key, registered_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, phone, email, name, district, acres, crop, gemini_api_key, registered_at`,
      [
        cleanPhone,
        cleanEmail,
        passwordHash,
        name.trim(),
        district.trim(),
        Math.max(0.1, Math.min(10000, Number(acres) || 5)),
        crop || 'Wheat (گندم)',
        encryptedKey,
      ]
    );

    const newUser = insertResult.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, phone: newUser.phone, name: newUser.name, role: 'Farmer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Track active token in kisan_auth_tokens table
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO kisan_auth_tokens (session_token, user_id, role, free_queries_used, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [token, newUser.id, 'Farmer', 0, expiresAt]
    );

    // Set secure HttpOnly cookie
    res.cookie('kisan_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    const safeUser = {
      ...newUser,
      gemini_api_key: maskApiKey(newUser.gemini_api_key),
      has_gemini_key: Boolean(rawApiKey),
      gemini_key_hash: rawApiKey ? hashApiKey(rawApiKey) : null,
    };

    return res.status(201).json({
      success: true,
      message: 'Farmer registered successfully',
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error('[Registration Error]:', error);
    return res.status(500).json({ error: 'An unexpected internal error occurred during registration.' });
  }
});

// 3. Login Route (/api/login)
app.post('/api/login', async (req, res) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
    if (!checkExpressRateLimit(`log_${clientIp}`, 10, 60000)) {
      return res.status(429).json({ error: 'Too many login attempts. Please wait one minute before trying again.' });
    }

    const { phoneOrEmail, password } = req.body;

    if (!phoneOrEmail || !password) {
      return res.status(400).json({ error: 'Invalid phone/email or password.' });
    }

    const inputClean = phoneOrEmail.trim().toLowerCase();

    // Query farmer by phone or email
    const userQuery = await pool.query(
      `SELECT id, phone, email, password_hash, name, district, acres, crop, gemini_api_key, registered_at
       FROM farmers
       WHERE LOWER(phone) = $1 OR (email IS NOT NULL AND LOWER(email) = $1)
       LIMIT 1`,
      [inputClean]
    );

    if (userQuery.rows.length === 0) {
      // Perform constant-time dummy comparison to prevent timing enumeration
      await bcrypt.compare(password, '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345');
      return res.status(401).json({ error: 'Invalid phone/email or password.' });
    }

    const farmer = userQuery.rows[0];

    // Verify password using bcrypt.compare
    const isPasswordValid = await bcrypt.compare(password, farmer.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid phone/email or password.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: farmer.id, phone: farmer.phone, name: farmer.name, role: 'Farmer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Save session tracking row in kisan_auth_tokens
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO kisan_auth_tokens (session_token, user_id, role, free_queries_used, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [token, farmer.id, 'Farmer', 0, expiresAt]
    );

    // Set secure HttpOnly cookie
    res.cookie('kisan_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    const { password_hash, ...restUser } = farmer;
    const safeUser = {
      ...restUser,
      gemini_api_key: maskApiKey(farmer.gemini_api_key),
      has_gemini_key: Boolean(farmer.gemini_api_key),
      gemini_key_hash: farmer.gemini_api_key ? hashApiKey(farmer.gemini_api_key) : null,
    };

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    return res.status(500).json({ error: 'An unexpected internal error occurred during login.' });
  }
});

// 4. Profile Verification Route (/api/me)
app.get('/api/me', async (req, res) => {
  try {
    const token =
      req.cookies.kisan_auth_token ||
      (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!token) {
      return res.status(401).json({ authenticated: false, error: 'No authorization token found.' });
    }

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({ authenticated: false, error: 'Invalid or expired token.' });
    }

    // Query only that specific logged-in user from Neon database
    const userResult = await pool.query(
      `SELECT id, phone, email, name, district, acres, crop, gemini_api_key, registered_at
       FROM farmers
       WHERE id = $1
       LIMIT 1`,
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ authenticated: false, error: 'User record not found.' });
    }

    const rawUser = userResult.rows[0];
    const safeUser = {
      ...rawUser,
      gemini_api_key: maskApiKey(rawUser.gemini_api_key),
      has_gemini_key: Boolean(rawUser.gemini_api_key),
      gemini_key_hash: rawUser.gemini_api_key ? hashApiKey(rawUser.gemini_api_key) : null,
    };

    return res.json({
      authenticated: true,
      user: safeUser,
    });
  } catch (error) {
    console.error('[Profile Verification Error]:', error);
    return res.status(500).json({ error: 'Failed to verify user profile.' });
  }
});

// 5. Logout Route (/api/logout)
app.post('/api/logout', async (req, res) => {
  try {
    const token =
      req.cookies.kisan_auth_token ||
      (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (token) {
      await pool.query('DELETE FROM kisan_auth_tokens WHERE session_token = $1', [token]);
    }

    // Clear HttpOnly cookie
    res.clearCookie('kisan_auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    console.error('[Logout Error]:', error);
    return res.status(500).json({ error: 'Logout failed.' });
  }
});

app.listen(PORT, () => {
  console.log(`🌾 Kisan Dost Neon Auth Server running on port ${PORT}`);
});

module.exports = app;
