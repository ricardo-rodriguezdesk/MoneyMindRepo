import { useState } from 'react';
import TextField from './TextField.jsx';
import { CategoryIcon, CheckIcon, PlusIcon, TagIcon } from './icons.jsx';
import { CONFIANZA_MINIMA, porcentajeConfianza } from '../lib/format.js';

/** Icono redondo con el color de la categoría (igual que en la lista de gastos). */
function IconoCategoria({ categoria }) {
  return (
    <span
      className="gasto-icon"
      style={{ background: `${categoria.color}26`, color: categoria.color }}
    >
      <CategoryIcon name={categoria.icono} size={22} />
    </span>
  );
}

/** Mockups B y C: la categoría sugerida por la IA con su % de confianza. */
export function CategoriaSugerida({
  gasto,
  sugerencia,
  categoria,
  moneda,
  onConfirmar,
  onCambiar,
  enviando,
}) {
  const porcentaje = porcentajeConfianza(sugerencia.confianza);
  const baja = porcentaje < CONFIANZA_MINIMA; // exactamente 70 % no se resalta
  return (
    <>
      <p className="resumen-gasto">
        {gasto.descripcion} · <strong>{gasto.montoTexto}</strong>
        <span className="suffix"> {moneda}</span>
      </p>
      <section className={`sugerida-card ${baja ? 'baja' : ''}`} aria-label="Categoría sugerida">
        <IconoCategoria categoria={categoria} />
        <div className="sugerida-info">
          <strong>{sugerencia.nombre}</strong>
          <span>Sugerida por IA</span>
        </div>
        <span className="confianza">Confianza {porcentaje} %</span>
      </section>
      {baja && (
        <p className="aviso-revisar" role="status">
          <span aria-hidden="true">⚠ </span>
          Revisa esta categoría: la confianza es menor a {CONFIANZA_MINIMA} %
        </p>
      )}
      <button className="btn" type="button" onClick={onConfirmar} disabled={enviando}>
        {enviando ? 'Guardando…' : 'Confirmar y guardar'}
      </button>
      <button className="btn secondary" type="button" onClick={onCambiar} disabled={enviando}>
        Cambiar categoría
      </button>
    </>
  );
}

/** Mockup D: lista de categorías (predefinidas y personalizadas) para elegir una. */
export function ElegirCategoria({
  categorias,
  elegidaId,
  sugeridaId,
  aviso,
  onElegir,
  onCrear,
  onGuardar,
  enviando,
}) {
  return (
    <>
      {aviso && (
        <p className="aviso-ia" role="status">
          {aviso}
        </p>
      )}
      <ul className="cat-lista" role="radiogroup" aria-label="Categorías">
        {categorias.map((categoria) => (
          <li key={categoria.id}>
            <button
              type="button"
              role="radio"
              aria-checked={categoria.id === elegidaId}
              className={`cat-opcion ${categoria.id === elegidaId ? 'elegida' : ''}`}
              onClick={() => onElegir(categoria.id)}
            >
              <IconoCategoria categoria={categoria} />
              <span className="cat-nombre">
                {categoria.personalizada ? `Mi categoría: ${categoria.nombre}` : categoria.nombre}
              </span>
              {categoria.id === sugeridaId && <span className="etiqueta">Sugerida</span>}
              {categoria.id === elegidaId && <CheckIcon size={20} />}
            </button>
          </li>
        ))}
      </ul>
      <button className="btn outline-verde" type="button" onClick={onCrear}>
        <PlusIcon size={18} /> Crear categoría
      </button>
      <button className="btn" type="button" onClick={onGuardar} disabled={enviando || !elegidaId}>
        {enviando ? 'Guardando…' : 'Guardar'}
      </button>
    </>
  );
}

/** Mockup E: crear una categoría personalizada, con su validación. */
export function NuevaCategoria({ existentes, onCrear, onCancelar }) {
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const limpio = nombre.trim();
    if (limpio.length === 0) return setError('Escribe un nombre');
    if (limpio.length > 60) return setError('Máximo 60 caracteres');
    if (existentes.some((c) => c.nombre.toLowerCase() === limpio.toLowerCase())) {
      return setError('Ya tienes una categoría con ese nombre');
    }
    setCreando(true);
    try {
      await onCrear(limpio);
    } catch (err) {
      setError(err.status === 409 ? 'Ya tienes una categoría con ese nombre' : err.message);
    } finally {
      setCreando(false);
    }
    return undefined;
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <TextField
        label="Nombre"
        name="nombre"
        icon={<TagIcon />}
        placeholder="Ej. Mascotas"
        value={nombre}
        onChange={(event) => {
          setNombre(event.target.value);
          setError('');
        }}
        error={error}
      />
      <button className="btn" type="submit" disabled={creando}>
        {creando ? 'Creando…' : 'Crear categoría'}
      </button>
      <button className="btn secondary" type="button" onClick={onCancelar} disabled={creando}>
        Cancelar
      </button>
    </form>
  );
}
