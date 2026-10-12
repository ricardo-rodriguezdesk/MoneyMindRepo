// HU03 — Testing: cada prueba corresponde a un paso de la tarjeta "Construir y probar la recuperación de contraseña"
import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { setupTestApp, cleanTables, createFakeMailer, validUser } from './helpers.js';

const tokenDelCorreo = (mail) =>
  new URL(mail.text.match(/https?:\/\/\S+/)[0]).searchParams.get('token');

describe('HU03 · Recuperar contraseña', () => {
  let app;
  let db;
  let mailer;
  before(async () => {
    mailer = createFakeMailer();
    ({ app, db } = await setupTestApp({ mailer }));
  });
  beforeEach(async () => {
    await cleanTables(db);
    mailer.outbox.length = 0;
    await request(app).post('/api/auth/register').send(validUser);
  });
  after(() => db.end());

  it('Paso 1 · correo registrado → llega el correo con el enlace', async () => {
    const res = await request(app).post('/api/auth/forgot').send({ email: validUser.email });
    assert.equal(res.status, 200);
    assert.equal(mailer.outbox.length, 1);
    assert.equal(mailer.outbox[0].to, validUser.email);
    assert.match(mailer.outbox[0].text, /\/restablecer\?token=[0-9a-f]{64}/);
  });

  it('Paso 2 · correo no registrado → mensaje genérico, sin confirmar si existe', async () => {
    const real = await request(app).post('/api/auth/forgot').send({ email: validUser.email });
    mailer.outbox.length = 0;
    const falso = await request(app).post('/api/auth/forgot').send({ email: 'nadie@ejemplo.com' });
    assert.equal(falso.status, 200);
    assert.equal(falso.body.message, real.body.message); // misma respuesta exista o no
    assert.equal(mailer.outbox.length, 0); // y no se envía nada
  });

  it('Paso 3 · enlace vigente + nueva contraseña → se actualiza y puede iniciar sesión con ella', async () => {
    await request(app).post('/api/auth/forgot').send({ email: validUser.email });
    const token = tokenDelCorreo(mailer.outbox[0]);

    const check = await request(app).get('/api/auth/reset/check').query({ token });
    assert.equal(check.status, 200);

    const reset = await request(app)
      .post('/api/auth/reset')
      .send({ token, password: 'NuevaClave456' });
    assert.equal(reset.status, 200);

    const viejo = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    assert.equal(viejo.status, 401);
    const nuevo = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: 'NuevaClave456' });
    assert.equal(nuevo.status, 200);
  });

  it('Paso 4 · enlace vencido (se fuerza la expiración) → "Este enlace ha expirado" y no permite el cambio', async () => {
    await request(app).post('/api/auth/forgot').send({ email: validUser.email });
    const token = tokenDelCorreo(mailer.outbox[0]);
    await db.query(
      'UPDATE tokens_recuperacion SET fecha_expiracion = DATE_SUB(NOW(), INTERVAL 1 MINUTE)'
    );

    const check = await request(app).get('/api/auth/reset/check').query({ token });
    assert.equal(check.status, 410);
    assert.equal(check.body.message, 'Este enlace ha expirado');

    const reset = await request(app)
      .post('/api/auth/reset')
      .send({ token, password: 'NuevaClave456' });
    assert.equal(reset.status, 410);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: 'NuevaClave456' });
    assert.equal(login.status, 401); // la contraseña no cambió
  });

  it('Verificación · vigencia del enlace = 30 minutos', async () => {
    await request(app).post('/api/auth/forgot').send({ email: validUser.email });
    const [rows] = await db.query(
      'SELECT TIMESTAMPDIFF(MINUTE, fecha_creacion, fecha_expiracion) AS minutos FROM tokens_recuperacion'
    );
    assert.equal(rows[0].minutos, 30);
  });

  it('Extra · el enlace solo sirve una vez y solo el más reciente funciona', async () => {
    await request(app).post('/api/auth/forgot').send({ email: validUser.email });
    await request(app).post('/api/auth/forgot').send({ email: validUser.email });
    const [primero, segundo] = mailer.outbox.map(tokenDelCorreo);

    const viejo = await request(app)
      .post('/api/auth/reset')
      .send({ token: primero, password: 'NuevaClave456' });
    assert.equal(viejo.status, 400);

    const ok = await request(app)
      .post('/api/auth/reset')
      .send({ token: segundo, password: 'NuevaClave456' });
    assert.equal(ok.status, 200);
    const repetido = await request(app)
      .post('/api/auth/reset')
      .send({ token: segundo, password: 'OtraClave789' });
    assert.equal(repetido.status, 400);
    assert.equal(repetido.body.message, 'El enlace no es válido');
  });

  it('Extra · contraseña nueva que no cumple las reglas → 422 y el enlace sigue vigente', async () => {
    await request(app).post('/api/auth/forgot').send({ email: validUser.email });
    const token = tokenDelCorreo(mailer.outbox[0]);
    const res = await request(app).post('/api/auth/reset').send({ token, password: 'corta' });
    assert.equal(res.status, 422);
    assert.equal((await request(app).get('/api/auth/reset/check').query({ token })).status, 200);
  });

  it('Extra · en la BD solo se guarda el hash del token, no el token', async () => {
    await request(app).post('/api/auth/forgot').send({ email: validUser.email });
    const token = tokenDelCorreo(mailer.outbox[0]);
    const [rows] = await db.query('SELECT token_hash FROM tokens_recuperacion');
    assert.notEqual(rows[0].token_hash, token);
    assert.equal(rows[0].token_hash.length, 64);
  });

  it('Extra · correo con formato inválido → 422 y no envía nada', async () => {
    const res = await request(app).post('/api/auth/forgot').send({ email: 'correo-malo' });
    assert.equal(res.status, 422);
    assert.equal(mailer.outbox.length, 0);
  });

  it('Extra · si falla el envío del correo → 503 y no queda un enlace activo', async () => {
    const roto = createFakeMailer();
    roto.send = async () => {
      throw new Error('SMTP caído');
    };
    const { app: appRota, db: dbRota } = await setupTestApp({ mailer: roto });
    await request(appRota).post('/api/auth/register').send(validUser);
    const res = await request(appRota).post('/api/auth/forgot').send({ email: validUser.email });
    assert.equal(res.status, 503);
    const [rows] = await dbRota.query('SELECT COUNT(*) AS total FROM tokens_recuperacion');
    assert.equal(rows[0].total, 0);
    await dbRota.end();
  });
});
