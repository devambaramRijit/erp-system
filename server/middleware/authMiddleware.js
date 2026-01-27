const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  console.log('--- authMiddleware ---');
  console.log('Request Path:', req.path);
  console.log('Session:', req.session);

  // Check for session-based authentication
  if (req.session && req.session.user) {
    console.log('Session found for user:', req.session.user.username);
    return next();
  }
  console.log('No session found.');

  // Fallback to token-based authentication
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    console.log('Bearer token found.');
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('Token:', token);

      // Verify token
      const decoded = jwt.verify(token, 'your_jwt_secret');
      console.log('Token decoded:', decoded);

      // Get user from the token
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (user) {
        console.log('User found from token:', user.username);
        // Attach user to the request object
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        };

        // Also, create a session for subsequent requests
        console.log('Creating session for user:', user.username);
        req.session.user = req.user;
      } else {
        console.log('User not found for token.');
      }

      console.log('req.user:', req.user);
      console.log('req.session.user:', req.session.user);
      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      // Don't send a 401 response here, just let it proceed
      // If a route requires authentication, it will handle the unauthenticated case
      next();
    }
  } else {
    console.log('No bearer token found.');
    next();
  }
};

const isAuthenticated = (req, res, next) => {
  console.log('--- isAuthenticated ---');
  console.log('Request Path:', req.path);
  console.log('Session User:', req.session?.user);
  console.log('Request User:', req.user);

  if (req.session?.user || req.user) {
    console.log('User is authenticated.');
    return next();
  }
  
  console.log('User is not authenticated.');
  res.status(401).json({ message: 'Unauthorized' });
};

module.exports = { authMiddleware, isAuthenticated };