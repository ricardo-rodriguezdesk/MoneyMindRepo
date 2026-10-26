import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { resumenDelMes } from '../resumen.js';
import { comparativoMensual } from '../comparativo.js';

export function resumenRoutes({ db }) {
  const router = Router();
  router.use(requireAuth(db));

  // Total del mes actual y desglose por categoría (HU06)
  router.get('/mes', async (req, res, next) => {
    try {
      const [[{ hoy }]] = await db.query("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS hoy");
      const resumen = await resumenDelMes(db, req.user.id_usuario, hoy);
      res.json({ ...resumen, hasta: hoy });
    } catch (err) {
      next(err);
    }
  });

  // Mes actual contra el mes anterior, con % de variación por categoría (HU07)
  router.get('/comparativo', async (req, res, next) => {
    try {
      const [[{ hoy }]] = await db.query("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS hoy");
      res.json(await comparativoMensual(db, req.user.id_usuario, hoy));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
