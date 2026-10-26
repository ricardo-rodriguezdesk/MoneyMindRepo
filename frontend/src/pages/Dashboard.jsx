import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { formatDate, formatMoney } from '../lib/format.js';
import { useAuth } from '../auth.jsx';
import BottomNav from '../components/BottomNav.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Hero from '../components/Hero.jsx';
import {
  ArrowRightIcon,
  CategoryIcon,
  LogoutIcon,
  PencilIcon,
  TrashIcon,
} from '../components/icons.jsx';

// Gastos: últimos 10 gastos (HU04). El total del mes y su desglose viven en Inicio (HU06).
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
    <main className="phone with-nav">
      <Hero
        illustration="receipt"
        title="Gastos"
        tagline={`Hola, ${user?.nombre?.split(' ')[0]}. Mantén el control de tus gastos.`}
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
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {loading && <p className="subtitle">Cargando…</p>}

        {!loading && gastos.length === 0 && !error && (
          <div className="empty">
            <div className="empty-art">
              <Hero.Receipt />
            </div>
            <h2>Aún no tienes gastos, registra el primero.</h2>
            <p className="subtitle">
              Comienza a registrar tus gastos para llevar un mejor control de tus finanzas.
            </p>
            <Link className="btn" to="/gastos/nuevo">
              Nuevo gasto <ArrowRightIcon size={18} />
            </Link>
          </div>
        )}

        {gastos.length > 0 && <h2 className="list-title">Recientes</h2>}
        <ul className="gasto-list">
          {gastos.map((gasto) => (
            <li className="gasto" key={gasto.id}>
              <span
                className="gasto-icon"
                style={{ background: `${gasto.categoria.color}26`, color: gasto.categoria.color }}
              >
                <CategoryIcon name={gasto.categoria.icono} size={22} />
              </span>
              <div className="gasto-info">
                <strong>{gasto.descripcion}</strong>
                <span>{gasto.categoria.nombre}</span>
                <span>{formatDate(gasto.fecha)}</span>
              </div>
              <div className="gasto-right">
                <span className="gasto-monto">- {formatMoney(gasto.monto, user?.moneda)}</span>
                <div className="gasto-actions">
                  <Link
                    className="icon-btn"
                    to={`/gastos/${gasto.id}/editar`}
                    aria-label={`Editar ${gasto.descripcion}`}
                  >
                    <PencilIcon size={16} />
                  </Link>
                  <button
                    className="icon-btn danger"
                    type="button"
                    onClick={() => setToDelete(gasto)}
                    aria-label={`Eliminar ${gasto.descripcion}`}
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <BottomNav active="gastos" />

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
