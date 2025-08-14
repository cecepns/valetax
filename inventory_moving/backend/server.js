const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'your-secret-key-here';

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'inventory_moving'
};

let db;

// Initialize database connection
async function initDB() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes
// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const [users] = await db.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, username, role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Items routes
app.get('/api/items', authenticateToken, async (req, res) => {
  try {
    const [items] = await db.execute(`
      SELECT i.*, COALESCE(s.current_stock, 0) as current_stock
      FROM items i
      LEFT JOIN (
        SELECT item_id, 
               SUM(CASE WHEN type = 'in' THEN quantity ELSE 0 END) - 
               SUM(CASE WHEN type = 'out' THEN quantity ELSE 0 END) as current_stock
        FROM transactions 
        GROUP BY item_id
      ) s ON i.id = s.item_id
      ORDER BY i.created_at DESC
    `);
    
    res.json(items);
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/items', authenticateToken, async (req, res) => {
  try {
    const { name, code, category, unit, min_stock, price, description } = req.body;
    
    // Check if code already exists
    const [existing] = await db.execute(
      'SELECT id FROM items WHERE code = ?',
      [code]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Item code already exists' });
    }

    const [result] = await db.execute(
      'INSERT INTO items (name, code, category, unit, min_stock, price, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, code, category, unit, min_stock, price, description]
    );

    res.status(201).json({ 
      message: 'Item created successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/items/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, category, unit, min_stock, price, description } = req.body;
    
    // Check if code already exists for different item
    const [existing] = await db.execute(
      'SELECT id FROM items WHERE code = ? AND id != ?',
      [code, id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Item code already exists' });
    }

    await db.execute(
      'UPDATE items SET name = ?, code = ?, category = ?, unit = ?, min_stock = ?, price = ?, description = ?, updated_at = NOW() WHERE id = ?',
      [name, code, category, unit, min_stock, price, description, id]
    );

    res.json({ message: 'Item updated successfully' });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/items/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if item has transactions
    const [transactions] = await db.execute(
      'SELECT COUNT(*) as count FROM transactions WHERE item_id = ?',
      [id]
    );

    if (transactions[0].count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete item with existing transactions' 
      });
    }

    await db.execute('DELETE FROM items WHERE id = ?', [id]);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Transactions routes
app.get('/api/transactions/receiving', authenticateToken, async (req, res) => {
  try {
    const [transactions] = await db.execute(`
      SELECT t.*, i.name as item_name, i.code as item_code, i.unit as item_unit
      FROM transactions t
      JOIN items i ON t.item_id = i.id
      WHERE t.type = 'in'
      ORDER BY t.date DESC, t.created_at DESC
    `);
    
    res.json(transactions);
  } catch (error) {
    console.error('Get receiving transactions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/transactions/issuing', authenticateToken, async (req, res) => {
  try {
    const [transactions] = await db.execute(`
      SELECT t.*, i.name as item_name, i.code as item_code, i.unit as item_unit
      FROM transactions t
      JOIN items i ON t.item_id = i.id
      WHERE t.type = 'out'
      ORDER BY t.date DESC, t.created_at DESC
    `);
    
    res.json(transactions);
  } catch (error) {
    console.error('Get issuing transactions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const { item_id, quantity, type, date, supplier, recipient, notes } = req.body;
    
    // Check if sufficient stock for 'out' transactions
    if (type === 'out') {
      const [stockResult] = await db.execute(`
        SELECT 
          SUM(CASE WHEN type = 'in' THEN quantity ELSE 0 END) - 
          SUM(CASE WHEN type = 'out' THEN quantity ELSE 0 END) as current_stock
        FROM transactions 
        WHERE item_id = ?
      `, [item_id]);

      const currentStock = stockResult[0].current_stock || 0;
      
      if (currentStock < quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock. Available: ${currentStock}` 
        });
      }
    }

    const [result] = await db.execute(
      'INSERT INTO transactions (item_id, quantity, type, date, supplier, recipient, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [item_id, quantity, type, date, supplier, recipient, notes, req.user.id]
    );

    res.status(201).json({ 
      message: 'Transaction created successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { item_id, quantity, type, date, supplier, recipient, notes } = req.body;
    
    // Get original transaction
    const [original] = await db.execute(
      'SELECT * FROM transactions WHERE id = ?',
      [id]
    );

    if (original.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check stock for 'out' transactions
    if (type === 'out') {
      const [stockResult] = await db.execute(`
        SELECT 
          SUM(CASE WHEN type = 'in' THEN quantity ELSE 0 END) - 
          SUM(CASE WHEN type = 'out' THEN quantity ELSE 0 END) as current_stock
        FROM transactions 
        WHERE item_id = ? AND id != ?
      `, [item_id, id]);

      const currentStock = stockResult[0].current_stock || 0;
      
      if (currentStock < quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock. Available: ${currentStock}` 
        });
      }
    }

    await db.execute(
      'UPDATE transactions SET item_id = ?, quantity = ?, type = ?, date = ?, supplier = ?, recipient = ?, notes = ?, updated_at = NOW() WHERE id = ?',
      [item_id, quantity, type, date, supplier, recipient, notes, id]
    );

    res.json({ message: 'Transaction updated successfully' });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM transactions WHERE id = ?', [id]);
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Dashboard routes
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    // Total inventory
    const [totalInventory] = await db.execute(`
      SELECT COUNT(DISTINCT item_id) as total
      FROM transactions
    `);

    // Total in and out
    const [totals] = await db.execute(`
      SELECT 
        SUM(CASE WHEN type = 'in' THEN quantity ELSE 0 END) as total_in,
        SUM(CASE WHEN type = 'out' THEN quantity ELSE 0 END) as total_out
      FROM transactions
    `);

    // Reorder items
    const [reorderItems] = await db.execute(`
      SELECT COUNT(*) as count
      FROM (
        SELECT i.id, i.min_stock,
               COALESCE(SUM(CASE WHEN t.type = 'in' THEN t.quantity ELSE 0 END) - 
               SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) as current_stock
        FROM items i
        LEFT JOIN transactions t ON i.id = t.item_id
        GROUP BY i.id, i.min_stock
        HAVING current_stock <= min_stock
      ) reorder
    `);

    // Monthly data (last 6 months)
    const [monthlyData] = await db.execute(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        SUM(CASE WHEN type = 'in' THEN quantity ELSE 0 END) as total_in,
        SUM(CASE WHEN type = 'out' THEN quantity ELSE 0 END) as total_out
      FROM transactions
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month
    `);

    // Category data
    const [categoryData] = await db.execute(`
      SELECT 
        i.category,
        COUNT(DISTINCT i.id) as total_items
      FROM items i
      GROUP BY i.category
    `);

    // Stock analysis with turnover ratio
    const [stockAnalysis] = await db.execute(`
      SELECT 
        i.id, i.name, i.code, i.category, i.unit,
        COALESCE(SUM(CASE WHEN t.type = 'in' THEN t.quantity ELSE 0 END), 0) as total_in,
        COALESCE(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) as total_out,
        COALESCE(SUM(CASE WHEN t.type = 'in' THEN t.quantity ELSE 0 END) - 
        SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) as current_stock,
        CASE 
          WHEN AVG(CASE WHEN t.type = 'in' THEN t.quantity ELSE NULL END) > 0 
          THEN COALESCE(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) / 
               AVG(CASE WHEN t.type = 'in' THEN t.quantity ELSE NULL END)
          ELSE 0 
        END as turnover_ratio
      FROM items i
      LEFT JOIN transactions t ON i.id = t.item_id
      GROUP BY i.id, i.name, i.code, i.category, i.unit
    `);

    // Categorize based on turnover ratio
    const fastMoving = stockAnalysis.filter(item => Number(item.turnover_ratio) >= 2.0)
      .sort((a, b) => Number(b.turnover_ratio) - Number(a.turnover_ratio));
    
    const slowMoving = stockAnalysis.filter(item => Number(item.turnover_ratio) >= 0.5 && Number(item.turnover_ratio) < 2.0)
      .sort((a, b) => Number(a.turnover_ratio) - Number(b.turnover_ratio));
    
    const deadStock = stockAnalysis.filter(item => Number(item.turnover_ratio) < 0.5 && Number(item.current_stock) > 0);

    // Convert turnover_ratio to numbers for consistency
    const convertToNumbers = (items) => items.map(item => ({
      ...item,
      turnover_ratio: Number(item.turnover_ratio),
      total_in: Number(item.total_in),
      total_out: Number(item.total_out),
      current_stock: Number(item.current_stock)
    }));

    res.json({
      totalInventory: totalInventory[0].total,
      totalIn: totals[0].total_in || 0,
      totalOut: totals[0].total_out || 0,
      reorderItems: reorderItems[0].count,
      monthlyData,
      categoryData,
      fastMoving: convertToNumbers(fastMoving.slice(0, 10)),
      slowMoving: convertToNumbers(slowMoving.slice(0, 10)),
      deadStock: convertToNumbers(deadStock.slice(0, 10))
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reports routes
app.get('/api/reports', authenticateToken, async (req, res) => {
  try {
    // Stock report
    const [stockReport] = await db.execute(`
      SELECT 
        i.id, i.name, i.code, i.category, i.unit, i.min_stock, i.price,
        COALESCE(SUM(CASE WHEN t.type = 'in' THEN t.quantity ELSE 0 END) - 
        SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) as current_stock
      FROM items i
      LEFT JOIN transactions t ON i.id = t.item_id
      GROUP BY i.id, i.name, i.code, i.category, i.unit, i.min_stock, i.price
      ORDER BY i.name
    `);

    // Fast moving analysis
    const [fastMoving] = await db.execute(`
      SELECT 
        i.id, i.name, i.code, i.category, i.unit,
        COALESCE(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) as total_out,
        CASE 
          WHEN AVG(CASE WHEN t.type = 'in' THEN t.quantity ELSE NULL END) > 0 
          THEN COALESCE(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) / 
               AVG(CASE WHEN t.type = 'in' THEN t.quantity ELSE NULL END)
          ELSE 0 
        END as turnover_ratio
      FROM items i
      LEFT JOIN transactions t ON i.id = t.item_id
      GROUP BY i.id, i.name, i.code, i.category, i.unit
      HAVING turnover_ratio >= 2.0
      ORDER BY turnover_ratio DESC
    `);

    // Slow moving analysis
    const [slowMoving] = await db.execute(`
      SELECT 
        i.id, i.name, i.code, i.category, i.unit,
        COALESCE(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) as total_out,
        CASE 
          WHEN AVG(CASE WHEN t.type = 'in' THEN t.quantity ELSE NULL END) > 0 
          THEN COALESCE(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) / 
               AVG(CASE WHEN t.type = 'in' THEN t.quantity ELSE NULL END)
          ELSE 0 
        END as turnover_ratio
      FROM items i
      LEFT JOIN transactions t ON i.id = t.item_id
      GROUP BY i.id, i.name, i.code, i.category, i.unit
      HAVING turnover_ratio >= 0.5 AND turnover_ratio < 2.0
      ORDER BY turnover_ratio ASC
    `);

    // Dead stock analysis
    const [deadStock] = await db.execute(`
      SELECT 
        i.id, i.name, i.code, i.category, i.unit, i.price,
        COALESCE(SUM(CASE WHEN t.type = 'in' THEN t.quantity ELSE 0 END) - 
        SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) as current_stock,
        MAX(CASE WHEN t.type = 'out' THEN t.date ELSE NULL END) as last_out_date
      FROM items i
      LEFT JOIN transactions t ON i.id = t.item_id
      GROUP BY i.id, i.name, i.code, i.category, i.unit, i.price
      HAVING (
        (last_out_date IS NULL OR last_out_date < DATE_SUB(CURDATE(), INTERVAL 6 MONTH))
        AND current_stock > 0
      ) OR (
        CASE 
          WHEN AVG(CASE WHEN t.type = 'in' THEN t.quantity ELSE NULL END) > 0 
          THEN COALESCE(SUM(CASE WHEN t.type = 'out' THEN t.quantity ELSE 0 END), 0) / 
               AVG(CASE WHEN t.type = 'in' THEN t.quantity ELSE NULL END)
          ELSE 0 
        END < 0.5 AND current_stock > 0
      )
      ORDER BY last_out_date ASC
    `);

    // Convert turnover_ratio to numbers for consistency
    const convertToNumbers = (items) => items.map(item => ({
      ...item,
      turnover_ratio: Number(item.turnover_ratio),
      total_out: Number(item.total_out),
      current_stock: Number(item.current_stock)
    }));

    res.json({
      stockReport,
      fastMoving: convertToNumbers(fastMoving),
      slowMoving: convertToNumbers(slowMoving),
      deadStock: convertToNumbers(deadStock)
    });
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start server
async function startServer() {
  await initDB();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();