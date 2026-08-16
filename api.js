const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query(`
  CREATE TABLE IF NOT EXISTS cookies (
    id SERIAL PRIMARY KEY,
    cookie TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// ========== TRANG CHỦ ==========
app.get('/', (req, res) => {
  res.send(`
    <h1>🍪 FB Cookie API</h1>
    <p>Server đang chạy ✅</p>
    <hr>
    <h3>📋 Danh sách API:</h3>
    <ul>
      <li><b>POST</b> /save - Lưu cookie</li>
      <li><b>GET</b> /list - Xem danh sách cookie</li>
      <li><b>GET</b> /latest - Xem cookie mới nhất</li>
      <li><b>DELETE</b> /delete/:id - Xóa cookie theo ID</li>
    </ul>
    <hr>
    <p>🔗 <a href="/list">📂 Xem danh sách cookie</a></p>
  `);
});

// ========== API ==========
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

app.get('/list', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cookies ORDER BY id DESC');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

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
