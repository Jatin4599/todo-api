require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Use in-memory storage if no DATABASE_URL set (for testing)
if (process.env.DATABASE_URL) {
  const pool = require('./db');

  app.get('/todos', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/todos', async (req, res) => {
    try {
      const { title } = req.body;
      if (!title) return res.status(400).json({ error: 'Title required' });
      const result = await pool.query(
        'INSERT INTO todos (title) VALUES ($1) RETURNING *', [title]
      );
      res.status(201).json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.patch('/todos/:id', async (req, res) => {
    try {
      const { done, title } = req.body;
      const result = await pool.query(
        `UPDATE todos SET done = COALESCE($1, done), title = COALESCE($2, title)
         WHERE id = $3 RETURNING *`,
        [done, title, req.params.id]
      );
      if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/todos/:id', async (req, res) => {
    try {
      const result = await pool.query(
        'DELETE FROM todos WHERE id = $1 RETURNING id', [req.params.id]
      );
      if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
      res.status(204).send();
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

} else {
  // In-memory mode for tests
  let todos = [];
  let nextId = 1;

  app.get('/todos', (req, res) => res.json(todos));

  app.post('/todos', (req, res) => {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const todo = { id: nextId++, title, done: false };
    todos.push(todo);
    res.status(201).json(todo);
  });

  app.patch('/todos/:id', (req, res) => {
    const todo = todos.find(t => t.id === parseInt(req.params.id));
    if (!todo) return res.status(404).json({ error: 'Not found' });
    if (req.body.done !== undefined) todo.done = req.body.done;
    if (req.body.title) todo.title = req.body.title;
    res.json(todo);
  });

  app.delete('/todos/:id', (req, res) => {
    const idx = todos.findIndex(t => t.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    todos.splice(idx, 1);
    res.status(204).send();
  });
}

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => console.log(`API on port ${PORT}`));
module.exports = app;