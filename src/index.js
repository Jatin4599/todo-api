require('dotenv').config();
const express = require('express');
const pool = require('./db');
const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/todos', async (req, res) => {
  const result = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
  res.json(result.rows);
});

app.post('/todos', async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const result = await pool.query(
    'INSERT INTO todos (title) VALUES ($1) RETURNING *',
    [title]
  );
  res.status(201).json(result.rows[0]);
});

app.patch('/todos/:id', async (req, res) => {
  const { done, title } = req.body;
  const result = await pool.query(
    `UPDATE todos SET
      done = COALESCE($1, done),
      title = COALESCE($2, title)
     WHERE id = $3 RETURNING *`,
    [done, title, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

app.delete('/todos/:id', async (req, res) => {
  const result = await pool.query(
    'DELETE FROM todos WHERE id = $1 RETURNING id',
    [req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API on port ${PORT}`));
module.exports = app;