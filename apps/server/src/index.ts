const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

// Import routes
const authRoutes = require('./routes/auth.routes').default;
const inventoryRoutes = require('./routes/inventory.routes').default;

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/products', inventoryRoutes);

// Serve static files from the client build (if it exists)
app.use(express.static(path.join(__dirname, '../../client/dist')));

// Fallback for API routes (for development)
app.get('/api/auth/me', (req, res) => {
  // Mock user data - in a real app, you would validate the session/token
  if (req.session && req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.json({ user: null });
  }
});

// Catch-all route for client-side routing in production
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});