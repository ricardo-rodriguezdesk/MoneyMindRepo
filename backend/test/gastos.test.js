// HU04 — Testing: cada prueba corresponde a un paso de la tarjeta "Construir y probar la gestión de gastos (CRUD)"
import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { setupTestApp, cleanTables, validUser } from './helpers.js';

describe('HU04 · Gestión de gastos', () => {
  let app;
  let db;
  let token;
  const auth = () => ({ Authorization: `Bearer ${token}` });
  const crear = (body) => request(app).post('/api/gastos').set(auth()).send(body);
  const lista = (query = '') => request(app).get(`/api/gastos${query}`).set(auth());

  before(async () => ({ app, db } = await setupTestApp()));
  beforeEach(async () => {
    await cleanTables(db);
    const res = await request(app).post('/api/auth/register').send(validUser);
    token = res.body.token;
  });
  after(() => db.end());

  it('Paso 1 · cuenta sin gastos → la lista viene vacía (la app muestra el mensaje guía)', async () => {
    const res = await lista();
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.gastos, []);
    assert.equal(res.body.total, 0);
  });

  it('Paso 2 · gasto válido → aparece en la lista en menos de 2 segundos', async () => {
    const inicio = Date.now();
    const creado = await crear({ descripcion: 'Tacos con amigos', monto: 145 });
    const res = await lista();
    const ms = Date.now() - inicio;
    assert.equal(creado.status, 201);
    assert.equal(creado.body.gasto.categoria.nombre, 'Otros'); // categoría temporal hasta HU05
    assert.equal(res.body.gastos[0].descripcion, 'Tacos con amigos');
    assert.equal(res.body.gastos[0].monto, 145);
    assert.ok(ms < 2000, `tardó ${ms} ms`);
  });

  it('Paso 3 · sin monto → "Ingresa un monto" y no guarda', async () => {
    const res = await crear({ descripcion: 'Sin monto' });
    assert.equal(res.status, 422);
    assert.equal(res.body.errors.monto, 'Ingresa un monto');
    assert.equal((await lista()).body.total, 0);
  });

  it('Paso 4 · fecha anterior → se guarda con la fecha elegida', async () => {
    const res = await crear({ descripcion: 'Cine', monto: 220, fecha: '2026-10-01' });
    assert.equal(res.status, 201);
    assert.equal(res.body.gasto.fecha, '2026-10-01');
  });

  it('Paso 5 · editar un gasto → el cambio se ve en la lista del dashboard', async () => {
    const { body } = await crear({ descripcion: 'Uber', monto: 89.5 });
    const res = await request(app)
      .put(`/api/gastos/${body.gasto.id}`)
      .set(auth())
      .send({ descripcion: 'Uber al trabajo', monto: 120, fecha: body.gasto.fecha });
    assert.equal(res.status, 200);
    const [gasto] = (await lista()).body.gastos;
    assert.equal(gasto.descripcion, 'Uber al trabajo');
    assert.equal(gasto.monto, 120);
  });

  it('Paso 6 · eliminar un gasto → desaparece de la lista', async () => {
    const { body } = await crear({ descripcion: 'Café', monto: 60 });
    const del = await request(app).delete(`/api/gastos/${body.gasto.id}`).set(auth());
    assert.equal(del.status, 204);
    assert.equal((await lista()).body.total, 0);
  });

  it('Paso 7 · cancelar la eliminación → el gasto sigue ahí (no se llama a DELETE)', async () => {
    await crear({ descripcion: 'Café', monto: 60 });
    // Cancelar en la app no hace ninguna petición: el gasto permanece
    assert.equal((await lista()).body.total, 1);
  });

  it('Dashboard · muestra los últimos 10, del más reciente al más antiguo', async () => {
    for (let i = 1; i <= 12; i++) {
      await crear({
        descripcion: `Gasto ${i}`,
        monto: i,
        fecha: `2026-09-${String(i).padStart(2, '0')}`,
      });
    }
    const res = await lista();
    assert.equal(res.body.gastos.length, 10);
    assert.equal(res.body.total, 12);
    assert.equal(res.body.gastos[0].descripcion, 'Gasto 12');
    assert.equal(res.body.gastos[9].descripcion, 'Gasto 3');
  });

  it('Validaciones · monto cero/negativo, descripción vacía y fecha futura', async () => {
    assert.equal(
      (await crear({ descripcion: 'x', monto: 0 })).body.errors.monto,
      'El monto debe ser mayor a 0'
    );
    assert.equal(
      (await crear({ descripcion: 'x', monto: -5 })).body.errors.monto,
      'El monto debe ser mayor a 0'
    );
    assert.equal(
      (await crear({ descripcion: 'x', monto: 10.555 })).body.errors.monto,
      'Usa máximo 2 decimales'
    );
    assert.equal(
      (await crear({ descripcion: '  ', monto: 10 })).body.errors.descripcion,
      'Escribe una descripción'
    );
    const futura = await crear({ descripcion: 'x', monto: 10, fecha: '2999-01-01' });
    assert.equal(futura.body.errors.fecha, 'La fecha no puede ser futura');
    assert.equal((await lista()).body.total, 0);
  });

  it('Seguridad · un usuario no ve ni modifica los gastos de otro, y sin sesión no hay acceso', async () => {
    const { body } = await crear({ descripcion: 'Privado', monto: 99 });
    const otro = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'otro@ejemplo.com' });
    const otroAuth = { Authorization: `Bearer ${otro.body.token}` };

    assert.equal((await request(app).get('/api/gastos').set(otroAuth)).body.total, 0);
    const put = await request(app)
      .put(`/api/gastos/${body.gasto.id}`)
      .set(otroAuth)
      .send({ descripcion: 'Hackeado', monto: 1 });
    assert.equal(put.status, 404);
    assert.equal(
      (await request(app).delete(`/api/gastos/${body.gasto.id}`).set(otroAuth)).status,
      404
    );
    assert.equal((await request(app).get('/api/gastos')).status, 401);
    assert.equal((await lista()).body.gastos[0].descripcion, 'Privado');
  });
});
