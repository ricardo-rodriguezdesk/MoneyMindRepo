// Reglas de validación compartidas (HU01 registro, HU03 nueva contraseña, HU04 gastos)

export const MONEDAS = ['MXN', 'USD', 'EUR'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NOMBRE_REGEX = /^[\p{L}][\p{L}\s'.-]*$/u;

/** Cada validador regresa un mensaje de error o null si el dato es válido. */
export function validateNombre(value) {
  const nombre = String(value ?? '').trim();
  if (nombre.length < 2 || nombre.length > 100 || !NOMBRE_REGEX.test(nombre)) {
    return 'Ingresa tu nombre (mínimo 2 letras)';
  }
  return null;
}

export function validateEmail(value) {
  const email = String(value ?? '').trim();
  if (!EMAIL_REGEX.test(email) || email.length > 150) return 'Correo no válido';
  return null;
}

export function validatePassword(value) {
  const password = String(value ?? '');
  const ok = password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
  return ok ? null : 'Mínimo 8 caracteres, con letras y números';
}

export function validateMoneda(value) {
  return MONEDAS.includes(value) ? null : 'Moneda no válida';
}

/** Valida el formulario de registro. Regresa { errors, data }. */
export function validateRegister(body = {}) {
  const moneda = body.moneda ? String(body.moneda).toUpperCase() : 'MXN'; // MXN por defecto
  const errors = {};
  const checks = {
    nombre: validateNombre(body.nombre),
    email: validateEmail(body.email),
    password: validatePassword(body.password),
    moneda: validateMoneda(moneda),
  };
  for (const [field, message] of Object.entries(checks)) {
    if (message) errors[field] = message;
  }
  return {
    errors,
    data: {
      nombre: String(body.nombre ?? '').trim(),
      email: String(body.email ?? '')
        .trim()
        .toLowerCase(),
      password: String(body.password ?? ''),
      moneda,
    },
  };
}

// ---------- HU04 · Gastos ----------
export const MONTO_MAXIMO = 99999999.99;

/**
 * Valida un gasto. `hoy` llega como 'YYYY-MM-DD' (fecha de la BD) para no depender de la zona horaria.
 * Regresa { errors, data }.
 */
export function validateGasto(body = {}, hoy) {
  const errors = {};

  const descripcion = String(body.descripcion ?? '').trim();
  if (descripcion.length === 0) errors.descripcion = 'Escribe una descripción';
  else if (descripcion.length > 200) errors.descripcion = 'Máximo 200 caracteres';

  const montoTexto = String(body.monto ?? '')
    .trim()
    .replace(/,/g, '');
  let monto = null;
  if (montoTexto === '') {
    errors.monto = 'Ingresa un monto';
  } else if (!/^\d+(\.\d+)?$/.test(montoTexto) || Number(montoTexto) <= 0) {
    errors.monto = 'El monto debe ser mayor a 0';
  } else if (!/^\d+(\.\d{1,2})?$/.test(montoTexto)) {
    errors.monto = 'Usa máximo 2 decimales';
  } else if (Number(montoTexto) > MONTO_MAXIMO) {
    errors.monto = 'El monto es demasiado grande';
  } else {
    monto = Number(montoTexto);
  }

  const fecha = body.fecha ? String(body.fecha).trim() : hoy; // hoy por defecto
  const esFechaReal =
    /^\d{4}-\d{2}-\d{2}$/.test(fecha) &&
    new Date(`${fecha}T00:00:00Z`).toISOString().startsWith(fecha);
  if (!esFechaReal) errors.fecha = 'Fecha no válida';
  else if (fecha > hoy) errors.fecha = 'La fecha no puede ser futura';

  return { errors, data: { descripcion, monto, fecha } };
}
