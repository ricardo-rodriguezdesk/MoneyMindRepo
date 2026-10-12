import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { todayISO } from '../lib/format.js';
import { useAuth } from '../auth.jsx';
import Hero from '../components/Hero.jsx';
import BottomNav from '../components/BottomNav.jsx';
import TextField from '../components/TextField.jsx';
import {
  ArrowRightIcon,
  CalendarIcon,
  DocIcon,
  DollarIcon,
  TagIcon,
} from '../components/icons.jsx';

/** Crear ("Nuevo gasto") y editar un gasto con el mismo formulario. */
export default function GastoForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [values, setValues] = useState({ descripcion: '', monto: '', fecha: todayISO() }); // hoy preseleccionada
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(editing);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api(`/gastos/${id}`)
      .then(({ gasto }) =>
        setValues({
          descripcion: gasto.descripcion,
          monto: String(gasto.monto),
          fecha: gasto.fecha,
        })
      )
      .catch((err) => setFormError(err.message))
      .finally(() => setLoading(false));
  }, [editing, id]);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setSending(true);
    try {
      await api(editing ? `/gastos/${id}` : '/gastos', {
        method: editing ? 'PUT' : 'POST',
        body: values,
      });
      navigate('/dashboard');
    } catch (err) {
      setErrors(err.errors ?? {});
      if (!err.errors || Object.keys(err.errors).length === 0) setFormError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="phone with-nav">
      <Hero
        illustration="receipt"
        tagline="Registra tus gastos de forma simple."
        back="/dashboard"
        title={editing ? 'Editar gasto' : 'Nuevo gasto'}
      />
      <form className="screen-body sheet" onSubmit={handleSubmit} noValidate>
        {loading ? (
          <p className="subtitle">Cargando…</p>
        ) : (
          <>
            <TextField
              label="Descripción"
              name="descripcion"
              icon={<DocIcon />}
              placeholder="Ej. tacos con amigos"
              value={values.descripcion}
              onChange={handleChange}
              error={errors.descripcion}
            />
            <TextField
              label="Monto"
              name="monto"
              inputMode="decimal"
              icon={<DollarIcon />}
              right={<span className="suffix">{user?.moneda ?? 'MXN'}</span>}
              placeholder="0.00"
              value={values.monto}
              onChange={handleChange}
              error={errors.monto}
            />
            <div className="field">
              <label htmlFor="categoria">Categoría</label>
              <div className="input-wrap disabled">
                <span className="input-icon">
                  <TagIcon />
                </span>
                <select id="categoria" disabled value="otros">
                  <option value="otros">Otros</option>
                </select>
              </div>
              <p className="hint">La IA sugerirá la categoría automáticamente muy pronto.</p>
            </div>
            <TextField
              label="Fecha"
              name="fecha"
              type="date"
              icon={<CalendarIcon />}
              max={todayISO()}
              value={values.fecha}
              onChange={handleChange}
              error={errors.fecha}
            />
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            <button className="btn" type="submit" disabled={sending}>
              {sending ? 'Guardando…' : 'Guardar'}
              {!sending && <ArrowRightIcon size={18} />}
            </button>
          </>
        )}
      </form>
      <BottomNav />
    </main>
  );
}
