import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { todayISO } from '../lib/format.js';
import { useAuth } from '../auth.jsx';
import TextField from '../components/TextField.jsx';

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
    <main className="screen">
      <form className="card" onSubmit={handleSubmit} noValidate>
        <div className="form-head">
          <Link className="back" to="/dashboard" aria-label="Cerrar">
            ✕
          </Link>
          <h1 className="title no-top">{editing ? 'Editar gasto' : 'Nuevo gasto'}</h1>
        </div>

        {loading ? (
          <p className="muted">Cargando…</p>
        ) : (
          <>
            <TextField
              label="¿En qué gastaste?"
              name="descripcion"
              placeholder="Ej. tacos con amigos"
              value={values.descripcion}
              onChange={handleChange}
              error={errors.descripcion}
            />
            <TextField
              label={`Monto (${user?.moneda ?? 'MXN'})`}
              name="monto"
              inputMode="decimal"
              placeholder="0.00"
              value={values.monto}
              onChange={handleChange}
              error={errors.monto}
            />
            <TextField
              label="Fecha"
              name="fecha"
              type="date"
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
            </button>
          </>
        )}
      </form>
    </main>
  );
}
