import { Router } from 'express';
import { validateGasto } from '../validators.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { categoriasDeGasto } from '../categorias.js';

const NO_EXISTE = 'El gasto ya no existe';

/** Convierte una fila de la BD en el objeto que ve la app. */
function toGasto(row) {
  return {
    id: row.id_gasto,
    descripcion: row.descripcion,
    monto: Number(row.monto),
    fecha: row.fecha_gasto,
    categoria: {
      id: row.id_categoria,
      nombre: row.categoria,
      icono: row.icono,
      color: row.color_hex,
    },
    creadoEn: row.creado_en,
    ia: {
      sugeridaId: row.categoria_sugerida_ia,
      confianza: row.confianza_ia === null ? null : Number(row.confianza_ia),
      corregido: Boolean(row.fue_corregido),
    },
  };
}

const SELECT_GASTO = `
  SELECT g.id_gasto, g.descripcion, g.monto, g.fecha_gasto, g.creado_en,
         g.categoria_sugerida_ia, g.confianza_ia, g.fue_corregido,
         c.id_categoria, c.nombre AS categoria, c.icono, c.color_hex
    FROM gastos g
    JOIN categorias c ON c.id_categoria = g.id_categoria`;

export function gastosRoutes({ db }) {
  const router = Router();
  router.use(requireAuth(db));

  const hoy = async () => {
    const [rows] = await db.query('SELECT CURDATE() AS hoy');
    return rows[0].hoy;
  };

  async function findGasto(idGasto, idUsuario) {
    const [rows] = await db.query(`${SELECT_GASTO} WHERE g.id_gasto = ? AND g.id_usuario = ?`, [
      idGasto,
      idUsuario,
    ]);
    return rows[0] ? toGasto(rows[0]) : null;
  }

  // Ver: los gastos más recientes primero (el dashboard pide los últimos 10)
  router.get('/', async (req, res, next) => {
    try {
      const limit = Math.min(Math.max(parseInt(req.query.limit ?? '10', 10) || 10, 1), 100);
      const [rows] = await db.query(
        `${SELECT_GASTO} WHERE g.id_usuario = ?
          ORDER BY g.fecha_gasto DESC, g.creado_en DESC, g.id_gasto DESC LIMIT ?`,
        [req.user.id_usuario, limit]
      );
      const [[{ total }]] = await db.query(
        'SELECT COUNT(*) AS total FROM gastos WHERE id_usuario = ?',
        [req.user.id_usuario]
      );
      res.json({ gastos: rows.map(toGasto), total });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const gasto = await findGasto(req.params.id, req.user.id_usuario);
      if (!gasto) return res.status(404).json({ message: NO_EXISTE });
      return res.json({ gasto });
    } catch (err) {
      return next(err);
    }
  });

  // Crear
  router.post('/', async (req, res, next) => {
    try {
      const { errors, data } = validateGasto(req.body, await hoy());
      if (Object.keys(errors).length > 0) {
        return res.status(422).json({ message: Object.values(errors)[0], errors });
      }
      const permitidas = await categoriasDeGasto(db, req.user.id_usuario);
      const esPermitida = (id) => permitidas.some((c) => c.id === Number(id));
      const { idCategoria, sugerencia } = req.body ?? {};

      // Lo que la IA sugirió (si la app lo manda) se guarda siempre, aunque el usuario lo cambie
      let sugeridaId = null;
      let confianza = null;
      if (sugerencia) {
        const c = Number(sugerencia.confianza);
        if (!esPermitida(sugerencia.idCategoria) || !(c >= 0 && c <= 1)) {
          return res.status(422).json({ message: 'La categoría sugerida no es válida' });
        }
        sugeridaId = Number(sugerencia.idCategoria);
        confianza = c;
      }
      if (idCategoria !== undefined && !esPermitida(idCategoria)) {
        return res.status(422).json({ message: 'La categoría no es válida' });
      }
      // Categoría final: la que eligió el usuario, o la sugerida, o "Otros" si no hubo sugerencia
      const otros = permitidas.find((c) => c.nombre === 'Otros' && !c.personalizada);
      const final = idCategoria !== undefined ? Number(idCategoria) : (sugeridaId ?? otros.id);
      const fueCorregido = sugeridaId !== null && final !== sugeridaId;

      const [result] = await db.query(
        `INSERT INTO gastos (id_usuario, id_categoria, monto, descripcion, fecha_gasto,
                             categoria_sugerida_ia, confianza_ia, fue_corregido)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id_usuario,
          final,
          data.monto,
          data.descripcion,
          data.fecha,
          sugeridaId,
          confianza,
          fueCorregido,
        ]
      );
      const gasto = await findGasto(result.insertId, req.user.id_usuario);
      return res.status(201).json({ gasto });
    } catch (err) {
      return next(err);
    }
  });

  // Editar
  router.put('/:id', async (req, res, next) => {
    try {
      if (!(await findGasto(req.params.id, req.user.id_usuario))) {
        return res.status(404).json({ message: NO_EXISTE });
      }
      const { errors, data } = validateGasto(req.body, await hoy());
      if (Object.keys(errors).length > 0) {
        return res.status(422).json({ message: Object.values(errors)[0], errors });
      }
      await db.query(
        `UPDATE gastos SET descripcion = ?, monto = ?, fecha_gasto = ?
          WHERE id_gasto = ? AND id_usuario = ?`,
        [data.descripcion, data.monto, data.fecha, req.params.id, req.user.id_usuario]
      );
      return res.json({ gasto: await findGasto(req.params.id, req.user.id_usuario) });
    } catch (err) {
      return next(err);
    }
  });

  // Eliminar (la app pide confirmación antes de llamar aquí)
  router.delete('/:id', async (req, res, next) => {
    try {
      const [result] = await db.query('DELETE FROM gastos WHERE id_gasto = ? AND id_usuario = ?', [
        req.params.id,
        req.user.id_usuario,
      ]);
      if (result.affectedRows === 0) return res.status(404).json({ message: NO_EXISTE });
      return res.status(204).end();
    } catch (err) {
      return next(err);
    }
  });

  return router;
}
