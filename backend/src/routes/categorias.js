import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { categoriasDeGasto, crearCategoria, sugerirCategoria } from '../categorias.js';
import { validateGasto } from '../validators.js';

export function categoriasRoutes({ db, clasificador }) {
  const router = Router();
  router.use(requireAuth(db));

  // Lista de categorías de gasto del usuario (predefinidas + personalizadas)
  router.get('/', async (req, res, next) => {
    try {
      res.json({ categorias: await categoriasDeGasto(db, req.user.id_usuario) });
    } catch (err) {
      next(err);
    }
  });

  // Crear una categoría personalizada: queda disponible de inmediato
  router.post('/', async (req, res, next) => {
    try {
      const resultado = await crearCategoria(db, req.user.id_usuario, req.body?.nombre);
      if (resultado.error) return res.status(resultado.status).json({ message: resultado.error });
      return res.status(201).json({ categoria: resultado.categoria });
    } catch (err) {
      return next(err);
    }
  });

  // Contrato para la app (HU05B):
  //   entrada  { descripcion, monto }
  //   salida   { sugerencia: { id, nombre, confianza, confianzaBaja } | null, sinSugerencia }
  router.post('/sugerir', async (req, res, next) => {
    try {
      // Se valida igual que un gasto, pero sin la fecha (no hace falta para clasificar)
      const { errors, data } = validateGasto({ ...req.body, fecha: undefined }, '9999-12-31');
      delete errors.fecha;
      if (Object.keys(errors).length > 0) {
        return res.status(422).json({ message: Object.values(errors)[0], errors });
      }
      const resultado = await sugerirCategoria({
        db,
        clasificador,
        idUsuario: req.user.id_usuario,
        descripcion: data.descripcion,
        monto: data.monto,
      });
      return res.json(resultado);
    } catch (err) {
      return next(err);
    }
  });

  return router;
}
