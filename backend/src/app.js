import express from 'express';
import cors from 'cors';
import { authRoutes } from './routes/auth.js';
import { passwordRoutes } from './routes/password.js';

/**
 * Construye la app de Express. Recibe sus dependencias (db, mailer)
 * para poder probarla sin levantar el servidor.
 */
export function createApp({ db, mailer }) {
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

  // Manejo de errores no controlados
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: 'Ocurrió un error, intenta de nuevo' });
  });

  return app;
}
