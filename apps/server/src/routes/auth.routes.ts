import { Router } from 'express';
import { userLoginSchema, User } from '@shared/schema/user';
import { validateRequest } from '../middleware/validation';
import { authenticateUser } from '../services/authService';

const router = Router();

// Login endpoint
router.post('/login', validateRequest(userLoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authenticateUser(email, password);

    if (result.success && result.user) {
      // Store user in session
      req.session.user = result.user;

      // Return user data
      res.json({
        user: result.user,
        message: 'Login successful'
      });
    } else {
      res.status(401).json({ 
        message: result.message || 'Invalid email or password' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Internal server error during login' 
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ 
        message: 'Could not log out' 
      });
    }

    // Clear the session cookie
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user endpoint
router.get('/me', (req, res) => {
  // Check if user is authenticated via session
  if (req.session && req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ 
      message: 'Not authenticated' 
    });
  }
});

export default router;