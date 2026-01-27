const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

// Login controller
exports.login = async (req, res) => {
  console.log('Login request body:', req.body);
  try {
    const { username, email, password } = req.body;

    // Check if either username/email and password are provided
    const loginIdentifier = username || email;

    if (!loginIdentifier || !password) {
      return res.status(400).json({ message: 'Username/email and password are required' });
    }

    // Find user by username or email
    const user = await User.findOne({ 
      where: {
        [username ? 'username' : 'email']: loginIdentifier
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is disabled' });
    }

    // Compare password
    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      'your_jwt_secret', // In production, use environment variable
      { expiresIn: '24h' }
    );

    // Set user in session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    // Fetch product list from backend
    const db = require('../models');
    const products = await db.Inventory.findAll();

    // Fetch customer list from backend
    const customers = await db.Customer.findAll();

    // Return user info and token
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message, stack: error.stack });
  }
};

// Register controller
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if all required fields are provided
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 8);

    // Create new user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'user'
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      'your_jwt_secret', // In production, use environment variable
      { expiresIn: '24h' }
    );

    // Set user in session
    req.session.user = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    };

    // Return user info and token
    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout controller
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        message: 'Could not log out'
      });
    }

    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  console.log('--- getCurrentUser ---');
  try {
    const user = req.session?.user || req.user;
    console.log('User from session or token:', user);

    if (user) {
      // Fetch product list from backend
      const db = require('../models');
      const products = await db.Inventory.findAll();

      // Fetch customer list from backend
      const customers = await db.Customer.findAll();

      console.log('Returning user data for:', user.username);
      res.json({ 
        user: user,
        products,
        customers
      });
    } else {
      console.log('Not authenticated.');
      res.status(401).json({
        message: 'Not authenticated'
      });
    }
  } catch (error) {
    console.error('Error getting current user data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all app data (products and customers)
exports.getAppData = async (req, res) => {
  try {
    // Fetch product list from backend
    const db = require('../models');
    const products = await db.Inventory.findAll();

    // Fetch customer list from backend
    const customers = await db.Customer.findAll();

    res.json({ 
      products,
      customers
    });
  } catch (error) {
    console.error('Error getting app data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.refreshToken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ message: 'Token is required' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret', { ignoreExpiration: true });
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const newToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      'your_jwt_secret',
      { expiresIn: '24h' }
    );

    res.json({ token: newToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};
