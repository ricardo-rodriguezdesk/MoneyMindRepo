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

/** 'YYYY-MM' → nombre del mes en español ("octubre"); `offset` mueve meses (−1 = el anterior). */
export function monthName(yearMonth, offset = 0) {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month - 1 + offset, 1).toLocaleDateString('es-MX', { month: 'long' });
}

/** 62.7 → "+62.7 %", −19.8 → "−19.8 %" */
export function formatVariation(value) {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${Math.abs(value).toFixed(1)} %`;
}
