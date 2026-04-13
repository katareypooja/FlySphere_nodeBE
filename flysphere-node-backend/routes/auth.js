const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

// ✅ Create Users Table (if not exists)
router.get('/init', async (req, res) => {
  try {
    await pool.query(`DROP TABLE IF EXISTS users;`);
    await pool.query(`
      CREATE TABLE users (
        UserId VARCHAR(50) PRIMARY KEY,
        FirstName VARCHAR(50) NOT NULL,
        LastName VARCHAR(50) NOT NULL,
        Phone VARCHAR(15) NOT NULL,
        Email VARCHAR(100) UNIQUE NOT NULL,
        Password VARCHAR(255) NOT NULL,
        Role VARCHAR(20) DEFAULT 'USER'
      );
    `);
    res.json({ message: '✅ Users table recreated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating table' });
  }
});

// ✅ Register API
router.post('/register', async (req, res) => {
  const { userId, firstName, lastName, phone, email, password } = req.body;

  // ✅ Validate userId (only letters & numbers)
  const userIdRegex = /^[a-zA-Z0-9]+$/;
  if (!userIdRegex.test(userId)) {
    return res.status(400).json({ error: 'User ID must contain only letters and numbers' });
  }

  // ✅ Strict password validation (min 8, at least 1 letter + 1 number)
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error: 'Password must be minimum 8 characters and contain at least 1 letter and 1 number'
    });
  }

  // ✅ International Phone Validation (+ followed by 7–15 digits)
  const phoneRegex = /^\+\d{7,15}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({
      error: 'Invalid international phone number format'
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (UserId, FirstName, LastName, Phone, Email, Password) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, firstName, lastName, phone, email, hashedPassword]
    );

    res.json({ message: '✅ User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'User already exists or DB error' });
  }
});

// ✅ Login API
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user.userid, email: user.email, role: user.role },
      'secretkey123',
      { expiresIn: '1h' }
    );

    res.json({ 
      message: '✅ Login successful', 
      token,
      role: user.role
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

const authenticateToken = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/roleMiddleware');

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT UserId, FirstName, LastName, Phone, Email, Role FROM users WHERE UserId = $1',
      [userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.get('/admin', authenticateToken, authorizeRole('ADMIN'), (req, res) => {
  res.json({ message: 'Welcome Admin! You have full access.' });
});

module.exports = router;
