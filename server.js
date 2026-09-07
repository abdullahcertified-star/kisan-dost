// server.js - Express Backend for Neon PostgreSQL Authentication
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_kisan_dost_key_123!';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// 1. Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Kisan Dost Neon Auth Service', timestamp: new Date() });
});

// 2. Registration Route (/api/register)
app.post('/api/register', async (req, res) => {
  try {
    const { phone, email, password, name, district, acres, crop, geminiApiKey } = req.body;

    if (!phone || !password || !name || !district) {
      return res.status(400).json({ error: 'Missing required fields: phone, password, name, district are mandatory.' });
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

    // Insert into farmers table
    const insertResult = await pool.query(
      `INSERT INTO farmers (phone, email, password_hash, name, district, acres, crop, gemini_api_key, registered_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, phone, email, name, district, acres, crop, registered_at`,
      [
        cleanPhone,
        cleanEmail,
        passwordHash,
        name.trim(),
        district.trim(),
        Number(acres) || 5,
        crop || 'Wheat (گندم)',
        geminiApiKey ? geminiApiKey.trim() : null,
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

    return res.status(201).json({
      success: true,
      message: 'Farmer registered successfully',
      token,
      user: newUser,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error during registration: ' + error.message });
  }
});

// 3. Login Route (/api/login)
app.post('/api/login', async (req, res) => {
  try {
    const { phoneOrEmail, password } = req.body;

    if (!phoneOrEmail || !password) {
      return res.status(400).json({ error: 'Please provide phone/email and password.' });
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
      return res.status(401).json({ error: 'No account found with this phone number or email. Please register first.' });
    }

    const farmer = userQuery.rows[0];

    // Verify password using bcrypt.compare
    const isPasswordValid = await bcrypt.compare(password, farmer.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Incorrect password. Please verify and try again.' });
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

    const { password_hash, ...safeUser } = farmer;

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login: ' + error.message });
  }
});

// 4. Profile Verification Route (/api/me)
app.get('/api/me', async (req, res) => {
  try {
    // Read from HttpOnly cookie or Authorization header
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

    // Query *only* that specific logged-in user from Neon database
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

    return res.json({
      authenticated: true,
      user: userResult.rows[0],
    });
  } catch (error) {
    console.error('Profile verification error:', error);
    return res.status(500).json({ error: 'Failed to verify user profile: ' + error.message });
  }
});

// 5. Logout Route (/api/logout)
app.post('/api/logout', async (req, res) => {
  try {
    const token = req.cookies.kisan_auth_token;
    if (token) {
      // Remove or invalidate active token in database
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
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Logout failed: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🌾 Kisan Dost Neon Auth Server running on port ${PORT}`);
});

module.exports = app;
