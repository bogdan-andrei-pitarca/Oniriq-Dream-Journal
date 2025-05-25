const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, ActivityLog } = require('../../models/associations');
const { auth, adminOnly, JWT_SECRET } = require('../../middleware/auth');
const { Op } = require('sequelize');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log('Registration attempt:', { username, email });

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists with this email or username' 
      });
    }

    const user = await User.create({ username, email, password });
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    
    // Don't send password in response
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    res.status(201).json({ user: userResponse, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ 
      error: error.message || 'Registration failed',
      details: error.errors ? error.errors.map(e => e.message) : undefined
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email });
    
    const user = await User.findOne({ where: { email } });
    
    if (!user || !(await user.validatePassword(password))) {
      throw new Error('Invalid login credentials');
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    
    // Don't send password in response
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    res.json({ user: userResponse, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'role']
    });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monitored users (admin only)
router.get('/monitored', auth, adminOnly, async (req, res) => {
  try {
    const monitoredUsers = await User.findAll({
      where: { isMonitored: true },
      attributes: ['id', 'username', 'email', 'role']
    });
    res.json(monitoredUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user activity (admin only)
router.get('/activity/:userId', auth, adminOnly, async (req, res) => {
  try {
    const activities = await ActivityLog.findAll({
      where: { userId: req.params.userId },
      order: [['timestamp', 'DESC']],
      limit: 100
    });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 