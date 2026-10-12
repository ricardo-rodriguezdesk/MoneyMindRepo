/** Formato de dinero según la moneda del usuario: $1,234.50 */
export function formatMoney(amount, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount);
}

/** 'YYYY-MM-DD' → "9 oct 2026" (sin desfase de zona horaria) */
export function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Fecha de hoy en la zona del dispositivo como 'YYYY-MM-DD' */
export function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
