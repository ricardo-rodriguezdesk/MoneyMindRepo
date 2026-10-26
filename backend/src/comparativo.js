import { primerDiaMesAnterior, resumenDelMes } from './resumen.js';

/** Redondea a 1 decimal. */
const aUnDecimal = (n) => Math.round(n * 10) / 10;

/** Variación porcentual de `anterior` a `actual`; null si no hay base para calcularla. */
export function variacionPorcentual(actual, anterior) {
  if (!anterior) return null;
  return aUnDecimal(((actual - anterior) / anterior) * 100);
}

/**
 * Comparativo (HU07) del mes de `hoy` contra el mes anterior completo.
 * - Categoría con gasto este mes pero ninguno el mes anterior: `nueva`, sin %, y no compite
 *   por "mayor variación".
 * - Mayor variación = mayor valor absoluto del %; en empate, la de mayor diferencia en pesos.
 */
export async function comparativoMensual(db, idUsuario, hoy) {
  const actual = await resumenDelMes(db, idUsuario, hoy);
  const anterior = await resumenDelMes(db, idUsuario, primerDiaMesAnterior(hoy));

  const porCategoria = new Map();
  for (const cat of anterior.categorias) {
    porCategoria.set(cat.id, { ...cat, actual: 0, anterior: cat.total });
  }
  for (const cat of actual.categorias) {
    const previa = porCategoria.get(cat.id);
    if (previa) previa.actual = cat.total;
    else porCategoria.set(cat.id, { ...cat, actual: cat.total, anterior: 0 });
  }

  const categorias = [...porCategoria.values()]
    .map((cat) => ({
      id: cat.id,
      nombre: cat.nombre,
      icono: cat.icono,
      color: cat.color,
      actual: cat.actual,
      anterior: cat.anterior,
      variacion: variacionPorcentual(cat.actual, cat.anterior),
      nueva: cat.anterior === 0 && cat.actual > 0,
    }))
    .sort(
      (a, b) =>
        Math.max(b.actual, b.anterior) - Math.max(a.actual, a.anterior) ||
        a.nombre.localeCompare(b.nombre, 'es')
    );

  const candidatas = categorias.filter((cat) => cat.variacion !== null);
  const mayorVariacion =
    candidatas.sort(
      (a, b) =>
        Math.abs(b.variacion) - Math.abs(a.variacion) ||
        Math.abs(b.actual - b.anterior) - Math.abs(a.actual - a.anterior) ||
        a.nombre.localeCompare(b.nombre, 'es')
    )[0] ?? null;

  return {
    actual: { mes: actual.mes, hasta: hoy, total: actual.total },
    anterior: { mes: anterior.mes, total: anterior.total },
    variacionTotal: variacionPorcentual(actual.total, anterior.total),
    sinDatos: anterior.categorias.length === 0,
    categorias: anterior.categorias.length === 0 ? [] : categorias,
    mayorVariacion: anterior.categorias.length === 0 ? null : mayorVariacion,
  };
}
