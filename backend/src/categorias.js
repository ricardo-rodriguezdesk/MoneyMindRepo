// HU05A — Categorías del usuario y sugerencia de categoría con IA.

export const NOMBRE_MAXIMO = 60;
export const CONFIANZA_BAJA = 0.5; // por debajo de esto la app resalta la sugerencia
const CONFIANZA_OTROS = 0.1; // cuando la IA responde algo fuera de la lista

/** Categorías de tipo gasto disponibles para el usuario: predefinidas + personalizadas. */
export async function categoriasDeGasto(db, idUsuario) {
  const [rows] = await db.query(
    `SELECT id_categoria, nombre, icono, color_hex, es_predefinida
       FROM categorias
      WHERE tipo = 'gasto' AND (es_predefinida = TRUE OR id_usuario = ?)
      ORDER BY es_predefinida DESC, nombre`,
    [idUsuario]
  );
  return rows.map((r) => ({
    id: r.id_categoria,
    nombre: r.nombre,
    icono: r.icono,
    color: r.color_hex,
    personalizada: !r.es_predefinida,
  }));
}

/** Valida y crea una categoría personalizada. Regresa { error, status } o { categoria }. */
export async function crearCategoria(db, idUsuario, nombreCrudo) {
  const nombre = String(nombreCrudo ?? '').trim();
  if (nombre.length === 0) return { status: 422, error: 'Escribe un nombre para la categoría' };
  if (nombre.length > NOMBRE_MAXIMO) return { status: 422, error: 'Máximo 60 caracteres' };

  const existentes = await categoriasDeGasto(db, idUsuario);
  if (existentes.some((c) => c.nombre.toLowerCase() === nombre.toLowerCase())) {
    return { status: 409, error: 'Ya existe una categoría con ese nombre' };
  }
  const [result] = await db.query(
    `INSERT INTO categorias (nombre, tipo, es_predefinida, id_usuario)
     VALUES (?, 'gasto', FALSE, ?)`,
    [nombre, idUsuario]
  );
  return {
    categoria: {
      id: result.insertId,
      nombre,
      icono: 'tag',
      color: '#10B981',
      personalizada: true,
    },
  };
}

/**
 * Pide a la IA una categoría para el gasto.
 * Siempre regresa { sugerencia, sinSugerencia }; nunca lanza error por culpa de la IA:
 * si falla, el gasto se puede guardar igual (en "Otros").
 */
export async function sugerirCategoria({ db, clasificador, idUsuario, descripcion, monto }) {
  if (!clasificador) return { sugerencia: null, sinSugerencia: true };
  const categorias = await categoriasDeGasto(db, idUsuario);
  try {
    const respuesta = await clasificador({
      descripcion,
      monto,
      categorias: categorias.map((c) => c.nombre),
    });
    const elegida = categorias.find(
      (c) => c.nombre.toLowerCase() === String(respuesta.nombre).trim().toLowerCase()
    );
    const otros = categorias.find((c) => c.nombre === 'Otros');
    const confianza = elegida
      ? Math.round(Math.min(Math.max(Number(respuesta.confianza), 0), 1) * 1000) / 1000
      : CONFIANZA_OTROS;
    const categoria = elegida ?? otros;
    return {
      sugerencia: {
        id: categoria.id,
        nombre: categoria.nombre,
        confianza,
        confianzaBaja: confianza < CONFIANZA_BAJA,
      },
      sinSugerencia: false,
    };
  } catch (err) {
    console.error('La IA no pudo sugerir una categoría:', err.message);
    return { sugerencia: null, sinSugerencia: true };
  }
}
