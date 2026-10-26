import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { formatMoney, todayISO } from '../lib/format.js';
import { useAuth } from '../auth.jsx';
import Hero from '../components/Hero.jsx';
import BottomNav from '../components/BottomNav.jsx';
import TextField from '../components/TextField.jsx';
import { ArrowRightIcon, CalendarIcon, DocIcon, DollarIcon } from '../components/icons.jsx';
import {
  CategoriaSugerida,
  ElegirCategoria,
  NuevaCategoria,
} from '../components/CategoriaPasos.jsx';

const TITULOS = {
  formulario: null,
  sugerida: 'Categoría sugerida',
  elegir: 'Elige una categoría',
  nueva: 'Nueva categoría',
};
const SIN_SUGERENCIA = 'No pudimos sugerir una categoría. Elige una para guardar.';

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
  // Pasos de HU05B: formulario → sugerida → elegir → nueva
  const [paso, setPaso] = useState('formulario');
  const [categorias, setCategorias] = useState([]);
  const [sugerencia, setSugerencia] = useState(null); // lo que respondió la IA
  const [elegidaId, setElegidaId] = useState(null);
  const [aviso, setAviso] = useState('');

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

  /** Valida igual que el servidor para no consultar a la IA con datos inválidos. */
  function validar() {
    const nuevos = {};
    if (values.descripcion.trim() === '') nuevos.descripcion = 'Escribe una descripción';
    const monto = Number(String(values.monto).replace(/,/g, ''));
    if (String(values.monto).trim() === '') nuevos.monto = 'Ingresa un monto';
    else if (!(monto > 0)) nuevos.monto = 'El monto debe ser mayor a 0';
    setErrors(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function guardar(idCategoria) {
    if (sending) return; // evita gastos duplicados con varios toques seguidos
    setFormError('');
    setSending(true);
    try {
      await api('/gastos', {
        method: 'POST',
        body: {
          ...values,
          idCategoria,
          sugerencia: sugerencia
            ? { idCategoria: sugerencia.id, confianza: sugerencia.confianza }
            : undefined,
        },
      });
      navigate('/inicio', { state: { guardado: true } });
    } catch (err) {
      setPaso('formulario');
      setErrors(err.errors ?? {});
      setFormError(err.message);
      setSending(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    if (editing) {
      setSending(true);
      try {
        await api(`/gastos/${id}`, { method: 'PUT', body: values });
        navigate('/dashboard');
      } catch (err) {
        setErrors(err.errors ?? {});
        if (!err.errors || Object.keys(err.errors).length === 0) setFormError(err.message);
      } finally {
        setSending(false);
      }
      return;
    }
    if (!validar() || sending) return;
    setSending(true); // "Sugiriendo categoría…" mientras responde la IA
    try {
      const { categorias: lista } = await api('/categorias');
      setCategorias(lista);
      const otros = lista.find((c) => c.nombre === 'Otros' && !c.personalizada);
      let respuesta = null;
      try {
        respuesta = await api('/categorias/sugerir', {
          method: 'POST',
          body: { descripcion: values.descripcion, monto: values.monto },
        });
      } catch (err) {
        if (err.status === 422) {
          setErrors(err.errors ?? {});
          return;
        }
        // la IA o la red fallaron: se deja elegir categoría sin sugerencia
      }
      if (!respuesta || respuesta.sinSugerencia || !respuesta.sugerencia) {
        setSugerencia(null);
        setElegidaId(otros?.id ?? null);
        setAviso(SIN_SUGERENCIA);
        setPaso('elegir');
      } else {
        setSugerencia(respuesta.sugerencia);
        setElegidaId(respuesta.sugerencia.id);
        setAviso('');
        setPaso('sugerida');
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function crearCategoria(nombre) {
    const { categoria } = await api('/categorias', { method: 'POST', body: { nombre } });
    setCategorias((prev) => [...prev, categoria]); // disponible de inmediato
    setElegidaId(categoria.id);
    setPaso('elegir');
  }

  const categoriaSugerida = categorias.find((c) => c.id === sugerencia?.id);
  const volver = {
    sugerida: () => setPaso('formulario'),
    elegir: () => setPaso(sugerencia ? 'sugerida' : 'formulario'),
    nueva: () => setPaso('elegir'),
  }[paso];

  return (
    <main className="phone with-nav">
      <Hero
        illustration="receipt"
        tagline="Registra tus gastos de forma simple."
        back={editing ? '/dashboard' : '/inicio'}
        onBack={volver}
        title={TITULOS[paso] ?? (editing ? 'Editar gasto' : 'Nuevo gasto')}
      />
      {paso === 'sugerida' && sugerencia && categoriaSugerida && (
        <div className="screen-body sheet">
          <CategoriaSugerida
            gasto={{ ...values, montoTexto: formatMoney(Number(values.monto), user?.moneda) }}
            sugerencia={sugerencia}
            categoria={categoriaSugerida}
            moneda={user?.moneda ?? 'MXN'}
            enviando={sending}
            onConfirmar={() => guardar(sugerencia.id)}
            onCambiar={() => setPaso('elegir')}
          />
          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}
        </div>
      )}
      {paso === 'elegir' && (
        <div className="screen-body sheet">
          <ElegirCategoria
            categorias={categorias}
            elegidaId={elegidaId}
            sugeridaId={sugerencia?.id}
            aviso={aviso}
            enviando={sending}
            onElegir={setElegidaId}
            onCrear={() => setPaso('nueva')}
            onGuardar={() => guardar(elegidaId)}
          />
          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}
        </div>
      )}
      {paso === 'nueva' && (
        <div className="screen-body sheet">
          <NuevaCategoria
            existentes={categorias}
            onCrear={crearCategoria}
            onCancelar={() => setPaso('elegir')}
          />
        </div>
      )}
      {paso === 'formulario' && (
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
                {sending ? (editing ? 'Guardando…' : 'Sugiriendo categoría…') : 'Guardar'}
                {!sending && <ArrowRightIcon size={18} />}
              </button>
            </>
          )}
        </form>
      )}
      <BottomNav />
    </main>
  );
}
