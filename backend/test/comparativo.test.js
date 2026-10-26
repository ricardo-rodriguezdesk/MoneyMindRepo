// HU07 — Testing: cada prueba corresponde a un paso de la tarjeta "Construir y probar el comparativo mensual de gastos"
import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { primerDiaMesAnterior } from '../src/resumen.js';
import { variacionPorcentual } from '../src/comparativo.js';
import { setupTestApp, cleanTables, validUser } from './helpers.js';

describe('HU07 · Comparar el gasto contra el mes anterior', () => {
  let app;
  let db;
  let token;
  let idUsuario;
  let hoy;
  let mesPasado; // un día del mes anterior
  const auth = () => ({ Authorization: `Bearer ${token}` });
  const comparativo = () => request(app).get('/api/resumen/comparativo').set(auth());

  /** Inserta un gasto directo en la BD para poder elegir categoría y fecha. */
  async function gasto(categoria, monto, fecha) {
    const [[cat]] = await db.query('SELECT id_categoria FROM categorias WHERE nombre = ?', [
      categoria,
    ]);
    await db.query(
      `INSERT INTO gastos (id_usuario, id_categoria, monto, descripcion, fecha_gasto)
       VALUES (?, ?, ?, ?, ?)`,
      [idUsuario, cat.id_categoria, monto, `Gasto de ${categoria}`, fecha]
    );
  }
  const esteMes = (categoria, monto) => gasto(categoria, monto, hoy);
  const elMesPasado = (categoria, monto) => gasto(categoria, monto, mesPasado);
  const porNombre = (res, nombre) => res.body.categorias.find((c) => c.nombre === nombre);

  before(async () => {
    ({ app, db } = await setupTestApp());
  });
  beforeEach(async () => {
    await cleanTables(db);
    const res = await request(app).post('/api/auth/register').send(validUser);
    token = res.body.token;
    const [[fila]] = await db.query('SELECT id_usuario FROM usuarios WHERE email = ?', [
      validUser.email,
    ]);
    idUsuario = fila.id_usuario;
    const [[fechas]] = await db.query(
      `SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS hoy,
              DATE_FORMAT(DATE_ADD(DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH), INTERVAL 14 DAY), '%Y-%m-%d') AS pasado`
    );
    hoy = fechas.hoy;
    mesPasado = fechas.pasado;
  });
  after(() => db.end());

  async function dosMeses() {
    await elMesPasado('Comida', 504);
    await elMesPasado('Transporte', 300);
    await elMesPasado('Entretenimiento', 150);
    await esteMes('Comida', 820);
    await esteMes('Transporte', 240.5);
    await esteMes('Entretenimiento', 180);
  }

  it('Paso 1 · gastos en el mes actual y en el anterior → total y % de variación por categoría', async () => {
    await dosMeses();
    const res = await comparativo();
    assert.equal(res.status, 200);
    assert.equal(res.body.sinDatos, false);
    assert.equal(res.body.actual.total, 1240.5);
    assert.equal(res.body.anterior.total, 954);
    assert.equal(res.body.variacionTotal, 30);
    assert.deepEqual(
      [
        ['Comida', 504, 820, 62.7],
        ['Transporte', 300, 240.5, -19.8],
        ['Entretenimiento', 150, 180, 20],
      ].map(([n]) => n),
      res.body.categorias.map((c) => c.nombre)
    );
    assert.equal(porNombre(res, 'Comida').variacion, 62.7);
    assert.equal(porNombre(res, 'Transporte').variacion, -19.8);
    assert.equal(porNombre(res, 'Entretenimiento').variacion, 20);
  });

  it('Paso 2 · una categoría con el mayor cambio porcentual → se devuelve aparte', async () => {
    await dosMeses();
    const { mayorVariacion } = (await comparativo()).body;
    assert.equal(mayorVariacion.nombre, 'Comida');
    assert.equal(mayorVariacion.variacion, 62.7);
    assert.equal(mayorVariacion.anterior, 504);
    assert.equal(mayorVariacion.actual, 820);
  });

  it('Paso 3 · sin gastos del mes anterior → sinDatos y sin comparativo', async () => {
    await esteMes('Comida', 100);
    const res = await comparativo();
    assert.equal(res.status, 200);
    assert.equal(res.body.sinDatos, true);
    assert.deepEqual(res.body.categorias, []);
    assert.equal(res.body.mayorVariacion, null);
  });

  it('Paso 4 · verificar a mano un % de variación → coincide con el cálculo del sistema', () => {
    // (820 − 504) ÷ 504 × 100 = 62.698… → 62.7
    assert.equal(variacionPorcentual(820, 504), 62.7);
    assert.equal(variacionPorcentual(240.5, 300), -19.8);
    assert.equal(variacionPorcentual(0, 200), -100);
    assert.equal(variacionPorcentual(50, 0), null);
  });

  it('Paso 5 · sin gastos este mes pero con gastos el mes anterior → −100 % sin errores', async () => {
    await elMesPasado('Comida', 200);
    const res = await comparativo();
    assert.equal(res.body.sinDatos, false);
    assert.equal(res.body.actual.total, 0);
    assert.equal(res.body.variacionTotal, -100);
    assert.equal(porNombre(res, 'Comida').variacion, -100);
  });

  it('Paso 6 · categoría nueva (sin gasto el mes anterior) → "nueva", sin % y no compite por mayor variación', async () => {
    await elMesPasado('Comida', 100);
    await esteMes('Comida', 110);
    await esteMes('Salud', 900);
    const res = await comparativo();
    const salud = porNombre(res, 'Salud');
    assert.equal(salud.nueva, true);
    assert.equal(salud.variacion, null);
    assert.equal(res.body.mayorVariacion.nombre, 'Comida');
  });

  it('Paso 7 · empate de % → se destaca la de mayor diferencia en pesos', async () => {
    await elMesPasado('Comida', 100);
    await elMesPasado('Transporte', 200);
    await esteMes('Comida', 150);
    await esteMes('Transporte', 300);
    const { mayorVariacion } = (await comparativo()).body;
    assert.equal(mayorVariacion.nombre, 'Transporte');
  });

  it('Paso 8 · una baja fuerte también cuenta como mayor cambio (valor absoluto)', async () => {
    await elMesPasado('Comida', 100);
    await elMesPasado('Transporte', 100);
    await esteMes('Comida', 120);
    await esteMes('Transporte', 20);
    const { mayorVariacion } = (await comparativo()).body;
    assert.equal(mayorVariacion.nombre, 'Transporte');
    assert.equal(mayorVariacion.variacion, -80);
  });

  it('Paso 9 · sin sesión iniciada → 401', async () => {
    const res = await request(app).get('/api/resumen/comparativo');
    assert.equal(res.status, 401);
  });
});

describe('HU07 · mes anterior', () => {
  it('enero compara contra diciembre del año anterior', () => {
    assert.equal(primerDiaMesAnterior('2027-01-20'), '2026-12-01');
    assert.equal(primerDiaMesAnterior('2026-10-26'), '2026-09-01');
  });
});
