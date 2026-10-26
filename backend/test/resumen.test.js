// HU06 — Testing: cada prueba corresponde a un paso de la tarjeta "Construir y probar el total del mes y su desglose por categoría"
import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { limitesDelMes } from '../src/resumen.js';
import { setupTestApp, cleanTables, validUser } from './helpers.js';

describe('HU06 · Total del mes y desglose por categoría', () => {
  let app;
  let db;
  let token;
  let idUsuario;
  let hoy;
  let finMesAnterior;
  const auth = () => ({ Authorization: `Bearer ${token}` });
  const resumen = () => request(app).get('/api/resumen/mes').set(auth());

  /** Inserta un gasto directo en la BD para poder elegir categoría y fecha. */
  async function gasto(categoria, monto, fecha = hoy, usuario = idUsuario) {
    const [[cat]] = await db.query('SELECT id_categoria FROM categorias WHERE nombre = ?', [
      categoria,
    ]);
    await db.query(
      `INSERT INTO gastos (id_usuario, id_categoria, monto, descripcion, fecha_gasto)
       VALUES (?, ?, ?, ?, ?)`,
      [usuario, cat.id_categoria, monto, `Gasto de ${categoria}`, fecha]
    );
  }

  before(async () => {
    ({ app, db } = await setupTestApp());
  });
  beforeEach(async () => {
    await cleanTables(db);
    const res = await request(app).post('/api/auth/register').send(validUser);
    token = res.body.token;
    idUsuario = await idDelUsuario();
    const [[fechas]] = await db.query(
      `SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS hoy,
              DATE_FORMAT(DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 DAY), '%Y-%m-%d') AS fin`
    );
    hoy = fechas.hoy;
    finMesAnterior = fechas.fin;
  });
  after(() => db.end());

  async function idDelUsuario() {
    const [[fila]] = await db.query('SELECT id_usuario FROM usuarios WHERE email = ?', [
      validUser.email,
    ]);
    return fila.id_usuario;
  }

  it('Paso 1 · usuario con gastos en el mes → el total coincide con la suma de sus gastos', async () => {
    await gasto('Comida', 820);
    await gasto('Transporte', 240.5);
    await gasto('Entretenimiento', 180);
    const res = await resumen();
    assert.equal(res.status, 200);
    assert.equal(res.body.total, 1240.5);
    assert.equal(res.body.hasta, hoy);
    assert.equal(res.body.mes, hoy.slice(0, 7));
  });

  it('Paso 2 · gastos en 3 categorías → el desglose sale de mayor a menor con su porcentaje', async () => {
    await gasto('Entretenimiento', 180);
    await gasto('Comida', 820);
    await gasto('Transporte', 240.5);
    const { categorias } = (await resumen()).body;
    assert.deepEqual(
      categorias.map((c) => [c.nombre, c.total, c.porcentaje]),
      [
        ['Comida', 820, 66],
        ['Transporte', 240.5, 19],
        ['Entretenimiento', 180, 15],
      ]
    );
  });

  it('Paso 2b · varios gastos de una misma categoría se suman en una sola fila', async () => {
    await gasto('Comida', 100.1);
    await gasto('Comida', 50.2);
    const { categorias, total } = (await resumen()).body;
    assert.equal(categorias.length, 1);
    assert.equal(categorias[0].total, 150.3);
    assert.equal(total, 150.3);
  });

  it('Paso 3 · registrar un gasto nuevo y volver a pedir el resumen → total y desglose cambian solos', async () => {
    await gasto('Comida', 100);
    const antes = (await resumen()).body;
    const creado = await request(app)
      .post('/api/gastos')
      .set(auth())
      .send({ descripcion: 'Tacos', monto: 160 });
    assert.equal(creado.status, 201);
    const despues = (await resumen()).body;
    assert.equal(antes.total, 100);
    assert.equal(despues.total, 260);
    assert.deepEqual(
      despues.categorias.map((c) => c.nombre),
      ['Otros', 'Comida'] // 160 en "Otros" (categoría temporal hasta HU05) supera a 100 en "Comida"
    );
  });

  it('Paso 3b · eliminar un gasto → el total baja', async () => {
    await gasto('Comida', 100);
    const creado = await request(app)
      .post('/api/gastos')
      .set(auth())
      .send({ descripcion: 'Tacos', monto: 160 });
    await request(app).delete(`/api/gastos/${creado.body.gasto.id}`).set(auth());
    assert.equal((await resumen()).body.total, 100);
  });

  it('Paso 4 · usuario sin gastos este mes → total en 0 y sin categorías (la app muestra el aviso)', async () => {
    const res = await resumen();
    assert.equal(res.status, 200);
    assert.equal(res.body.total, 0);
    assert.deepEqual(res.body.categorias, []);
  });

  it('Paso 5 · gasto de un mes anterior → no cuenta en el total del mes actual', async () => {
    await gasto('Comida', 500, finMesAnterior);
    await gasto('Transporte', 40);
    const res = (await resumen()).body;
    assert.equal(res.total, 40);
    assert.deepEqual(
      res.categorias.map((c) => c.nombre),
      ['Transporte']
    );
  });

  it('Paso 6 · categorías de ingreso no cuentan y los gastos de otro usuario tampoco', async () => {
    await gasto('Comida', 100);
    await gasto('Sueldo', 9000); // categoría de tipo ingreso
    const otro = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'otro@ejemplo.com' });
    const [[fila]] = await db.query('SELECT id_usuario FROM usuarios WHERE email = ?', [
      'otro@ejemplo.com',
    ]);
    assert.ok(otro.body.token);
    await gasto('Comida', 777, hoy, fila.id_usuario);
    assert.equal((await resumen()).body.total, 100);
  });

  it('Paso 7 · empate de montos → se ordena por nombre de categoría', async () => {
    await gasto('Transporte', 100);
    await gasto('Comida', 100);
    const { categorias } = (await resumen()).body;
    assert.deepEqual(
      categorias.map((c) => c.nombre),
      ['Comida', 'Transporte']
    );
  });

  it('Paso 8 · sin sesión iniciada → 401', async () => {
    const res = await request(app).get('/api/resumen/mes');
    assert.equal(res.status, 401);
  });
});

describe('HU06 · límites del mes', () => {
  it('el último día del mes y el primero del siguiente caen en meses distintos', () => {
    assert.deepEqual(limitesDelMes('2026-10-31'), {
      mes: '2026-10',
      desde: '2026-10-01',
      hasta: '2026-11-01',
    });
    assert.equal(limitesDelMes('2026-11-01').mes, '2026-11');
  });

  it('diciembre pasa al enero del año siguiente', () => {
    assert.deepEqual(limitesDelMes('2026-12-15'), {
      mes: '2026-12',
      desde: '2026-12-01',
      hasta: '2027-01-01',
    });
  });
});
