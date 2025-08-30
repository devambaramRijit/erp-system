import { Router } from 'express';

const router = Router();

// Mock user database - in a real app, this would be a database
const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    email: 'user@example.com',
    name: 'Regular User',
    role: 'STAFF',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock password storage - in a real app, passwords would be hashed
const mockPasswords = {
  'admin@example.com': 'admin123',
  'user@example.com': 'user123'
};

// Login endpoint
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = mockUsers.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Check password (in a real app, this would compare hashed passwords)
    if (mockPasswords[user.email] !== password) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Store user in session
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      message: 'Login successful'
    });
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