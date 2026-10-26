import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { formatDate, formatMoney } from '../lib/format.js';
import { useAuth } from '../auth.jsx';
import BottomNav from '../components/BottomNav.jsx';
import Hero from '../components/Hero.jsx';
import { ArrowRightIcon, CategoryIcon, LogoutIcon } from '../components/icons.jsx';

/** 'YYYY-MM' → "octubre" */
function nombreDelMes(mes) {
  const [year, month] = mes.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('es-MX', { month: 'long' });
}

// Inicio (HU06): gasto total del mes actual y su desglose por categoría, de mayor a menor.
export default function Inicio() {
  const { user, endSession } = useAuth();
  const navigate = useNavigate();
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setResumen(await api('/resumen/mes'));
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

  function handleLogout() {
    endSession();
    navigate('/login');
  }

  const sinGastos = resumen && resumen.categorias.length === 0;

  return (
    <main className="phone with-nav">
      <Hero
        illustration="chart"
        title="Inicio"
        tagline={`Hola, ${user?.nombre?.split(' ')[0]}. Este es tu mes.`}
        action={
          <button
            className="hero-icon"
            type="button"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogoutIcon />
          </button>
        }
      />

      <section className="screen-body list-body">
        {error && (
          <div role="alert">
            <p className="form-error">No pudimos cargar tu resumen. Intenta de nuevo.</p>
            <button className="btn outline" type="button" onClick={load}>
              Reintentar
            </button>
          </div>
        )}
        {loading && !resumen && <p className="subtitle">Cargando…</p>}

        {resumen && (
          <>
            <div className="resumen-total">
              <span className="resumen-label">Gastaste en {nombreDelMes(resumen.mes)}</span>
              <strong className="resumen-monto">{formatMoney(resumen.total, user?.moneda)}</strong>
              <span className="resumen-rango">
                {user?.moneda ?? 'MXN'} · 1 al {formatDate(resumen.hasta)}
              </span>
            </div>

            {sinGastos && (
              <div className="empty">
                <h2>Aún no hay gastos este mes</h2>
                <p className="subtitle">
                  Registra tu primer gasto para ver el desglose por categoría.
                </p>
                <Link className="btn" to="/gastos/nuevo">
                  Registrar gasto <ArrowRightIcon size={18} />
                </Link>
              </div>
            )}

            {!sinGastos && (
              <>
                <h2 className="list-title">Por categoría</h2>
                <ul className="desglose">
                  {resumen.categorias.map((cat) => (
                    <li className="desglose-fila" key={cat.id}>
                      <span
                        className="desglose-icon"
                        style={{ background: `${cat.color}26`, color: cat.color }}
                      >
                        <CategoryIcon name={cat.icono} size={20} />
                      </span>
                      <div className="desglose-info">
                        <div className="desglose-linea">
                          <strong>{cat.nombre}</strong>
                          <span className="desglose-monto">
                            {formatMoney(cat.total, user?.moneda)}
                          </span>
                        </div>
                        <div className="desglose-linea">
                          <span className="desglose-barra" aria-hidden="true">
                            <i style={{ width: `${cat.porcentaje}%`, background: cat.color }} />
                          </span>
                          <span className="desglose-pct">{cat.porcentaje} %</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>

      <BottomNav active="inicio" />
    </main>
  );
}
