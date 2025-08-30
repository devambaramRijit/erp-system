const http = require('http');
const url = require('url');
const querystring = require('querystring');

// Mock inventory data
let inventoryItems = [
  {
    id: '1',
    sku: 'ITEM001',
    name: 'Laptop Computer',
    description: 'High-performance laptop for business use',
    quantity: 15,
    price: 999.99,
    category: 'Electronics',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    sku: 'ITEM002',
    name: 'Office Chair',
    description: 'Ergonomic office chair with lumbar support',
    quantity: 32,
    price: 249.99,
    category: 'Furniture',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    sku: 'ITEM003',
    name: 'Wireless Mouse',
    description: 'Bluetooth wireless mouse with precision tracking',
    quantity: 75,
    price: 29.99,
    category: 'Electronics',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    sku: 'ITEM004',
    name: 'Desk Lamp',
    description: 'LED desk lamp with adjustable brightness',
    quantity: 24,
    price: 49.99,
    category: 'Office Supplies',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock user sessions
const sessions = {};

// Helper function to set CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// Helper function to parse request body
function parseBody(req, callback) {
  let body = '';

  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const parsedBody = JSON.parse(body);
      callback(null, parsedBody);
    } catch (err) {
      callback(err, null);
    }
  });
}

// Create server
const server = http.createServer((req, res) => {
  // Set CORS headers
  setCorsHeaders(res);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // Parse URL
  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname;

  // Route handling
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }

      const { email, password } = body;

      if (email && password) {
        const sessionId = Math.random().toString(36).substring(2);
        const user = {
          id: '1',
          name: 'Demo User',
          email: email,
          role: 'admin'
        };

        sessions[sessionId] = { user };

        res.setHeader('Set-Cookie', `sessionId=${sessionId}; HttpOnly; SameSite=Lax`);
        res.end(JSON.stringify({
          user,
          message: 'Login successful'
        }));
      } else {
        res.statusCode = 401;
        res.end(JSON.stringify({
          message: 'Invalid email or password'
        }));
      }
    });
  } 
  else if (pathname === '/api/auth/logout' && req.method === 'POST') {
    const cookies = req.headers.cookie ? req.headers.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {}) : {};

    const sessionId = cookies.sessionId;

    if (sessionId && sessions[sessionId]) {
      delete sessions[sessionId];
    }

    res.setHeader('Set-Cookie', 'sessionId=; Max-Age=0; HttpOnly; SameSite=Lax');
    res.end(JSON.stringify({ message: 'Logged out successfully' }));
  }
  else if (pathname === '/api/auth/me' && req.method === 'GET') {
    const cookies = req.headers.cookie ? req.headers.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {}) : {};

    const sessionId = cookies.sessionId;

    if (sessionId && sessions[sessionId]) {
      res.end(JSON.stringify({ user: sessions[sessionId].user }));
    } else {
      res.statusCode = 401;
      res.end(JSON.stringify({
        message: 'Not authenticated'
      }));
    }
  }
  else if (pathname === '/api/inventory' && req.method === 'GET') {
    res.end(JSON.stringify(inventoryItems));
  }
  else if (pathname.startsWith('/api/inventory/') && req.method === 'GET') {
    const id = pathname.split('/')[3];
    const item = inventoryItems.find(item => item.id === id);

    if (!item) {
      res.statusCode = 404;
      res.end(JSON.stringify({ message: 'Item not found' }));
      return;
    }

    res.end(JSON.stringify(item));
  }
  else if (pathname === '/api/inventory' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }

      const { sku, name, description, quantity, price, category } = body;

      if (!sku || !name || !category) {
        res.statusCode = 400;
        res.end(JSON.stringify({ message: 'SKU, name, and category are required' }));
        return;
      }

      const newItem = {
        id: Math.random().toString(36).substr(2, 9),
        sku,
        name,
        description: description || '',
        quantity: Number(quantity) || 0,
        price: Number(price) || 0,
        category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      inventoryItems.push(newItem);
      res.statusCode = 201;
      res.end(JSON.stringify(newItem));
    });
  }
  else if (pathname.startsWith('/api/inventory/') && req.method === 'PUT') {
    const id = pathname.split('/')[3];
    const itemIndex = inventoryItems.findIndex(item => item.id === id);

    if (itemIndex === -1) {
      res.statusCode = 404;
      res.end(JSON.stringify({ message: 'Item not found' }));
      return;
    }

    parseBody(req, (err, body) => {
      if (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }

      const { sku, name, description, quantity, price, category } = body;

      if (!sku || !name || !category) {
        res.statusCode = 400;
        res.end(JSON.stringify({ message: 'SKU, name, and category are required' }));
        return;
      }

      inventoryItems[itemIndex] = {
        ...inventoryItems[itemIndex],
        sku,
        name,
        description: description || inventoryItems[itemIndex].description,
        quantity: Number(quantity) || inventoryItems[itemIndex].quantity,
        price: Number(price) || inventoryItems[itemIndex].price,
        category,
        updatedAt: new Date().toISOString()
      };

      res.end(JSON.stringify(inventoryItems[itemIndex]));
    });
  }
  else if (pathname.startsWith('/api/inventory/') && req.method === 'DELETE') {
    const id = pathname.split('/')[3];
    const itemIndex = inventoryItems.findIndex(item => item.id === id);

    if (itemIndex === -1) {
      res.statusCode = 404;
      res.end(JSON.stringify({ message: 'Item not found' }));
      return;
    }

    inventoryItems.splice(itemIndex, 1);
    res.statusCode = 204;
    res.end();
  }
  else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});