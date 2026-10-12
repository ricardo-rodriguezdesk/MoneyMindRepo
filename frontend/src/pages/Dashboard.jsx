import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { formatDate, formatMoney } from '../lib/format.js';
import { useAuth } from '../auth.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

// Dashboard: últimos 10 gastos (HU04). HU06 agrega el total del mes y el desglose por categoría.
export default function Dashboard() {
  const { user, endSession } = useAuth();
  const navigate = useNavigate();
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const { gastos: latest } = await api('/gastos?limit=10');
      setGastos(latest);
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

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api(`/gastos/${toDelete.id}`, { method: 'DELETE' });
    } catch (err) {
      if (err.status !== 404) setError(err.message); // 404: ya no existía, solo se refresca
    }
    setToDelete(null);
    setDeleting(false);
    load();
  }

  function handleLogout() {
    endSession();
    navigate('/login');
  }

  return (
    <main className="dash">
      <header className="dash-top">
        <div>
          <h1>Hola, {user?.nombre?.split(' ')[0]} 👋</h1>
          <p>Tus gastos recientes</p>
        </div>
        <button className="link-button" type="button" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </header>

      <section className="dash-body">
        <div className="section-head">
          <h2>Movimientos recientes</h2>
          <Link className="btn small" to="/gastos/nuevo">
            + Nuevo gasto
          </Link>
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {loading && <p className="muted">Cargando…</p>}

        {!loading && gastos.length === 0 && !error && (
          <div className="empty">
            <div className="empty-icon">🧾</div>
            <h3>Aún no tienes gastos</h3>
            <p className="muted">Registra el primero y empieza a ver a dónde se va tu dinero.</p>
            <Link className="btn" to="/gastos/nuevo">
              Nuevo gasto
            </Link>
          </div>
        )}

        <ul className="gasto-list">
          {gastos.map((gasto) => (
            <li className="gasto" key={gasto.id}>
              <span className="dot" style={{ background: gasto.categoria.color }} />
              <div className="gasto-info">
                <strong>{gasto.descripcion}</strong>
                <span className="muted">
                  {gasto.categoria.nombre} · {formatDate(gasto.fecha)}
                </span>
              </div>
              <span className="gasto-monto">-{formatMoney(gasto.monto, user?.moneda)}</span>
              <div className="gasto-actions">
                <Link to={`/gastos/${gasto.id}/editar`} aria-label={`Editar ${gasto.descripcion}`}>
                  Editar
                </Link>
                <button
                  type="button"
                  onClick={() => setToDelete(gasto)}
                  aria-label={`Eliminar ${gasto.descripcion}`}
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {toDelete && (
        <ConfirmDialog
          title="¿Eliminar este gasto?"
          message={`"${toDelete.descripcion}" por ${formatMoney(toDelete.monto, user?.moneda)} se eliminará de tu registro.`}
          confirmLabel="Eliminar"
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </main>
  );
}
