import express from 'express';
import cors from 'cors';
import { authRoutes } from './routes/auth.js';
import { passwordRoutes } from './routes/password.js';
import { gastosRoutes } from './routes/gastos.js';
import { resumenRoutes } from './routes/resumen.js';
import { categoriasRoutes } from './routes/categorias.js';

/**
 * Construye la app de Express. Recibe sus dependencias (db, mailer, clasificador de IA)
 * para poder probarla sin levantar el servidor.
 */
export function createApp({ db, mailer, clasificador = null }) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', async (_req, res) => {
    try {
      await db.query('SELECT 1');
      res.json({ status: 'ok' });
    } catch {
      res.status(503).json({ status: 'error', message: 'Sin conexión a la base de datos' });
    }
  });

  app.use('/api/auth', authRoutes({ db }));
  app.use('/api/auth', passwordRoutes({ db, mailer }));

  app.use('/api/gastos', gastosRoutes({ db }));
  app.use('/api/resumen', resumenRoutes({ db }));
  app.use('/api/categorias', categoriasRoutes({ db, clasificador }));

  // Manejo de errores no controlados
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: 'Ocurrió un error, intenta de nuevo' });
  });

  return app;
}
