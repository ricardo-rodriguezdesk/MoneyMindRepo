import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { formatDate, formatMoney, formatVariation, monthName } from '../lib/format.js';
import { useAuth } from '../auth.jsx';
import BottomNav from '../components/BottomNav.jsx';
import Hero from '../components/Hero.jsx';
import { CategoryIcon } from '../components/icons.jsx';

const ALTURA_BARRAS = 110;

/** "Subió" / "Bajó" / "Sin cambio" con su flecha: el significado nunca depende solo del color. */
function etiquetaVariacion(valor) {
  if (valor > 0) return { clase: 'sube', texto: `▲ Subió ${formatVariation(valor)}` };
  if (valor < 0) return { clase: 'baja', texto: `▼ Bajó ${formatVariation(valor)}` };
  return { clase: 'igual', texto: 'Sin cambio' };
}

// Reportes (HU07): mes actual contra el mes anterior, con % de variación por categoría.
export default function Reportes() {
  const { user } = useAuth();
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDatos(await api('/resumen/comparativo'));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const moneda = user?.moneda;
  const mesActual = datos ? monthName(datos.actual.mes) : '';
  const mesAnterior = datos ? monthName(datos.anterior.mes) : '';
  const maximo = datos
    ? Math.max(1, ...datos.categorias.flatMap((cat) => [cat.actual, cat.anterior]))
    : 1;
  const altura = (monto) => (monto > 0 ? Math.max(4, (monto / maximo) * ALTURA_BARRAS) : 0);
  const totalVar =
    datos && datos.variacionTotal !== null ? etiquetaVariacion(datos.variacionTotal) : null;
  const mayor = datos?.mayorVariacion ? etiquetaVariacion(datos.mayorVariacion.variacion) : null;

  return (
    <main className="phone with-nav">
      <Hero
        illustration="chart"
        title="Reportes"
        back="/inicio"
        tagline={datos ? `${mesActual} contra ${mesAnterior}` : 'Compara tus gastos mes a mes.'}
      />

      <section className="screen-body list-body">
        {error && (
          <div role="alert">
            <p className="form-error">No pudimos cargar el comparativo. Intenta de nuevo.</p>
            <button className="btn outline" type="button" onClick={load}>
              Reintentar
            </button>
          </div>
        )}
        {loading && !datos && <p className="subtitle">Cargando…</p>}

        {datos && datos.sinDatos && (
          <div className="empty">
            <h2>No hay datos para comparar</h2>
            <p className="subtitle">
              No registraste gastos en {mesAnterior}. Cuando tengas dos meses con gastos verás aquí
              la comparación.
            </p>
            <Link className="btn" to="/inicio">
              Volver a Inicio
            </Link>
          </div>
        )}

        {datos && !datos.sinDatos && (
          <>
            <div className="resumen-total">
              <span className="resumen-label">
                Total de {mesActual} (al {formatDate(datos.actual.hasta)})
              </span>
              <strong className="resumen-monto">{formatMoney(datos.actual.total, moneda)}</strong>
              {totalVar && <span className={`variacion ${totalVar.clase}`}>{totalVar.texto}</span>}
              <span className="resumen-rango">
                En {mesAnterior} (mes completo): {formatMoney(datos.anterior.total, moneda)}
              </span>
            </div>

            <h2 className="list-title">Por categoría</h2>
            <div className="comparativo">
              <div
                className="barras"
                role="img"
                aria-label="Gasto por categoría, mes anterior contra mes actual"
              >
                {datos.categorias.map((cat) => (
                  <div className="barras-grupo" key={cat.id}>
                    <div className="barras-par">
                      <span className="barra anterior" style={{ height: altura(cat.anterior) }} />
                      <span className="barra actual" style={{ height: altura(cat.actual) }} />
                    </div>
                    <span className="barras-icono" style={{ color: cat.color }}>
                      <CategoryIcon name={cat.icono} size={18} />
                    </span>
                  </div>
                ))}
              </div>
              <p className="leyenda">
                <span className="muestra anterior" /> {mesAnterior}{' '}
                <span className="muestra actual" /> {mesActual}
              </p>
              <ul className="variaciones">
                {datos.categorias.map((cat) => {
                  const etiqueta = cat.variacion !== null ? etiquetaVariacion(cat.variacion) : null;
                  return (
                    <li key={cat.id}>
                      <strong>{cat.nombre}</strong>
                      <span className="variaciones-montos">
                        {formatMoney(cat.anterior, moneda)} → {formatMoney(cat.actual, moneda)}
                      </span>
                      {cat.nueva ? (
                        <span className="variacion nueva">Nueva</span>
                      ) : (
                        etiqueta && (
                          <span className={`variacion ${etiqueta.clase}`}>{etiqueta.texto}</span>
                        )
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {datos.mayorVariacion && mayor && (
              <div className="mayor-variacion">
                <span className="resumen-label">Mayor variación</span>
                <strong className="mayor-nombre">{datos.mayorVariacion.nombre}</strong>
                <span className={`variacion ${mayor.clase}`}>{mayor.texto}</span>
                <span className="resumen-rango">
                  {formatMoney(datos.mayorVariacion.anterior, moneda)} →{' '}
                  {formatMoney(datos.mayorVariacion.actual, moneda)}
                </span>
              </div>
            )}
          </>
        )}
      </section>

      <BottomNav active="inicio" />
    </main>
  );
}
