const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Tạo bảng
pool.query(`
  CREATE TABLE IF NOT EXISTS cookies (
    id SERIAL PRIMARY KEY,
    cookie TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// API lưu cookie
app.post('/save', async (req, res) => {
  try {
    const { cookie } = req.body;
    if (!cookie) return res.status(400).json({ error: 'Thiếu cookie' });
    
    const result = await pool.query(
      'INSERT INTO cookies (cookie) VALUES ($1) RETURNING id',
      [cookie]
    );
    
    res.json({ success: true, id: result.rows[0].id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API lấy danh sách
app.get('/list', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cookies ORDER BY id DESC');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API lấy cookie mới nhất
app.get('/latest', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM cookies ORDER BY id DESC LIMIT 1'
    );
    res.json(result.rows[0] || null);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API xóa cookie
app.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM cookies WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = app;
