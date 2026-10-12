import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createPool } from '../src/db.js';
import { createApp } from '../src/app.js';

const TEST_DB = process.env.DB_NAME_TEST ?? 'moneymind_test';
const schemaPath = fileURLToPath(new URL('../../db/schema.sql', import.meta.url));

/** Crea la BD de pruebas desde db/schema.sql y regresa { db, app }. */
/** Correo falso: guarda los mensajes en `outbox` en vez de enviarlos. */
export function createFakeMailer() {
  const outbox = [];
  return {
    outbox,
    async send(message) {
      outbox.push(message);
    },
  };
}

export async function setupTestApp(overrides = {}) {
  const admin = createPool({ database: undefined, multipleStatements: true, connectionLimit: 1 });
  await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB}`);
  const schema = readFileSync(schemaPath, 'utf8').replace(
    /^(CREATE DATABASE IF NOT EXISTS|USE) moneymind/gm,
    `$1 ${TEST_DB}`
  );
  await admin.query(schema);
  await admin.end();

  const db = createPool({ database: TEST_DB });
  const app = createApp({ db, mailer: createFakeMailer(), ...overrides });
  return { db, app };
}

export async function cleanTables(db) {
  await db.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of ['tokens_recuperacion', 'alertas', 'presupuestos', 'gastos', 'usuarios']) {
    await db.query(`TRUNCATE TABLE ${table}`);
  }
  await db.query('SET FOREIGN_KEY_CHECKS = 1');
}

export const validUser = {
  nombre: 'Ana Torres',
  email: 'ana.torres@ejemplo.com',
  password: 'Segura123',
  moneda: 'USD',
};
