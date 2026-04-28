const request = require('supertest');
const app = require('./index');

describe('Todo API', () => {
  test('GET /todos returns empty array', async () => {
    const res = await request(app).get('/todos');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /todos creates a todo', async () => {
    const res = await request(app)
      .post('/todos')
      .send({ title: 'Learn DevOps' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Learn DevOps');
    expect(res.body.done).toBe(false);
  });

  test('POST /todos without title returns 400', async () => {
    const res = await request(app).post('/todos').send({});
    expect(res.status).toBe(400);
  });

  test('DELETE /todos/:id removes a todo', async () => {
    const create = await request(app)
      .post('/todos').send({ title: 'Delete me' });
    const id = create.body.id;
    const del = await request(app).delete(`/todos/${id}`);
    expect(del.status).toBe(204);
  });
});