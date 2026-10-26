/**
 * Resumen de gastos de un mes (HU06). Lo reutiliza HU07 para comparar meses.
 * Solo cuentan los gastos del usuario en categorías de tipo "gasto".
 */

/** Primer día del mes que contiene a `fecha` ('YYYY-MM-DD') y primero del mes siguiente. */
export function limitesDelMes(fecha) {
  const [anio, mes] = fecha.split('-').map(Number);
  const pad = (n) => String(n).padStart(2, '0');
  const siguiente = mes === 12 ? [anio + 1, 1] : [anio, mes + 1];
  return {
    mes: `${anio}-${pad(mes)}`,
    desde: `${anio}-${pad(mes)}-01`,
    hasta: `${siguiente[0]}-${pad(siguiente[1])}-01`, // exclusivo
  };
}

/**
 * Total y desglose por categoría del mes de `fecha`, de mayor a menor.
 * Los empates se ordenan por nombre para que el orden sea estable.
 */
export async function resumenDelMes(db, idUsuario, fecha) {
  const { mes, desde, hasta } = limitesDelMes(fecha);
  const [rows] = await db.query(
    `SELECT c.id_categoria, c.nombre, c.icono, c.color_hex, SUM(g.monto) AS total
       FROM gastos g
       JOIN categorias c ON c.id_categoria = g.id_categoria
      WHERE g.id_usuario = ? AND c.tipo = 'gasto'
        AND g.fecha_gasto >= ? AND g.fecha_gasto < ?
      GROUP BY c.id_categoria, c.nombre, c.icono, c.color_hex
      ORDER BY total DESC, c.nombre ASC`,
    [idUsuario, desde, hasta]
  );
  const centavos = rows.map((row) => Math.round(Number(row.total) * 100));
  const totalCentavos = centavos.reduce((suma, valor) => suma + valor, 0);
  return {
    mes,
    total: totalCentavos / 100,
    categorias: rows.map((row, i) => ({
      id: row.id_categoria,
      nombre: row.nombre,
      icono: row.icono,
      color: row.color_hex,
      total: centavos[i] / 100,
      porcentaje: totalCentavos > 0 ? Math.round((centavos[i] / totalCentavos) * 100) : 0,
    })),
  };
}

/** Un día cualquiera del mes anterior al de `fecha` ('YYYY-MM-DD'), siempre el día 1. */
export function primerDiaMesAnterior(fecha) {
  const [anio, mes] = fecha.split('-').map(Number);
  const pad = (n) => String(n).padStart(2, '0');
  return mes === 1 ? `${anio - 1}-12-01` : `${anio}-${pad(mes - 1)}-01`;
}
